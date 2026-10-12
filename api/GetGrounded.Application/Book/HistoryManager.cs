using GetGrounded.Application.Time;
using GetGrounded.Domain.Book;

namespace GetGrounded.Application.Book;

public sealed class HistoryManager(IBookDayAccessor book, IClock clock)
{
    public async Task<IReadOnlyList<DayRecord>> ListAsync(
        Guid userId,
        string timezone,
        CancellationToken cancellationToken = default)
    {
        var today = LocalDay.From(timezone, clock.UtcNow);
        return await book.GetDaysAsync(userId, today.AddDays(-29), today, cancellationToken);
    }
}
