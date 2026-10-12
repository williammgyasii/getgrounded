using GetGrounded.Api.Identity;
using GetGrounded.Application.Identity;
using GetGrounded.Domain.Identity;

namespace GetGrounded.Api.Http;

internal static class AuthGate
{
    public static async Task<User?> IdentifyAsync(
        HttpRequest request,
        AuthManager auth,
        CancellationToken cancellationToken)
    {
        var token = Bearer.Read(request);
        return token is null ? null : await auth.IdentifyAsync(token, cancellationToken);
    }
}
