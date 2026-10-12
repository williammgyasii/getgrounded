using GetGrounded.Application.Identity;
using GetGrounded.Domain.Identity;

namespace GetGrounded.Infrastructure.Identity;

public sealed class UnconfiguredAuthUserAccessor : IAuthUserAccessor
{
    public Task<User> FindOrCreateAsync(string loginId, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Postgres auth user accessor is not configured yet.");
    }
}
