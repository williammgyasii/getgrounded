namespace GetGrounded.Application.Hear;

public sealed class PlanClarifyManager(IPlanClarifyAccessor clarify)
{
    public Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange>? priorAnswers = null,
        PlanScheduleVariant scheduleVariant = PlanScheduleVariant.Default,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("transcript", nameof(transcript));
        }

        var prior = priorAnswers ?? [];
        return clarify.ClarifyMorningAsync(transcript.Trim(), timezone, prior, scheduleVariant, cancellationToken);
    }
}
