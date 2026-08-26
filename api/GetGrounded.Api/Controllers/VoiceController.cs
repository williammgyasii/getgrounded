using GetGrounded.Api.Http;
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
        var token = Bearer.Read(Request);
        if (token is null)
        {
            return Unauthorized();
        }

        var user = await auth.IdentifyAsync(token, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var issue = await sessions.IssueAsync(user.Id.ToString(), cancellationToken);
        return issue.Kind switch
        {
            VoiceIssueKind.Ready => Ok(new
            {
                conversationToken = issue.Session!.ConversationToken,
                agentId = issue.Session.AgentId
            }),
            VoiceIssueKind.Busy => StatusCode(StatusCodes.Status429TooManyRequests, new { error = "busy" }),
            VoiceIssueKind.Failed => StatusCode(StatusCodes.Status502BadGateway, new { error = "upstream" }),
            _ => StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "not_configured" })
        };
    }
}
