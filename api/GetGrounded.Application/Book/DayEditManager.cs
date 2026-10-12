namespace GetGrounded.Application.Book;

public sealed class DayEditManager(IBookDayAccessor access)
{
    public Task DeleteDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default) =>
        access.DeleteDayAsync(userId, dayId, cancellationToken);

    public Task<DayRecord> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        var trimmed = title.Trim();
        if (trimmed.Length == 0)
        {
            throw new ArgumentException("Title is required.");
        }

        return access.RenameDayAsync(userId, dayId, trimmed, cancellationToken);
    }

    public Task<DayRecord> SetCommitmentStatusAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        var normalized = status.Trim().ToUpperInvariant();
        if (normalized.Length == 0)
        {
            throw new ArgumentException("Status is required.");
        }

        return access.SetCommitmentStatusAsync(userId, commitmentId, normalized, cancellationToken);
    }

    public Task<DayRecord> DeleteCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default) =>
        access.DeleteCommitmentAsync(userId, commitmentId, cancellationToken);
}

public sealed class BookDayNotFoundException : Exception
{
    public BookDayNotFoundException() : base("Day not found.") { }
}

public sealed class BookCommitmentNotFoundException : Exception
{
    public BookCommitmentNotFoundException() : base("Commitment not found.") { }
}
