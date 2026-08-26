using GetGrounded.Domain;

namespace GetGrounded.Application.Auth;

public interface IUserStore
{
    Task EnsureAsync(User user, CancellationToken cancellationToken = default);
}
