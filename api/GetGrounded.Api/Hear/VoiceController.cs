using GetGrounded.Api.Http;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Identity;
using GetGrounded.Application.RateLimit;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Hear;

[ApiController]
[Route("voice")]
public sealed class VoiceController(
    AuthManager auth,
    RateLimitManager rateLimits,
    PlanExtractManager extract,
    MiddayExtractManager middayExtract,
    PlanClarifyManager clarify,
    MuseVoiceManager museVoice,
    HearManager hear,
    VoiceClipManager clips) : ControllerBase
{
    [HttpGet("clips/{sessionId:guid}")]
    public async Task<IActionResult> GetClip(Guid sessionId, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.VoiceClip, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        var clip = await clips.LoadSessionAsync(user!.Id, sessionId, cancellationToken);
        if (clip is null)
        {
            return NotFound();
        }

        var type = string.IsNullOrWhiteSpace(clip.ContentType) ? "audio/mp4" : clip.ContentType;
        return File(clip.Bytes, type);
    }

    [HttpPost("hear")]
    public async Task<IActionResult> Hear(CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.VoiceUpload, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        var clip = await ReadAudioAsync(cancellationToken);
        if (clip is null)
        {
            return BadRequest(new { error = "audio" });
        }

        try
        {
            var heard = await hear.HearAsync(user!.Id, clip, cancellationToken);
            return Ok(new { transcript = heard.Transcript, storageKey = heard.StorageKey, words = heard.Words });
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

    [HttpPost("clarify")]
    public async Task<IActionResult> Clarify([FromBody] ExtractRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.VoiceLlm, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        if (body.Kind is not "MORNING_PLAN")
        {
            return BadRequest(new { error = "kind" });
        }

        try
        {
            var prior = (body.Clarifications ?? [])
                .Where(row => !string.IsNullOrWhiteSpace(row.Answer))
                .Select(row => new ClarifyExchange(
                    row.QuestionId ?? row.Id ?? "",
                    row.Prompt ?? "",
                    row.Answer!.Trim()))
                .Where(row => row.QuestionId.Length > 0 && row.Prompt.Length > 0)
                .ToList();

            var variant = string.Equals(body.ScheduleVariant, "alternate", StringComparison.OrdinalIgnoreCase)
                ? PlanScheduleVariant.Alternate
                : PlanScheduleVariant.Default;

            var result = await clarify.ClarifyMorningAsync(
                body.Transcript,
                body.Timezone ?? "UTC",
                prior,
                variant,
                cancellationToken);
            return Ok(new
            {
                museLine = result.MuseLine,
                complete = result.Complete,
                questions = result.Questions.Select(item => new
                {
                    id = item.Id,
                    prompt = item.Prompt,
                    topic = item.Topic
                }),
                suggestedBlocks = result.SuggestedBlocks.Select(item => new
                {
                    title = item.Title,
                    plannedStartMinute = item.PlannedStartMinute,
                    plannedDurationMinutes = item.PlannedDurationMinutes,
                    source = item.Source,
                }),
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InterpretException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "clarify" });
        }
        catch (ModelUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "model" });
        }
    }

    [HttpPost("speak")]
    public async Task<IActionResult> Speak([FromBody] SpeakRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.VoiceSpeak, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            var clip = await museVoice.SpeakAsync(body.Text, cancellationToken);
            return File(clip.Bytes, clip.ContentType);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (SpeechUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "speech" });
        }
    }

    [HttpPost("extract")]
    public async Task<IActionResult> Extract([FromBody] ExtractRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.VoiceLlm, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        if (body.Kind is not "MORNING_PLAN" and not "EVENING_REFLECTION" and not "MIDDAY_UPDATE")
        {
            return BadRequest(new { error = "kind" });
        }

        if (body.Kind is "EVENING_REFLECTION")
        {
            return StatusCode(StatusCodes.Status501NotImplemented);
        }

        if (body.Kind is "MIDDAY_UPDATE")
        {
            if (body.DayId is not Guid dayId)
            {
                return BadRequest(new { error = "dayId" });
            }

            try
            {
                var draft = await middayExtract.ExtractAsync(user!.Id, dayId, body.Transcript, cancellationToken);
                return Ok(new
                {
                    add = draft.Add.Select(item => new
                    {
                        title = item.Title,
                        plannedDurationMinutes = item.PlannedDurationMinutes,
                        plannedStartMinute = item.PlannedStartMinute,
                        lifeArea = item.LifeArea
                    }),
                    outcomes = draft.Outcomes.Select(item => new
                    {
                        id = item.Id,
                        status = item.Status,
                        actualDurationMinutes = (int?)null,
                        reason = (string?)null
                    }),
                    extras = draft.Extras.Select(item => new
                    {
                        title = item.Title,
                        lifeArea = item.LifeArea
                    })
                });
            }
            catch (BookDayNotFoundException)
            {
                return NotFound(new { error = "day" });
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

        try
        {
            var draft = await extract.ExtractMorningAsync(
                body.Transcript,
                body.Timezone,
                body.SpokenAt,
                cancellationToken);
            return Ok(new
            {
                title = draft.Title,
                coachNote = draft.CoachNote,
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
        DateTimeOffset? SpokenAt,
        Guid? DayId = null,
        IReadOnlyList<ClarifyExchangeRequest>? Clarifications = null,
        string? ScheduleVariant = null);

    public sealed record ClarifyExchangeRequest(
        string? QuestionId,
        string? Id,
        string? Prompt,
        string? Answer);

    public sealed record SpeakRequest(string Text);
}
