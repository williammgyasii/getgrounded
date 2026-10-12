using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class RejectPlanExtractAccessor : IPlanExtractAccessor
{
    public Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default) =>
        throw new ModelUnavailableException();
}
