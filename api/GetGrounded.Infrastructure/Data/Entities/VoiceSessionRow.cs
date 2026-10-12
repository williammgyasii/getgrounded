namespace GetGrounded.Infrastructure.Data.Entities;

public sealed class VoiceSessionRow
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DayId { get; set; }
    public DayRow Day { get; set; } = null!;
    public string Kind { get; set; } = "";
    public string Transcript { get; set; } = "";
    public string ProcessingStatus { get; set; } = "";
    public string? ConversationId { get; set; }
    public string? StorageKey { get; set; }
    public string? WordsJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
