namespace GetGrounded.Infrastructure.Data.Entities;

public sealed class UserRow
{
    public Guid Id { get; set; }
    public string FirebaseUid { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public List<DayRow> Days { get; set; } = [];
}
