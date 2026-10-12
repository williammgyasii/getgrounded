using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Time;
using GetGrounded.Infrastructure.Data;
using GetGrounded.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GetGrounded.Infrastructure.Book;

public sealed class PostgresBookDayAccessor(IDbContextFactory<GroundedDbContext> dbFactory) : IBookDayAccessor
{
    public async Task<DayRecord> SaveMorningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        string? coachNote = null,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);

        var day = await db.Days
            .FirstOrDefaultAsync(row => row.UserId == userId && row.LocalDate == localDate, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        if (day is null)
        {
            day = new DayRow
            {
                Id = Guid.CreateVersion7(),
                UserId = userId,
                LocalDate = localDate,
                Timezone = timezone,
                ShowedUp = true,
                Title = title,
                CoachNote = coachNote,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.Days.Add(day);
        }
        else
        {
            day.Timezone = timezone;
            day.ShowedUp = true;
            if (title is not null)
            {
                day.Title = title;
            }

            if (coachNote is not null)
            {
                day.CoachNote = coachNote;
            }

            day.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);

        await db.Commitments
            .Where(row => row.UserId == userId && row.DayId == day.Id && row.Source == "MORNING_EXTRACT")
            .ExecuteDeleteAsync(cancellationToken);

        db.VoiceSessions.Add(new VoiceSessionRow
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            DayId = day.Id,
            Kind = "MORNING_PLAN",
            Transcript = transcript,
            ProcessingStatus = "EXTRACTED",
            StorageKey = storageKey,
            WordsJson = DayRecordMapper.WriteWords(words),
            CreatedAt = now
        });

        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            db.Commitments.Add(new CommitmentRow
            {
                Id = Guid.CreateVersion7(),
                UserId = userId,
                DayId = day.Id,
                Title = item.Title,
                Status = "PLANNED",
                PlannedDurationMinutes = item.PlannedDurationMinutes,
                PlannedAt = item.PlannedStartMinute is int minute
                    ? LocalClock.At(timezone, localDate, minute)
                    : null,
                LifeArea = item.LifeArea,
                Source = "MORNING_EXTRACT",
                SortOrder = index,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return (await LoadDayAsync(userId, localDate, cancellationToken))!;
    }

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default) =>
        LoadDayAsync(userId, localDate, cancellationToken);

    public async Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var dates = await db.Days
            .AsNoTracking()
            .Where(row => row.UserId == userId && row.LocalDate >= from && row.LocalDate <= to)
            .OrderByDescending(row => row.LocalDate)
            .Select(row => row.LocalDate)
            .ToListAsync(cancellationToken);

        var days = new List<DayRecord>(dates.Count);
        foreach (var date in dates)
        {
            var day = await LoadDayAsync(userId, date, cancellationToken);
            if (day is not null)
            {
                days.Add(day);
            }
        }

        return days;
    }

    public async Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        return await db.Days
            .AsNoTracking()
            .Where(row => row.UserId == userId && row.ShowedUp)
            .OrderByDescending(row => row.LocalDate)
            .Select(row => row.LocalDate)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var day = await db.Days
            .AsNoTracking()
            .FirstOrDefaultAsync(row => row.Id == dayId && row.UserId == userId, cancellationToken);
        if (day is null)
        {
            throw new BookDayNotFoundException();
        }

        await db.Commitments.Where(row => row.DayId == dayId && row.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await db.VoiceSessions.Where(row => row.DayId == dayId && row.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await db.Wins.Where(row => row.DayId == dayId && row.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await db.Days.Where(row => row.Id == dayId && row.UserId == userId).ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<DayRecord> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var day = await db.Days.FirstOrDefaultAsync(row => row.Id == dayId && row.UserId == userId, cancellationToken);
        if (day is null)
        {
            throw new BookDayNotFoundException();
        }

        day.Title = title;
        day.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return (await LoadDayAsync(userId, day.LocalDate, cancellationToken))!;
    }

    public async Task<DayRecord> SetCommitmentStatusAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var item = await db.Commitments
            .Include(row => row.Day)
            .FirstOrDefaultAsync(row => row.Id == commitmentId && row.UserId == userId, cancellationToken);
        if (item is null)
        {
            throw new BookCommitmentNotFoundException();
        }

        item.Status = status;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return (await LoadDayAsync(userId, item.Day.LocalDate, cancellationToken))!;
    }

    public async Task<DayRecord> DeleteCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var item = await db.Commitments
            .Include(row => row.Day)
            .FirstOrDefaultAsync(row => row.Id == commitmentId && row.UserId == userId, cancellationToken);
        if (item is null)
        {
            throw new BookCommitmentNotFoundException();
        }

        var localDate = item.Day.LocalDate;
        await db.Commitments.Where(row => row.Id == commitmentId && row.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        return (await LoadDayAsync(userId, localDate, cancellationToken))!;
    }

    private async Task<DayRecord?> LoadDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        var day = await db.Days
            .AsNoTracking()
            .Include(row => row.Commitments)
            .Include(row => row.Wins)
            .Include(row => row.VoiceSessions)
            .FirstOrDefaultAsync(row => row.UserId == userId && row.LocalDate == localDate, cancellationToken);

        return day is null ? null : DayRecordMapper.ToRecord(day);
    }

    public async Task<string?> GetVoiceSessionStorageKeyAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        await using var db = await dbFactory.CreateDbContextAsync(cancellationToken);
        return await db.VoiceSessions
            .AsNoTracking()
            .Where(row => row.Id == sessionId && row.UserId == userId)
            .Select(row => row.StorageKey)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
