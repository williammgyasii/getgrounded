using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Tests.Fakes;

internal sealed class StubPlanExtractAccessor : IPlanExtractAccessor
{
    public Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default)
    {
        var lines = transcript
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => line.Length > 0)
            .Select(line => new PlannedItem(line, PlannedDurationMinutes: 30))
            .ToList();

        return Task.FromResult(new MorningDraft(null, lines));
    }
}
