using GetGrounded.Application.Auth;
using GetGrounded.Application.Voice;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("voice")]
public sealed class VoiceController(AuthService auth, IVoiceSessionIssuer sessions) : ControllerBase
{
    [HttpGet("session")]
    public async Task<IActionResult> Session(CancellationToken cancellationToken)
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

        var user = await auth.IdentifyAsync(token, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var session = await sessions.IssueAsync(user.Id, cancellationToken);
        return session is null
            ? StatusCode(StatusCodes.Status503ServiceUnavailable)
            : Ok(new { conversationToken = session.ConversationToken, agentId = session.AgentId });
    }
}
