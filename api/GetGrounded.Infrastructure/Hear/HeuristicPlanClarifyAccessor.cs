using System.Text;
using System.Text.RegularExpressions;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class HeuristicPlanClarifyAccessor : IPlanClarifyAccessor
{
    private static readonly Regex Clock =
        new(
            @"\b(\d{1,2})(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b|\b(at|around)\s+\d{1,2}\b|\b\d{1,2}\s*(pm|am)\b|\bdawn\b|\bnoon\b|\bmidnight\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex Duration =
        new(
            @"\b(\d+|an?|one|two|three)\s*(hours?|hrs?|minutes?|mins?)\b|\bfor\s+(an?\s+)?hour\b|\bhalf\s+an?\s+hour\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        PlanScheduleVariant scheduleVariant = PlanScheduleVariant.Default,
        CancellationToken cancellationToken = default)
    {
        var answered = priorAnswers
            .Where(row => !string.IsNullOrWhiteSpace(row.Answer))
            .Select(row => row.QuestionId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var enriched = Enrich(transcript, priorAnswers);
        var questions = new List<ClarifyQuestion>();
        foreach (var (pattern, id, topic, prompt) in Rules)
        {
            if (answered.Contains(id))
            {
                continue;
            }

            if (!Regex.IsMatch(enriched, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            {
                continue;
            }

            var slice = SliceAround(transcript, pattern);
            var topicText = $"{slice} {AnswersForTopic(priorAnswers, topic)}";
            if (Clock.IsMatch(topicText) || Duration.IsMatch(topicText))
            {
                continue;
            }

            questions.Add(new ClarifyQuestion(id, prompt, topic));
            if (questions.Count >= 1)
            {
                break;
            }
        }

        var museLine = priorAnswers.Count > 0
            ? "Got it. I will build your plan from this."
            : questions.Count > 0
                ? "Here is how I would shape your day. One quick check below, or just tell me what to change when you record."
                : BuildProposal(transcript);

        if (priorAnswers.Count > 0)
        {
            questions = [];
        }

        var filtered = PlanClarifyEngine.FilterQuestions(transcript, priorAnswers, questions);
        var blocks = PlanSuggestEngine.BuildBlocks(transcript, scheduleVariant);
        if (scheduleVariant == PlanScheduleVariant.Alternate && priorAnswers.Count == 0)
        {
            museLine = "Here is another way to slot the same plan. Same activities, different times.";
        }

        return Task.FromResult(new PlanClarifyResult(museLine, filtered, blocks));
    }

    private static string BuildProposal(string transcript)
    {
        var bits = new List<string> { "I heard your plan." };
        if (Regex.IsMatch(transcript, @"\bcook\b", RegexOptions.IgnoreCase))
        {
            bits.Add("I would block about two hours for cooking.");
        }

        if (Regex.IsMatch(transcript, @"\bclean\b", RegexOptions.IgnoreCase))
        {
            bits.Add("Cleaning fits in a focused thirty to forty five minute slot.");
        }

        if (Regex.IsMatch(transcript, @"\bread\b|\bbook\b", RegexOptions.IgnoreCase))
        {
            bits.Add("Reading could be an hour when you have quiet time.");
        }

        if (Regex.IsMatch(transcript, @"\bgym\b|\bworkout\b", RegexOptions.IgnoreCase))
        {
            bits.Add("Gym around forty five minutes works well.");
        }

        bits.Add("Tap record only if you want to tweak this, or build your day when you are ready.");
        return string.Join(' ', bits);
    }

    private static string AnswersForTopic(IReadOnlyList<ClarifyExchange> priorAnswers, string topic)
    {
        var answers = priorAnswers
            .Where(row => row.Prompt.Contains(topic, StringComparison.OrdinalIgnoreCase)
                || row.QuestionId.Contains(topic, StringComparison.OrdinalIgnoreCase))
            .Select(row => row.Answer);
        return string.Join(' ', answers);
    }

    private static string Enrich(string transcript, IReadOnlyList<ClarifyExchange> priorAnswers)
    {
        if (priorAnswers.Count == 0)
        {
            return transcript;
        }

        var builder = new StringBuilder(transcript.Trim());
        builder.Append("\n\nClarifications:\n");
        foreach (var row in priorAnswers)
        {
            if (string.IsNullOrWhiteSpace(row.Answer))
            {
                continue;
            }

            builder.Append(row.Prompt.Trim());
            builder.Append(": ");
            builder.AppendLine(row.Answer.Trim());
        }

        return builder.ToString();
    }

    private static string SliceAround(string transcript, string pattern)
    {
        var match = Regex.Match(transcript, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        if (!match.Success)
        {
            return transcript;
        }

        var start = Math.Max(0, match.Index - 40);
        var length = Math.Min(transcript.Length - start, match.Length + 80);
        return transcript.Substring(start, length);
    }

    private static readonly (string Pattern, string Id, string Topic, string Prompt)[] Rules =
    [
        (@"\bgym\b|\bwork\s*out\b|\bworkout\b", "gym-time", "gym", "What time do you want to hit the gym?"),
        (@"\bread\b|\bbook\b", "read-time", "reading", "What time do you want to read?"),
        (@"\bread\b|\bbook\b", "read-duration", "reading", "About how long do you want to read?"),
        (@"\bcall\b|\bfriends\b|\bfamily\b", "call-time", "calls", "When should we block time to call people?"),
        (@"\bcook\b|\bcooking\b|\brecipe\b|\bdinner\b|\bmeal\b", "cook-detail", "cooking", "Do you already have a recipe or meal in mind?"),
    ];
}
