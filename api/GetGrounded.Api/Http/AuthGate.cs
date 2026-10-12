using GetGrounded.Api.Identity;
using GetGrounded.Application.Identity;
using GetGrounded.Application.RateLimit;
using GetGrounded.Domain.Identity;
using Microsoft.AspNetCore.Mvc;

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

    public static async Task<(User? User, IActionResult? Rejection)> AuthorizeAsync(
        HttpRequest request,
        AuthManager auth,
        RateLimitManager rateLimits,
        RateLimitBucket bucket,
        CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(request, auth, cancellationToken);
        if (user is null)
        {
            return (null, new UnauthorizedResult());
        }

        if (!rateLimits.TryAcquire(user.Id, bucket))
        {
            return (null, TooManyRequests());
        }

        return (user, null);
    }

    internal static ObjectResult TooManyRequests() =>
        new(new { error = "rate_limit" }) { StatusCode = StatusCodes.Status429TooManyRequests };
}
