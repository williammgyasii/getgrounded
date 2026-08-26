using GetGrounded.Application.Auth;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("me")]
public sealed class MeController(AuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized();
        }

        var token = header["Bearer ".Length..].Trim();
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized();
        }

        var userId = await auth.IdentifyAsync(token, cancellationToken);
        return userId is null
            ? Unauthorized()
            : Ok(new { userId });
    }
}
