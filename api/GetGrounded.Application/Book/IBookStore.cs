using GetGrounded.Application.Voice;

namespace GetGrounded.Application.Book;

public interface IBookStore
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
        CancellationToken cancellationToken = default);

    Task<DayRecord?> SaveEveningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<OutcomeItem> outcomes,
        IReadOnlyList<WinItem> wins,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> GetDayByIdAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> ListClipKeysAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> MarkCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default);

    Task<DayRecord?> RemoveCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default);

    Task<ClipPointer?> GetClipAsync(
        Guid userId,
        Guid clipId,
        CancellationToken cancellationToken = default);
}
