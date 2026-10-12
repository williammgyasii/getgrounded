using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class OpenAiMiddayExtractAccessor(MiddayExtractInterpreter interpreter) : IMiddayExtractAccessor
{
    public Task<MiddayDraft> ExtractMiddayAsync(
        string transcript,
        DayRecord day,
        CancellationToken cancellationToken = default) =>
        interpreter.ReadMiddayAsync(transcript, day, cancellationToken);
}
