using GetGrounded.Application.Auth;
using GetGrounded.Domain;

namespace GetGrounded.Tests.Fakes;

internal sealed class StubVerifier : ITokenVerifier
{
    public Task<string?> VerifyUserIdAsync(string token, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(token == "valid-test-token" ? "firebase-uid-1" : null);
    }
}

internal sealed class LivingUserStore : IUserStore
{
    public static readonly Guid UserId = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");

    public List<string> FirebaseUids { get; } = [];

    public Task<User> FindOrCreateAsync(string firebaseUid, CancellationToken cancellationToken = default)
    {
        FirebaseUids.Add(firebaseUid);
        return Task.FromResult(User.Open(UserId, firebaseUid));
    }
}

internal sealed class TombstoneUserStore : IUserStore
{
    public Task<User> FindOrCreateAsync(string firebaseUid, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(User.Tombstone(
            Guid.Parse("0198c0a0-0000-7000-8000-000000000001"),
            firebaseUid,
            DateTimeOffset.Parse("2026-08-26T06:00:00Z")));
    }
}
