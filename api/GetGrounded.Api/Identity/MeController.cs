using GetGrounded.Api.Http;
using GetGrounded.Application.Identity;
using GetGrounded.Application.RateLimit;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Identity;

[ApiController]
[Route("me")]
public sealed class MeController(AuthManager auth, RateLimitManager rateLimits) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Identity, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        return Ok(new { userId = user!.Id });
    }
}
