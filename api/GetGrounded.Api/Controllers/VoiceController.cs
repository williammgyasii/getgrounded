using GetGrounded.Api.Http;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Voice;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("voice")]
public sealed class VoiceController(AuthService auth, ClipService clips) : ControllerBase
{
    [HttpPost("clips")]
    public async Task<IActionResult> Clips(CancellationToken cancellationToken)
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

        if (!Request.HasFormContentType)
        {
            return BadRequest(new { error = "form" });
        }

        var kind = Request.Form["kind"].ToString();
        var timezone = Request.Form["timezone"].ToString();
        var file = Request.Form.Files["audio"];
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "audio" });
        }

        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        var clip = new HearClip(memory.ToArray(), file.ContentType ?? "");

        try
        {
            return Ok(await clips.CaptureAsync(user.Id, kind, timezone, clip, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ClipTooLargeException)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new { error = "too_large" });
        }
        catch (EmptySpeechException)
        {
            return UnprocessableEntity(new { error = "no_speech" });
        }
        catch (InterpretException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "extract" });
        }
        catch (SpeechUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "speech" });
        }
        catch (ModelUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "model" });
        }
    }
}
