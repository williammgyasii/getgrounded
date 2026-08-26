namespace GetGrounded.Application.Auth;

public interface ITokenVerifier
{
    Task<string?> VerifyUserIdAsync(string token, CancellationToken cancellationToken = default);
}
