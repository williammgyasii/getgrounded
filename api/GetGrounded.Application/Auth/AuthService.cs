namespace GetGrounded.Application.Auth;

public sealed class AuthService(ITokenVerifier tokens, IUserStore users)
{
    public async Task<string?> IdentifyAsync(string token, CancellationToken cancellationToken = default)
    {
        var userId = await tokens.VerifyUserIdAsync(token, cancellationToken);
        if (userId is null)
        {
            return null;
        }

        await users.EnsureAsync(userId, cancellationToken);
        return userId;
    }
}
