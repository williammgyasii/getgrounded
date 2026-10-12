namespace GetGrounded.Application.Hear;

public interface IPlanClarifyAccessor
{
    Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        CancellationToken cancellationToken = default);
}
