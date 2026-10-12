namespace GetGrounded.Application.Hear;

public interface IPlanClarifyAccessor
{
    Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        PlanScheduleVariant scheduleVariant = PlanScheduleVariant.Default,
        CancellationToken cancellationToken = default);
}
