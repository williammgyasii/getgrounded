using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class OpenAiPlanExtractAccessor(PlanExtractInterpreter interpreter) : IPlanExtractAccessor
{
    public Task<MorningDraft> ExtractMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default) =>
        interpreter.ReadMorningAsync(transcript, timezone, spokenAt, cancellationToken);
}
