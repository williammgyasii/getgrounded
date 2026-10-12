using GetGrounded.Application.Time;
using GetGrounded.Domain.Book;

namespace GetGrounded.Application.Book;

public sealed class DeskManager(IBookDayAccessor book, IClock clock)
{
    public async Task<DeskRecord> LoadAsync(
        Guid userId,
        string timezone,
        CancellationToken cancellationToken = default)
    {
        var today = LocalDay.From(timezone, clock.UtcNow);
        var yesterday = today.AddDays(-1);
        var todayRecord = await book.GetDayAsync(userId, today, cancellationToken);
        var yesterdayRecord = await book.GetDayAsync(userId, yesterday, cancellationToken);
        var showedUp = await book.GetShowedUpDatesAsync(userId, cancellationToken);
        return new DeskRecord(today, Streak.Count(showedUp, today), todayRecord, yesterdayRecord);
    }
}
