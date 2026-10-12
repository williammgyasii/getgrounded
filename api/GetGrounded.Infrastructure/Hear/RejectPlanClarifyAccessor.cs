using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class RejectPlanClarifyAccessor : IPlanClarifyAccessor
{
    public Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new PlanClarifyResult(string.Empty, []));
}
