namespace GetGrounded.Domain.Identity;

public sealed class User
{
    public Guid Id { get; }
    public string LoginId { get; }
    public DateTimeOffset? DeletedAt { get; }

    private User(Guid id, string loginId, DateTimeOffset? deletedAt)
    {
        Id = id;
        LoginId = loginId;
        DeletedAt = deletedAt;
    }

    public static User Open(Guid id, string loginId)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(loginId))
        {
            throw new ArgumentException("Login id is required.", nameof(loginId));
        }

        return new User(id, loginId.Trim(), deletedAt: null);
    }

    public static User Tombstone(Guid id, string loginId, DateTimeOffset deletedAt)
    {
        var living = Open(id, loginId);
        return new User(living.Id, living.LoginId, deletedAt);
    }
}
