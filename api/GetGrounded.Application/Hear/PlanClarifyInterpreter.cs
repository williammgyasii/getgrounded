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
        suggestedBlocks: ordered preview tasks for the day. Each has title, plannedStartMinute (0 to 1439, optional), plannedDurationMinutes (optional), source spoken or inferred.
        Add inferred blocks when helpful (e.g. wake up early becomes Wake up with a start time). Keep the same activity titles when scheduleVariant is alternate, only change times and order.
        {"museLine":"","questions":[{"id":"","prompt":"","topic":""}],"suggestedBlocks":[{"title":"","plannedStartMinute":0,"plannedDurationMinutes":0,"source":"spoken"}]}
        """;

    public async Task<PlanClarifyResult> ReadAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        PlanScheduleVariant scheduleVariant = PlanScheduleVariant.Default,
        CancellationToken cancellationToken = default)
    {
        var raw = await model.CompleteJsonAsync(
            System,
            UserClarify(transcript, timezone, priorAnswers, scheduleVariant),
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

        var blocks = ParseBlocks(payload.SuggestedBlocks);
        if (blocks.Count == 0)
        {
            blocks = PlanSuggestEngine.BuildBlocks(transcript, scheduleVariant).ToList();
        }
        else if (scheduleVariant == PlanScheduleVariant.Alternate)
        {
            blocks = PlanSuggestEngine.AlternateTimes(blocks, transcript).ToList();
        }

        return new PlanClarifyResult(AiPlainEnglish.Clean(museLine), questions, blocks);
    }

    private static List<PlanSuggestBlock> ParseBlocks(IReadOnlyList<ClarifyBlockRow>? rows)
    {
        if (rows is null || rows.Count == 0)
        {
            return [];
        }

        return rows
            .Where(row => !string.IsNullOrWhiteSpace(row.Title))
            .Select(row => new PlanSuggestBlock(
                AiPlainEnglish.Clean(row.Title!.Trim()),
                row.PlannedStartMinute,
                row.PlannedDurationMinutes,
                string.Equals(row.Source, "inferred", StringComparison.OrdinalIgnoreCase) ? "inferred" : "spoken"))
            .ToList();
    }

    private static string UserClarify(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        PlanScheduleVariant scheduleVariant)
    {
        var builder = new System.Text.StringBuilder();
        builder.AppendLine($"Timezone {timezone}.");
        builder.AppendLine($"scheduleVariant {scheduleVariant.ToString().ToLowerInvariant()}.");
        if (scheduleVariant == PlanScheduleVariant.Alternate)
        {
            builder.AppendLine("Offer a different schedule for the same activities: new times and order, no new activities.");
        }

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
        public List<ClarifyBlockRow>? SuggestedBlocks { get; set; }
    }

    private sealed class ClarifyBlockRow
    {
        public string? Title { get; set; }
        public int? PlannedStartMinute { get; set; }
        public int? PlannedDurationMinutes { get; set; }
        public string? Source { get; set; }
    }

    private sealed class ClarifyRow
    {
        public string? Id { get; set; }
        public string? Prompt { get; set; }
        public string? Topic { get; set; }
    }
}
