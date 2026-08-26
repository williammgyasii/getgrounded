using GetGrounded.Domain;

namespace GetGrounded.Tests;

public class UserTests
{
    [Fact]
    public void FromIdentity_keeps_the_firebase_uid()
    {
        var user = User.FromIdentity("firebase-uid-1");

        Assert.Equal("firebase-uid-1", user.Id);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FromIdentity_rejects_a_missing_id(string? id)
    {
        Assert.Throws<ArgumentException>(() => User.FromIdentity(id!));
    }
}
