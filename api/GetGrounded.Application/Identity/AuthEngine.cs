using GetGrounded.Domain.Identity;

namespace GetGrounded.Application.Identity;

public sealed class AuthEngine
{
    public User? Accept(User user) => user.DeletedAt is null ? user : null;
}
