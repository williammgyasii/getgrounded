using GetGrounded.Application.Identity;

namespace GetGrounded.Infrastructure.Identity;

public sealed class RejectAllAuthTokenAccessor : IAuthTokenAccessor
{
    public Task<string?> VerifyLoginIdAsync(string token, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(null);
    }
}
