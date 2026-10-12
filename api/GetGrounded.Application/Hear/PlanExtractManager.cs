namespace GetGrounded.Application.Hear;

public sealed class PlanExtractManager(IPlanExtractAccessor extract)
{
    public Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string? timezone,
        DateTimeOffset? spokenAt,
        CancellationToken cancellationToken = default)
    {
        PlanExtractEngine.RequireTranscript(transcript);
        var zone = PlanExtractEngine.RequireTimezone(timezone);
        return extract.ExtractMorningAsync(
            transcript,
            zone,
            spokenAt ?? DateTimeOffset.UtcNow,
            cancellationToken);
    }
}
