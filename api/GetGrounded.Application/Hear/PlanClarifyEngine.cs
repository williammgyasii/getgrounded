using System.Text;
using System.Text.RegularExpressions;

namespace GetGrounded.Application.Hear;

public static partial class PlanClarifyEngine
{
    private static readonly Regex Clock =
        new(
            @"\b(\d{1,2})(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b|\b(at|around)\s+\d{1,2}\b|\b\d{1,2}\s*(pm|am)\b|\bdawn\b|\bnoon\b|\bmidnight\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex Duration =
        new(
            @"\b(\d+|an?|one|two|three|four|five|six)\s*(hours?|hrs?|minutes?|mins?)\b|\bfor\s+(an?\s+)?hour\b|\bhalf\s+an?\s+hour\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static string EnrichBlob(string transcript, IReadOnlyList<ClarifyExchange> priorAnswers)
    {
        var builder = new StringBuilder(transcript.Trim());
        foreach (var row in priorAnswers)
        {
            if (string.IsNullOrWhiteSpace(row.Answer))
            {
                continue;
            }

            builder.Append(' ');
            builder.Append(row.Prompt);
            builder.Append(' ');
            builder.Append(row.Answer);
        }

        return builder.ToString();
    }

    public static IReadOnlyList<ClarifyQuestion> DropRedundantQuestions(
        string transcript,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        IReadOnlyList<ClarifyQuestion> questions)
    {
        var blob = EnrichBlob(transcript, priorAnswers);
        return questions.Where(item => !IsRedundant(item, blob)).ToList();
    }

    public static IReadOnlyList<ClarifyQuestion> DropRepeatedPrompts(
        IReadOnlyList<ClarifyExchange> priorAnswers,
        IReadOnlyList<ClarifyQuestion> questions)
    {
        var asked = priorAnswers
            .Select(row => NormalizePrompt(row.Prompt))
            .Where(row => row.Length > 0)
            .ToHashSet(StringComparer.Ordinal);

        return questions
            .Where(item => !asked.Contains(NormalizePrompt(item.Prompt)))
            .ToList();
    }

    public static IReadOnlyList<ClarifyQuestion> FilterQuestions(
        string transcript,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        IReadOnlyList<ClarifyQuestion> questions)
    {
        var next = DropRepeatedPrompts(priorAnswers, questions);
        next = DropAfterUnknownAnswers(priorAnswers, next);
        return DropRedundantQuestions(transcript, priorAnswers, next);
    }

    public static bool IsUnknownAnswer(string? answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
        {
            return false;
        }

        return UnknownAnswer().IsMatch(answer.Trim());
    }

    public static IReadOnlyList<ClarifyQuestion> DropAfterUnknownAnswers(
        IReadOnlyList<ClarifyExchange> priorAnswers,
        IReadOnlyList<ClarifyQuestion> questions)
    {
        return questions.Where(item => !ShouldSkipAfterUnknown(priorAnswers, item)).ToList();
    }

    private static bool ShouldSkipAfterUnknown(IReadOnlyList<ClarifyExchange> priorAnswers, ClarifyQuestion question)
    {
        foreach (var row in priorAnswers)
        {
            if (!IsUnknownAnswer(row.Answer))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(question.Topic) && TopicsAlign(question.Topic, row.Prompt))
            {
                return true;
            }

            if (PromptsOverlap(question.Prompt, row.Prompt))
            {
                return true;
            }
        }

        return false;
    }

    private static bool PromptsOverlap(string left, string right)
    {
        var a = NormalizePrompt(left);
        var b = NormalizePrompt(right);
        if (a.Length == 0 || b.Length == 0)
        {
            return false;
        }

        if (a == b || a.Contains(b, StringComparison.Ordinal) || b.Contains(a, StringComparison.Ordinal))
        {
            return true;
        }

        return ReadingHint().IsMatch(left) && ReadingHint().IsMatch(right)
            || GymHint().IsMatch(left) && GymHint().IsMatch(right)
            || CookingHint().IsMatch(left) && CookingHint().IsMatch(right)
            || CallsHint().IsMatch(left) && CallsHint().IsMatch(right);
    }

    private static bool TopicsAlign(string? topic, string prompt)
    {
        if (string.IsNullOrWhiteSpace(topic))
        {
            return true;
        }

        var key = topic.Trim();
        if (prompt.Contains(key, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (key.Equals("reading", StringComparison.OrdinalIgnoreCase))
        {
            return ReadingHint().IsMatch(prompt);
        }

        if (key.Equals("gym", StringComparison.OrdinalIgnoreCase))
        {
            return GymHint().IsMatch(prompt);
        }

        if (key.Equals("cooking", StringComparison.OrdinalIgnoreCase))
        {
            return CookingHint().IsMatch(prompt);
        }

        if (key.Equals("calls", StringComparison.OrdinalIgnoreCase))
        {
            return CallsHint().IsMatch(prompt);
        }

        return false;
    }

    private static bool IsRedundant(ClarifyQuestion question, string blob)
    {
        if (!TopicMentioned(question.Topic, blob))
        {
            return false;
        }

        var lower = question.Prompt.ToLowerInvariant();
        if (lower.Contains("how long") || lower.Contains("duration") || lower.Contains("spend") || lower.Contains("finish"))
        {
            return Duration.IsMatch(blob);
        }

        if (lower.Contains("what time") || lower.Contains("when do") || lower.Contains("when should") || lower.Contains("when will"))
        {
            return Clock.IsMatch(blob);
        }

        return false;
    }

    private static bool TopicMentioned(string? topic, string blob)
    {
        if (string.IsNullOrWhiteSpace(topic))
        {
            return true;
        }

        var key = topic.Trim();
        if (blob.Contains(key, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (key.Equals("reading", StringComparison.OrdinalIgnoreCase))
        {
            return ReadingHint().IsMatch(blob);
        }

        if (key.Equals("gym", StringComparison.OrdinalIgnoreCase))
        {
            return GymHint().IsMatch(blob);
        }

        if (key.Equals("cooking", StringComparison.OrdinalIgnoreCase))
        {
            return CookingHint().IsMatch(blob);
        }

        return false;
    }

    private static string NormalizePrompt(string prompt) =>
        PromptNoise().Replace(prompt.ToLowerInvariant(), " ").Trim();

    [GeneratedRegex(@"\bread\b|\bbook\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ReadingHint();

    [GeneratedRegex(@"\bgym\b|\bworkout\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex GymHint();

    [GeneratedRegex(@"\bcook\b|\bmeal\b|\bdinner\b|\brecipe\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CookingHint();

    [GeneratedRegex(@"[^a-z0-9\s]", RegexOptions.CultureInvariant)]
    private static partial Regex PromptNoise();

    [GeneratedRegex(@"\b(don'?t know|do not know|not sure|no idea|unsure|whatever|whenever|flexible|any time|anytime|doesn'?t matter|no clue|not yet)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex UnknownAnswer();

    [GeneratedRegex(@"\bcall\b|\bfriends\b|\bfamily\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CallsHint();
}
