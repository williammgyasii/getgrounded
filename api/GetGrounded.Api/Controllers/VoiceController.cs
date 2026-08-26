using GetGrounded.Api.Http;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Voice;
using GetGrounded.Domain;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("voice")]
public sealed class VoiceController(AuthService auth, ClipService clips) : ControllerBase
{
    [HttpPost("hear")]
    public async Task<IActionResult> Hear(CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var clip = await ReadAudioAsync(cancellationToken);
        if (clip is null)
        {
            return BadRequest(new { error = "audio" });
        }

        try
        {
            var heard = await clips.HearAsync(user.Id, clip, cancellationToken);
            return Ok(new { transcript = heard.Transcript });
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
        catch (SpeechUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "speech" });
        }
    }

    [HttpPost("extract")]
    public async Task<IActionResult> Extract([FromBody] ExtractRequest body, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        if (body.Kind is not "MORNING_PLAN")
        {
            return BadRequest(new { error = "kind" });
        }

        try
        {
            var draft = await clips.ExtractMorningAsync(
                body.Transcript,
                body.Timezone,
                body.SpokenAt,
                cancellationToken);
            return Ok(new
            {
                title = draft.Title,
                commitments = draft.Commitments.Select(item => new
                {
                    title = item.Title,
                    plannedDurationMinutes = item.PlannedDurationMinutes,
                    plannedStartMinute = item.PlannedStartMinute,
                    lifeArea = item.LifeArea
                })
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InterpretException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "extract" });
        }
        catch (ModelUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "model" });
        }
    }

    [HttpPost("clips")]
    public async Task<IActionResult> Clips(CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
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
        var clip = await ReadAudioAsync(cancellationToken);
        if (clip is null)
        {
            return BadRequest(new { error = "audio" });
        }

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

    private async Task<User?> IdentifyAsync(CancellationToken cancellationToken)
    {
        var token = Bearer.Read(Request);
        if (token is null)
        {
            return null;
        }

        return await auth.IdentifyAsync(token, cancellationToken);
    }

    private async Task<HearClip?> ReadAudioAsync(CancellationToken cancellationToken)
    {
        if (!Request.HasFormContentType)
        {
            return null;
        }

        var file = Request.Form.Files["audio"];
        if (file is null || file.Length == 0)
        {
            return null;
        }

        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        return new HearClip(memory.ToArray(), file.ContentType ?? "");
    }

    public sealed record ExtractRequest(
        string Kind,
        string Transcript,
        string? Timezone,
        DateTimeOffset? SpokenAt);
}
