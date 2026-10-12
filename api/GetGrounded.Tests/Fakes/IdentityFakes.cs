using GetGrounded.Application.Identity;
using GetGrounded.Domain.Identity;

namespace GetGrounded.Tests.Fakes;

internal sealed class StubAuthTokenAccessor : IAuthTokenAccessor
{
    public Task<string?> VerifyLoginIdAsync(string token, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(token == "valid-test-token" ? "firebase-uid-1" : null);
    }
}

internal sealed class StubAuthUserAccessor : IAuthUserAccessor
{
    public static readonly Guid UserId = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");

    public List<string> LoginIds { get; } = [];

    public Task<User> FindOrCreateAsync(string loginId, CancellationToken cancellationToken = default)
    {
        LoginIds.Add(loginId);
        return Task.FromResult(User.Open(UserId, loginId));
    }
}

internal sealed class TombstoneAuthUserAccessor : IAuthUserAccessor
{
    public Task<User> FindOrCreateAsync(string loginId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(User.Tombstone(
            Guid.Parse("0198c0a0-0000-7000-8000-000000000001"),
            loginId,
            DateTimeOffset.Parse("2026-08-26T06:00:00Z")));
    }
}
