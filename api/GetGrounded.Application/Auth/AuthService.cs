using GetGrounded.Domain;

namespace GetGrounded.Application.Auth;

public sealed class AuthService(ITokenVerifier tokens, IUserStore users)
{
    public async Task<User?> IdentifyAsync(string token, CancellationToken cancellationToken = default)
    {
        var firebaseUid = await tokens.VerifyUserIdAsync(token, cancellationToken);
        if (firebaseUid is null)
        {
            return null;
        }

        var user = await users.FindOrCreateAsync(firebaseUid, cancellationToken);
        return user.DeletedAt is null ? user : null;
    }
}
