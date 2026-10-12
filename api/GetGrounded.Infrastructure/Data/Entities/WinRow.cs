namespace GetGrounded.Infrastructure.Data.Entities;

public sealed class WinRow
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DayId { get; set; }
    public DayRow Day { get; set; } = null!;
    public string Title { get; set; } = "";
    public string Source { get; set; } = "";
    public string? LifeArea { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
