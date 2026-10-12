namespace GetGrounded.Infrastructure.Data.Entities;

public sealed class CommitmentRow
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DayId { get; set; }
    public DayRow Day { get; set; } = null!;
    public string Title { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTimeOffset? PlannedAt { get; set; }
    public int? PlannedDurationMinutes { get; set; }
    public int? ActualDurationMinutes { get; set; }
    public string? LifeArea { get; set; }
    public string? Reason { get; set; }
    public string Source { get; set; } = "";
    public float? Confidence { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
