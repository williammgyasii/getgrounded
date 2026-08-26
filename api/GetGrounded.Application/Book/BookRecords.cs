namespace GetGrounded.Application.Book;

public sealed record PlannedItem(string Title, int? PlannedDurationMinutes = null);

public sealed record OutcomeItem(
    Guid Id,
    string Status,
    int? ActualDurationMinutes = null,
    string? Reason = null);

public sealed record WinItem(string Title);

public sealed record CommitmentRecord(
    Guid Id,
    string Title,
    string Status,
    int? PlannedDurationMinutes,
    int? ActualDurationMinutes);

public sealed record WinRecord(Guid Id, string Title);

public sealed record DayRecord(
    Guid Id,
    DateOnly LocalDate,
    string Timezone,
    bool ShowedUp,
    string? Title,
    IReadOnlyList<CommitmentRecord> Commitments,
    IReadOnlyList<WinRecord> Wins);

public sealed record DeskRecord(DateOnly LocalDate, int StreakDays, DayRecord? Today, DayRecord? Yesterday);
