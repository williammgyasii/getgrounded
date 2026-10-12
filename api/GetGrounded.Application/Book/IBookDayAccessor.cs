using GetGrounded.Application.Hear;

namespace GetGrounded.Application.Book;

public interface IBookDayAccessor
{
    Task<DayRecord> SaveMorningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        string? coachNote = null,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task DeleteDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default);

    Task<DayRecord> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default);

    Task<DayRecord> SetCommitmentStatusAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default);

    Task<DayRecord> DeleteCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default);

    Task<string?> GetVoiceSessionStorageKeyAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default);
}
