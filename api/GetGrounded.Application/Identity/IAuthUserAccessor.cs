using GetGrounded.Domain.Identity;

namespace GetGrounded.Application.Identity;

public interface IAuthUserAccessor
{
    Task<User> FindOrCreateAsync(string loginId, CancellationToken cancellationToken = default);
}
