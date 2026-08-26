namespace GetGrounded.Application.Auth;

public interface IUserStore
{
    Task EnsureAsync(string userId, CancellationToken cancellationToken = default);
}
