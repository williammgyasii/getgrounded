using System.Text.RegularExpressions;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class HeuristicMiddayExtractAccessor : IMiddayExtractAccessor
{
    private static readonly Regex AddPattern = new(
        @"\b(?:also|and)\s+(?:want to|need to|like to|gonna|going to)\s+(.+?)(?:\.|$|\btoo\b|\balso\b)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex AddShort = new(
        @"\badd(?:ed)?\s+(.+?)(?:\.|$)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public Task<MiddayDraft> ExtractMiddayAsync(
        string transcript,
        DayRecord day,
        CancellationToken cancellationToken = default)
    {
        var outcomes = day.Commitments
            .Select(item => new MiddayOutcomeDraft(item.Id, InferStatus(transcript, item)))
            .ToList();

        var add = InferAdds(transcript, day.Commitments);
        return Task.FromResult(new MiddayDraft(add, outcomes, []));
    }

    private static IReadOnlyList<PlannedItem> InferAdds(
        string transcript,
        IReadOnlyList<CommitmentRecord> existing)
    {
        var titles = new List<string>();
        foreach (Match match in AddPattern.Matches(transcript))
        {
            titles.Add(CleanAddTitle(match.Groups[1].Value));
        }

        foreach (Match match in AddShort.Matches(transcript))
        {
            titles.Add(CleanAddTitle(match.Groups[1].Value));
        }

        if (titles.Count == 0 && LooksLikeStandaloneAdd(transcript))
        {
            titles.Add(CleanAddTitle(transcript));
        }

        var existingTitles = existing
            .Select(item => item.Title.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return titles
            .Select(title => Titles.Sentence(title))
            .Where(title => title.Length > 0 && !existingTitles.Contains(title))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(title => new PlannedItem(title, 30, null, "PERSONAL"))
            .ToList();
    }

    private static bool LooksLikeStandaloneAdd(string transcript)
    {
        var lower = transcript.Trim().ToLowerInvariant();
        return lower.Length > 0
            && lower.Length < 120
            && !Regex.IsMatch(lower, @"\b(finished|done|completed|cancelled|canceled|skip)\b");
    }

    private static string CleanAddTitle(string raw)
    {
        var trimmed = raw.Trim().TrimEnd('.', ',', ';');
        trimmed = Regex.Replace(trimmed, @"\b(too|also|as well)\b", "", RegexOptions.IgnoreCase).Trim();
        return trimmed;
    }

    private static string InferStatus(string transcript, CommitmentRecord item)
    {
        var title = Regex.Escape(item.Title.Trim());
        if (title.Length == 0)
        {
            return item.Status;
        }

        if (Regex.IsMatch(
                transcript,
                $@"\b(finished|done with|completed|wrapped|did)\s+{title}\b",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
        {
            return "COMPLETED";
        }

        if (Regex.IsMatch(
                transcript,
                $@"\b(skip|skipped|cancelled|canceled|dropped)\s+{title}\b",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
        {
            return "SKIPPED";
        }

        return item.Status;
    }
}
