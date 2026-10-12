using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class RejectMiddayExtractAccessor : IMiddayExtractAccessor
{
    public Task<MiddayDraft> ExtractMiddayAsync(
        string transcript,
        DayRecord day,
        CancellationToken cancellationToken = default) =>
        throw new ModelUnavailableException();
}
