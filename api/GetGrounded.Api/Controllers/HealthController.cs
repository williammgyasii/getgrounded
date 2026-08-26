using GetGrounded.Application.Health;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(HealthService health, IHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public Task<HealthReport> Get(CancellationToken cancellationToken)
    {
        return health.GetAsync(environment.EnvironmentName, cancellationToken);
    }
}
