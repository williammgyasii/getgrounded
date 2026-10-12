namespace GetGrounded.Application.Hear;

public interface IPlanExtractAccessor
{
    Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default);
}
