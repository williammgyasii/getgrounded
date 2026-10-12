using System.Text.Json;

namespace GetGrounded.Application.Hear;

public sealed class PlanClarifyInterpreter(ILanguageModelAccessor model)
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private const string System =
        """
        Return JSON only.
        You are Nevo, a personal day-planning assistant. Read what they want to do today.
        Do not interrogate them with many questions. Propose a reasonable day instead.
        museLine is 3 to 5 short sentences (first person as Nevo): reflect what you heard, then suggest how you would slot the day with guessed durations and optional clock times (e.g. cook about two hours late morning, read one hour early afternoon). Sound like a helpful assistant, not a form.
        Use plain English only: no em dashes, en dashes, or hyphenated phrases. Use commas and periods instead.
        questions: at most ONE optional question total. Only include it if you truly cannot guess a schedule and one answer would unlock everything. Otherwise return an empty questions array.
        Each question id is stable kebab-case, topic is the activity keyword, prompt is one short spoken question.
        If they already answered in Already answered, or said they do not know, return no questions.
        If they named a clock time for an activity, do not ask duration for it. Prefer your proposal over asking.
        If nothing needs clarification, return an empty questions array.
        {"museLine":"","questions":[{"id":"","prompt":"","topic":""}]}
        """;

    public async Task<PlanClarifyResult> ReadAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        CancellationToken cancellationToken = default)
    {
        var raw = await model.CompleteJsonAsync(
            System,
            UserClarify(transcript, timezone, priorAnswers),
            cancellationToken);

        ClarifyPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<ClarifyPayload>(SliceJson(raw), Json)
                ?? throw new InterpretException("Empty clarify.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable clarify.");
        }

        var questions = (payload.Questions ?? [])
            .Select(row => row)
            .Where(row => !string.IsNullOrWhiteSpace(row.Prompt))
            .Select(row => new ClarifyQuestion(
                string.IsNullOrWhiteSpace(row.Id) ? Guid.NewGuid().ToString("N")[..8] : row.Id!.Trim(),
                AiPlainEnglish.Clean(row.Prompt),
                string.IsNullOrWhiteSpace(row.Topic) ? null : AiPlainEnglish.Clean(row.Topic)))
            .Take(1)
            .ToList();

        questions = PlanClarifyEngine.FilterQuestions(transcript, priorAnswers, questions).ToList();
        if (priorAnswers.Count > 0)
        {
            questions = [];
        }

        var museLine = string.IsNullOrWhiteSpace(payload.MuseLine)
            ? priorAnswers.Count > 0
                ? "Thanks. Almost ready to build your plan."
                : "I heard you. A couple quick questions before we build your plan."
            : AiPlainEnglish.Clean(payload.MuseLine);

        return new PlanClarifyResult(AiPlainEnglish.Clean(museLine), questions);
    }

    private static string UserClarify(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers)
    {
        var builder = new System.Text.StringBuilder();
        builder.AppendLine($"Timezone {timezone}.");
        builder.AppendLine("Transcript:");
        builder.AppendLine(transcript);
        if (priorAnswers.Count > 0)
        {
            builder.AppendLine();
            builder.AppendLine("Already answered:");
            foreach (var row in priorAnswers)
            {
                builder.Append("- ");
                builder.Append(row.Prompt);
                builder.Append(": ");
                builder.AppendLine(row.Answer);
            }
        }

        return builder.ToString();
    }

    private static string SliceJson(string raw)
    {
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            return raw;
        }

        return raw[start..(end + 1)];
    }

    private sealed class ClarifyPayload
    {
        public string? MuseLine { get; set; }
        public List<ClarifyRow>? Questions { get; set; }
    }

    private sealed class ClarifyRow
    {
        public string? Id { get; set; }
        public string? Prompt { get; set; }
        public string? Topic { get; set; }
    }
}
