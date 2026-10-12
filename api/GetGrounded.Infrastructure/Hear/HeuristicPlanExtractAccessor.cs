using System.Text.RegularExpressions;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed partial class HeuristicPlanExtractAccessor : IPlanExtractAccessor
{
    public Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default)
    {
        var lines = SplitLines(transcript);
        var commitments = lines
            .Select(line => new PlannedItem(line, PlannedDurationMinutes: 30))
            .ToList();

        string? title = null;
        if (commitments.Count > 0 && commitments[0].Title.Length <= 48 && !LooksLikeTask(commitments[0].Title))
        {
            title = commitments[0].Title;
            commitments = commitments.Skip(1).ToList();
        }

        return Task.FromResult(new MorningDraft(title, commitments));
    }

    private static IReadOnlyList<string> SplitLines(string transcript)
    {
        return LinePattern()
            .Split(transcript)
            .Select(line => line.Trim().TrimStart('-', '*', '•').Trim())
            .Where(line => line.Length > 0)
            .Select(Titles.Sentence)
            .ToList();
    }

    private static bool LooksLikeTask(string line) =>
        line.Contains(" for ", StringComparison.OrdinalIgnoreCase)
        || line.Contains(" at ", StringComparison.OrdinalIgnoreCase)
        || Regex.IsMatch(line, @"\d+\s*(min|hour|hr)", RegexOptions.IgnoreCase);

    [GeneratedRegex(@"\r?\n|(?<=[.!?])\s+")]
    private static partial Regex LinePattern();
}
