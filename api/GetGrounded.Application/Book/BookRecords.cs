using GetGrounded.Application.Hear;

namespace GetGrounded.Application.Book;

public sealed record PlannedItem(
    string Title,
    int? PlannedDurationMinutes = null,
    int? PlannedStartMinute = null,
    string? LifeArea = null);

public sealed record CommitmentRecord(
    Guid Id,
    string Title,
    string Status,
    int? PlannedDurationMinutes,
    int? ActualDurationMinutes,
    int? PlannedStartMinute = null,
    string? LifeArea = null,
    DateTimeOffset? CreatedAt = null);

public sealed record WinRecord(Guid Id, string Title, string? LifeArea = null);

public sealed record ClipRecord(
    Guid Id,
    string Kind,
    string Transcript,
    DateTimeOffset? CreatedAt = null,
    bool Playable = false,
    IReadOnlyList<SpokenWord>? Words = null);

public sealed record DayRecord(
    Guid Id,
    DateOnly LocalDate,
    string Timezone,
    bool ShowedUp,
    string? Title,
    IReadOnlyList<CommitmentRecord> Commitments,
    IReadOnlyList<WinRecord> Wins,
    IReadOnlyList<ClipRecord> Clips,
    string? CoachNote = null);

public sealed record DeskRecord(DateOnly LocalDate, int StreakDays, DayRecord? Today, DayRecord? Yesterday);
