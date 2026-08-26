using GetGrounded.Application.Time;
using GetGrounded.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Application.Book;

public sealed class BookService(IBookStore book, IClock clock, ILogger<BookService>? log = null)
{
    private readonly ILogger _log = log ?? NullLogger<BookService>.Instance;

    private static readonly HashSet<string> Statuses =
    [
        "PLANNED",
        "COMPLETED",
        "PARTIAL",
        "MISSED",
        "RESCHEDULED",
        "CANCELLED",
        "BLOCKED"
    ];

    public async Task<DayRecord> PlanMorningAsync(
        Guid userId,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        CancellationToken cancellationToken = default)
    {
        RequireSpeech(transcript);
        var localDate = LocalDay.From(timezone, clock.UtcNow);
        var planned = items
            .Select(item => item with { Title = item.Title.Trim() })
            .Where(item => item.Title.Length > 0)
            .ToList();
        var named = string.IsNullOrWhiteSpace(title) ? null : title.Trim();

        var day = await book.SaveMorningAsync(
            userId,
            localDate,
            timezone.Trim(),
            transcript,
            planned,
            named,
            cancellationToken);
        _log.LogInformation(
            "morning saved user={UserId} date={Date} items={Items} titled={Titled}",
            userId,
            localDate,
            planned.Count,
            named is not null);
        return day;
    }

    public async Task<DayRecord?> ReflectEveningAsync(
        Guid userId,
        string timezone,
        string transcript,
        IReadOnlyList<OutcomeItem> outcomes,
        IReadOnlyList<WinItem> wins,
        CancellationToken cancellationToken = default)
    {
        RequireSpeech(transcript);
        foreach (var outcome in outcomes)
        {
            if (!Statuses.Contains(outcome.Status))
            {
                throw new ArgumentException($"Unknown commitment status '{outcome.Status}'.", nameof(outcomes));
            }
        }

        var localDate = LocalDay.From(timezone, clock.UtcNow);
        var cleanedWins = wins
            .Select(win => win with { Title = win.Title.Trim() })
            .Where(win => win.Title.Length > 0)
            .ToList();

        return await book.SaveEveningAsync(
            userId,
            localDate,
            timezone.Trim(),
            transcript,
            outcomes,
            cleanedWins,
            cancellationToken);
    }

    public async Task<DeskRecord> GetDeskAsync(
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

    public async Task<IReadOnlyList<DayRecord>> GetHistoryAsync(
        Guid userId,
        string timezone,
        CancellationToken cancellationToken = default)
    {
        var today = LocalDay.From(timezone, clock.UtcNow);
        return await book.GetDaysAsync(userId, today.AddDays(-29), today, cancellationToken);
    }

    public Task<DayRecord?> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        var named = title.Trim();
        if (named.Length == 0)
        {
            throw new ArgumentException("Title is required.", nameof(title));
        }

        return book.RenameDayAsync(userId, dayId, named, cancellationToken);
    }

    public Task<bool> RemoveDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default)
    {
        return book.RemoveDayAsync(userId, dayId, cancellationToken);
    }

    public Task<DayRecord?> MarkCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var next = status.Trim().ToUpperInvariant();
        if (!Statuses.Contains(next))
        {
            throw new ArgumentException($"Unknown commitment status '{status}'.", nameof(status));
        }

        return book.MarkCommitmentAsync(userId, commitmentId, next, cancellationToken);
    }

    public Task<DayRecord?> RemoveCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default)
    {
        return book.RemoveCommitmentAsync(userId, commitmentId, cancellationToken);
    }

    private static void RequireSpeech(string transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript is required.", nameof(transcript));
        }
    }
}
