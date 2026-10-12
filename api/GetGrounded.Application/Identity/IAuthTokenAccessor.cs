namespace GetGrounded.Application.Identity;

public interface IAuthTokenAccessor
{
    Task<string?> VerifyLoginIdAsync(string token, CancellationToken cancellationToken = default);
}
