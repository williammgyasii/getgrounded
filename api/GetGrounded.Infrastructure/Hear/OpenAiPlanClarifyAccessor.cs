using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class OpenAiPlanClarifyAccessor(PlanClarifyInterpreter interpreter) : IPlanClarifyAccessor
{
    public Task<PlanClarifyResult> ClarifyMorningAsync(
        string transcript,
        string timezone,
        IReadOnlyList<ClarifyExchange> priorAnswers,
        CancellationToken cancellationToken = default) =>
        interpreter.ReadAsync(transcript, timezone, priorAnswers, cancellationToken);
}
