namespace GetGrounded.Infrastructure.Data.Entities;

public sealed class DayRow
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public UserRow User { get; set; } = null!;
    public DateOnly LocalDate { get; set; }
    public string Timezone { get; set; } = "";
    public bool ShowedUp { get; set; }
    public string? Title { get; set; }
    public string? CoachNote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<CommitmentRow> Commitments { get; set; } = [];
    public List<WinRow> Wins { get; set; } = [];
    public List<VoiceSessionRow> VoiceSessions { get; set; } = [];
}
