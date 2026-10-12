using GetGrounded.Application.Book;

namespace GetGrounded.Application.Hear;

public interface IMiddayExtractAccessor
{
    Task<MiddayDraft> ExtractMiddayAsync(
        string transcript,
        DayRecord day,
        CancellationToken cancellationToken = default);
}
