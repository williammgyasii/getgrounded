using GetGrounded.Application.Book;

namespace GetGrounded.Tests.Fakes;

public sealed class MemoryBookStore : IBookStore
{
    private readonly Dictionary<(Guid UserId, DateOnly Date), DayState> _days = [];
    private readonly Dictionary<Guid, string?> _clipKeys = [];

    public Task<DayRecord> SaveMorningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        string? storageKey = null,
        CancellationToken cancellationToken = default)
    {
        _ = transcript;
        var day = GetOrCreate(userId, localDate, timezone);
        if (title is not null)
        {
            day.Title = title;
        }

        var clipId = Guid.CreateVersion7();
        _clipKeys[clipId] = storageKey;
        day.Clips.Add(new ClipRecord(
            clipId,
            "MORNING_PLAN",
            transcript,
            DateTimeOffset.UtcNow,
            storageKey is not null));
        foreach (var item in items)
        {
            day.Commitments.Add(new CommitmentRecord(
                Guid.CreateVersion7(),
                item.Title,
                "PLANNED",
                item.PlannedDurationMinutes,
                null,
                item.PlannedStartMinute,
                item.LifeArea,
                DateTimeOffset.UtcNow));
        }

        return Task.FromResult(day.ToRecord());
    }

    public Task<DayRecord?> SaveEveningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<OutcomeItem> outcomes,
        IReadOnlyList<WinItem> wins,
        CancellationToken cancellationToken = default)
    {
        var day = GetOrCreate(userId, localDate, timezone);
        var clipId = Guid.CreateVersion7();
        _clipKeys[clipId] = null;
        day.Clips.Add(new ClipRecord(clipId, "EVENING_REFLECTION", transcript, DateTimeOffset.UtcNow));
        foreach (var outcome in outcomes)
        {
            var index = day.Commitments.FindIndex(item => item.Id == outcome.Id);
            if (index < 0)
            {
                throw new ArgumentException("One or more outcomes do not belong to this day.");
            }

            var current = day.Commitments[index];
            day.Commitments[index] = current with
            {
                Status = outcome.Status,
                ActualDurationMinutes = outcome.ActualDurationMinutes
            };
        }

        foreach (var win in wins)
        {
            day.Wins.Add(new WinRecord(Guid.CreateVersion7(), win.Title));
        }

        return Task.FromResult<DayRecord?>(day.ToRecord());
    }

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_days.TryGetValue((userId, localDate), out var day) ? day.ToRecord() : null);
    }

    public Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<DayRecord> days = _days.Values
            .Where(day => day.UserId == userId && day.LocalDate >= from && day.LocalDate <= to)
            .OrderByDescending(day => day.LocalDate)
            .Select(day => day.ToRecord())
            .ToList();
        return Task.FromResult(days);
    }

    public Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<DateOnly> dates = _days.Values
            .Where(day => day.UserId == userId && day.ShowedUp)
            .Select(day => day.LocalDate)
            .OrderByDescending(date => date)
            .ToList();
        return Task.FromResult(dates);
    }

    public Task<DayRecord?> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        var day = Find(userId, dayId);
        if (day is null)
        {
            return Task.FromResult<DayRecord?>(null);
        }

        day.Title = title;
        return Task.FromResult<DayRecord?>(day.ToRecord());
    }

    public Task<IReadOnlyList<string>> ListClipKeysAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default)
    {
        var day = Find(userId, dayId);
        if (day is null)
        {
            return Task.FromResult<IReadOnlyList<string>>([]);
        }

        IReadOnlyList<string> keys = day.Clips
            .Select(clip => _clipKeys.TryGetValue(clip.Id, out var key) ? key : null)
            .Where(key => key is not null)
            .Cast<string>()
            .ToList();
        return Task.FromResult(keys);
    }

    public Task<bool> RemoveDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default)
    {
        var day = Find(userId, dayId);
        if (day is null)
        {
            return Task.FromResult(false);
        }

        foreach (var clip in day.Clips)
        {
            _clipKeys.Remove(clip.Id);
        }

        _days.Remove((day.UserId, day.LocalDate));
        return Task.FromResult(true);
    }

    public Task<DayRecord?> MarkCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var day = FindByCommitment(userId, commitmentId);
        if (day is null)
        {
            return Task.FromResult<DayRecord?>(null);
        }

        var index = day.Commitments.FindIndex(item => item.Id == commitmentId);
        day.Commitments[index] = day.Commitments[index] with { Status = status };
        return Task.FromResult<DayRecord?>(day.ToRecord());
    }

    public Task<DayRecord?> RemoveCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default)
    {
        var day = FindByCommitment(userId, commitmentId);
        if (day is null)
        {
            return Task.FromResult<DayRecord?>(null);
        }

        day.Commitments.RemoveAll(item => item.Id == commitmentId);
        return Task.FromResult<DayRecord?>(day.ToRecord());
    }

    public Task<ClipPointer?> GetClipAsync(
        Guid userId,
        Guid clipId,
        CancellationToken cancellationToken = default)
    {
        var day = _days.Values.FirstOrDefault(item =>
            item.UserId == userId && item.Clips.Any(clip => clip.Id == clipId));
        if (day is null)
        {
            return Task.FromResult<ClipPointer?>(null);
        }

        _clipKeys.TryGetValue(clipId, out var storageKey);
        return Task.FromResult<ClipPointer?>(new ClipPointer(clipId, storageKey));
    }

    private DayState? Find(Guid userId, Guid dayId) =>
        _days.Values.FirstOrDefault(day => day.UserId == userId && day.Id == dayId);

    private DayState? FindByCommitment(Guid userId, Guid commitmentId) =>
        _days.Values.FirstOrDefault(day =>
            day.UserId == userId && day.Commitments.Any(item => item.Id == commitmentId));

    private DayState GetOrCreate(Guid userId, DateOnly localDate, string timezone)
    {
        var key = (userId, localDate);
        if (_days.TryGetValue(key, out var existing))
        {
            existing.Timezone = timezone;
            existing.ShowedUp = true;
            return existing;
        }

        var created = new DayState
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            LocalDate = localDate,
            Timezone = timezone,
            ShowedUp = true
        };
        _days[key] = created;
        return created;
    }

    private sealed class DayState
    {
        public Guid Id { get; init; }
        public Guid UserId { get; init; }
        public DateOnly LocalDate { get; init; }
        public string Timezone { get; set; } = "";
        public bool ShowedUp { get; set; }
        public string? Title { get; set; }
        public List<CommitmentRecord> Commitments { get; } = [];
        public List<WinRecord> Wins { get; } = [];
        public List<ClipRecord> Clips { get; } = [];

        public DayRecord ToRecord() =>
            new(Id, LocalDate, Timezone, ShowedUp, Title, Commitments.ToList(), Wins.ToList(), Clips.ToList());
    }
}
