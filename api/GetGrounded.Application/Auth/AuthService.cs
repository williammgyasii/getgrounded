using GetGrounded.Domain;

namespace GetGrounded.Application.Auth;

public sealed class AuthService(ITokenVerifier tokens, IUserStore users)
{
    public async Task<User?> IdentifyAsync(string token, CancellationToken cancellationToken = default)
    {
        var userId = await tokens.VerifyUserIdAsync(token, cancellationToken);
        if (userId is null)
        {
            return null;
        }

        var user = User.FromIdentity(userId);
        await users.EnsureAsync(user, cancellationToken);
        return user;
    }
}
