using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    [EnableRateLimiting("health")]
    public IActionResult Get() => Ok(new { status = "ok" });
}
