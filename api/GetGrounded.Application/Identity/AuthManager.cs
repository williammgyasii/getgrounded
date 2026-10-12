using GetGrounded.Domain.Identity;

namespace GetGrounded.Application.Identity;

public sealed class AuthManager(IAuthTokenAccessor tokens, IAuthUserAccessor users, AuthEngine engine)
{
    public async Task<User?> IdentifyAsync(string token, CancellationToken cancellationToken = default)
    {
        var loginId = await tokens.VerifyLoginIdAsync(token, cancellationToken);
        if (loginId is null)
        {
            return null;
        }

        var user = await users.FindOrCreateAsync(loginId, cancellationToken);
        return engine.Accept(user);
    }
}
