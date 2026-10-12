using GetGrounded.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Identity;

[ApiController]
[Route("me")]
public sealed class MeController(AuthManager auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var token = Bearer.Read(Request);
        if (token is null)
        {
            return Unauthorized();
        }

        var user = await auth.IdentifyAsync(token, cancellationToken);
        return user is null
            ? Unauthorized()
            : Ok(new { userId = user.Id });
    }
}
