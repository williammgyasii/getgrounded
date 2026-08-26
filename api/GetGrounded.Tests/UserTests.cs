using GetGrounded.Domain;

namespace GetGrounded.Tests;

public class UserTests
{
    [Fact]
    public void Open_keeps_our_guid_and_the_firebase_uid()
    {
        var id = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");

        var user = User.Open(id, "firebase-uid-1");

        Assert.Equal(id, user.Id);
        Assert.Equal("firebase-uid-1", user.FirebaseUid);
        Assert.Null(user.DeletedAt);
    }

    [Fact]
    public void Open_rejects_an_empty_guid()
    {
        Assert.Throws<ArgumentException>(() => User.Open(Guid.Empty, "firebase-uid-1"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Open_rejects_a_missing_firebase_uid(string? firebaseUid)
    {
        Assert.Throws<ArgumentException>(() =>
            User.Open(Guid.Parse("0198c0a0-0000-7000-8000-000000000001"), firebaseUid!));
    }

    [Fact]
    public void Tombstone_keeps_the_firebase_uid_and_is_deleted()
    {
        var id = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");
        var deletedAt = DateTimeOffset.Parse("2026-08-26T06:00:00Z");

        var user = User.Tombstone(id, "firebase-uid-1", deletedAt);

        Assert.Equal(id, user.Id);
        Assert.Equal("firebase-uid-1", user.FirebaseUid);
        Assert.Equal(deletedAt, user.DeletedAt);
    }
}
