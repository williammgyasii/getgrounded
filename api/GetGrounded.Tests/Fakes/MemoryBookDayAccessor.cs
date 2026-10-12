using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Tests.Fakes;

internal sealed class MemoryBookDayAccessor : IBookDayAccessor
{
    private readonly Dictionary<(Guid UserId, DateOnly Date), DayRecord> _days = new();
    private readonly Dictionary<Guid, string> _sessionKeys = new();

    public Task<DayRecord> SaveMorningAsync(
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
        var dayId = _days.TryGetValue((userId, localDate), out var existing)
            ? existing.Id
            : Guid.CreateVersion7();

        var commitments = items
            .Select((item, index) => new CommitmentRecord(
                Guid.CreateVersion7(),
                item.Title,
                "PLANNED",
                item.PlannedDurationMinutes,
                null,
                item.PlannedStartMinute,
                item.LifeArea,
                DateTimeOffset.UtcNow))
            .ToList();

        var clipId = Guid.CreateVersion7();
        var clip = new ClipRecord(
            clipId,
            "MORNING_PLAN",
            transcript,
            DateTimeOffset.UtcNow,
            storageKey is not null,
            words);
        if (storageKey is not null)
        {
            _sessionKeys[clipId] = storageKey;
        }

        var day = new DayRecord(
            dayId,
            localDate,
            timezone,
            true,
            title,
            commitments,
            [],
            [clip],
            coachNote);

        _days[(userId, localDate)] = day;
        return Task.FromResult(day);
    }

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default)
    {
        _days.TryGetValue((userId, localDate), out var day);
        return Task.FromResult(day);
    }

    public Task<DayRecord?> GetDayByIdAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default)
    {
        var entry = _days.FirstOrDefault(pair => pair.Key.UserId == userId && pair.Value.Id == dayId);
        return Task.FromResult<DayRecord?>(entry.Value);
    }

    public Task<DayRecord> ApplyMiddayUpdateAsync(
        Guid userId,
        Guid dayId,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> add,
        IReadOnlyList<MiddayOutcomeUpdate> outcomes,
        IReadOnlyList<MiddayExtra> extras,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default)
    {
        var entry = _days.FirstOrDefault(pair => pair.Key.UserId == userId && pair.Value.Id == dayId);
        if (entry.Value is null)
        {
            throw new BookDayNotFoundException();
        }

        var day = entry.Value;
        var statusById = outcomes.ToDictionary(row => row.Id, row => row.Status);
        var commitments = day.Commitments
            .Select(item => statusById.TryGetValue(item.Id, out var status)
                ? item with { Status = status }
                : item)
            .ToList();

        var sort = commitments.Count;
        foreach (var item in add)
        {
            commitments.Add(new CommitmentRecord(
                Guid.CreateVersion7(),
                item.Title,
                "PLANNED",
                item.PlannedDurationMinutes,
                null,
                item.PlannedStartMinute,
                item.LifeArea,
                DateTimeOffset.UtcNow));
            sort += 1;
        }

        var clipId = Guid.CreateVersion7();
        var clip = new ClipRecord(
            clipId,
            "MIDDAY_UPDATE",
            transcript,
            DateTimeOffset.UtcNow,
            storageKey is not null,
            words);
        if (storageKey is not null)
        {
            _sessionKeys[clipId] = storageKey;
        }

        var wins = day.Wins.ToList();
        foreach (var extra in extras)
        {
            wins.Add(new WinRecord(Guid.CreateVersion7(), extra.Title, extra.LifeArea));
        }

        var next = day with
        {
            Timezone = timezone,
            Commitments = commitments,
            Wins = wins,
            Clips = [.. day.Clips, clip],
        };
        _days[entry.Key] = next;
        return Task.FromResult(next);
    }

    public Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        var days = _days
            .Where(entry => entry.Key.UserId == userId
                && entry.Key.Date >= from
                && entry.Key.Date <= to)
            .Select(entry => entry.Value)
            .OrderByDescending(day => day.LocalDate)
            .ToList();
        return Task.FromResult<IReadOnlyList<DayRecord>>(days);
    }

    public Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var dates = _days
            .Where(entry => entry.Key.UserId == userId && entry.Value.ShowedUp)
            .Select(entry => entry.Key.Date)
            .OrderByDescending(date => date)
            .ToList();
        return Task.FromResult<IReadOnlyList<DateOnly>>(dates);
    }

    public Task DeleteDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default)
    {
        var entry = _days.FirstOrDefault(pair => pair.Key.UserId == userId && pair.Value.Id == dayId);
        if (entry.Value is null)
        {
            throw new BookDayNotFoundException();
        }

        _days.Remove(entry.Key);
        return Task.CompletedTask;
    }

    public Task<DayRecord> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        var entry = _days.FirstOrDefault(pair => pair.Key.UserId == userId && pair.Value.Id == dayId);
        if (entry.Value is null)
        {
            throw new BookDayNotFoundException();
        }

        var next = entry.Value with { Title = title };
        _days[entry.Key] = next;
        return Task.FromResult(next);
    }

    public Task<DayRecord> SetCommitmentStatusAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        foreach (var (key, day) in _days.Where(pair => pair.Key.UserId == userId).ToList())
        {
            var index = day.Commitments.ToList().FindIndex(item => item.Id == commitmentId);
            if (index < 0)
            {
                continue;
            }

            var commitments = day.Commitments.ToList();
            commitments[index] = commitments[index] with { Status = status };
            var next = day with { Commitments = commitments };
            _days[key] = next;
            return Task.FromResult(next);
        }

        throw new BookCommitmentNotFoundException();
    }

    public Task<DayRecord> DeleteCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default)
    {
        foreach (var (key, day) in _days.Where(pair => pair.Key.UserId == userId).ToList())
        {
            if (day.Commitments.All(item => item.Id != commitmentId))
            {
                continue;
            }

            var next = day with
            {
                Commitments = day.Commitments.Where(item => item.Id != commitmentId).ToList()
            };
            _days[key] = next;
            return Task.FromResult(next);
        }

        throw new BookCommitmentNotFoundException();
    }

    public Task<string?> GetVoiceSessionStorageKeyAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        foreach (var day in _days.Values.Where(row => row.Clips.Any(clip => clip.Id == sessionId)))
        {
            if (day.Clips.All(clip => clip.Id != sessionId))
            {
                continue;
            }

            _sessionKeys.TryGetValue(sessionId, out var key);
            return Task.FromResult<string?>(key);
        }

        return Task.FromResult<string?>(null);
    }
}
