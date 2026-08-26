namespace GetGrounded.Domain;

public sealed class User
{
    public string Id { get; }

    private User(string id)
    {
        Id = id;
    }

    public static User FromIdentity(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException("User id is required.", nameof(id));
        }

        return new User(id.Trim());
    }
}
