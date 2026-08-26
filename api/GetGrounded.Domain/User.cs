namespace GetGrounded.Domain;

public sealed class User
{
    public Guid Id { get; }
    public string FirebaseUid { get; }
    public DateTimeOffset? DeletedAt { get; }

    private User(Guid id, string firebaseUid, DateTimeOffset? deletedAt)
    {
        Id = id;
        FirebaseUid = firebaseUid;
        DeletedAt = deletedAt;
    }

    public static User Open(Guid id, string firebaseUid)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(firebaseUid))
        {
            throw new ArgumentException("Firebase uid is required.", nameof(firebaseUid));
        }

        return new User(id, firebaseUid.Trim(), deletedAt: null);
    }

    public static User Tombstone(Guid id, string firebaseUid, DateTimeOffset deletedAt)
    {
        var living = Open(id, firebaseUid);
        return new User(living.Id, living.FirebaseUid, deletedAt);
    }
}
