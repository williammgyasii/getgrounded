using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Book;

public sealed class UnconfiguredBookDayAccessor : IBookDayAccessor
{
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
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<DayRecord?> GetDayByIdAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

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
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task DeleteDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<DayRecord> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<DayRecord> SetCommitmentStatusAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<DayRecord> DeleteCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");

    public Task<string?> GetVoiceSessionStorageKeyAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Postgres book accessor is not configured yet.");
}
