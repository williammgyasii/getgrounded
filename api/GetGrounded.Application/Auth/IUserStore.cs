using GetGrounded.Domain;

namespace GetGrounded.Application.Auth;

public interface IUserStore
{
    Task<User> FindOrCreateAsync(string firebaseUid, CancellationToken cancellationToken = default);
}
