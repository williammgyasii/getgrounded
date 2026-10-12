namespace GetGrounded.Application.Hear;

public sealed class PlanClarifyManager(IPlanClarifyAccessor clarify)
{
    public Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange>? priorAnswers = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("transcript", nameof(transcript));
        }

        var prior = priorAnswers ?? [];
        return clarify.ClarifyMorningAsync(transcript.Trim(), timezone, prior, cancellationToken);
    }
}
