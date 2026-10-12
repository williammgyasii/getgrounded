using GetGrounded.Api.Http;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Identity;
using GetGrounded.Application.RateLimit;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Book;

[ApiController]
[Route("days")]
public sealed class DaysController(
    AuthManager auth,
    RateLimitManager rateLimits,
    PlanMorningManager planMorning,
    MiddayUpdateManager middayUpdate,
    DeskManager desk,
    HistoryManager history,
    DayEditManager dayEdit) : ControllerBase
{
    [HttpGet("today")]
    public async Task<IActionResult> Today([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Read, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            return Ok(await desk.LoadAsync(user!.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> History([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Read, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            return Ok(await history.ListAsync(user!.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("morning")]
    public async Task<IActionResult> Morning([FromBody] MorningRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            var items = (body.Commitments ?? [])
                .Select(item => new PlannedItem(
                    item.Title,
                    item.PlannedDurationMinutes,
                    item.PlannedStartMinute,
                    item.LifeArea))
                .ToList();
            DateOnly? planDate = null;
            if (!string.IsNullOrWhiteSpace(body.LocalDate))
            {
                if (!DateOnly.TryParse(body.LocalDate, out var parsed))
                {
                    return BadRequest(new { error = "localDate" });
                }

                planDate = parsed;
            }

            return Ok(await planMorning.SaveAsync(
                user!.Id,
                body.Timezone,
                body.Transcript,
                items,
                body.Title,
                body.StorageKey,
                body.Words,
                planDate,
                body.CoachNote,
                cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    public sealed record MorningRequest(
        string Timezone,
        string Transcript,
        string? Title,
        string? StorageKey,
        IReadOnlyList<SpokenWord>? Words,
        IReadOnlyList<MorningCommitmentRequest>? Commitments,
        string? LocalDate = null,
        string? CoachNote = null);

    public sealed record MorningCommitmentRequest(
        string Title,
        int? PlannedDurationMinutes,
        int? PlannedStartMinute,
        string? LifeArea);

    [HttpPost("midday")]
    public async Task<IActionResult> Midday([FromBody] MiddayRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        if (!Guid.TryParse(body.DayId, out var dayId))
        {
            return BadRequest(new { error = "dayId" });
        }

        try
        {
            var add = (body.Add ?? [])
                .Select(item => new PlannedItem(
                    item.Title,
                    item.PlannedDurationMinutes,
                    item.PlannedStartMinute,
                    item.LifeArea))
                .ToList();
            var outcomes = (body.Outcomes ?? [])
                .Select(item => new MiddayOutcomeUpdate(Guid.Parse(item.Id), item.Status))
                .ToList();
            var extras = (body.Extras ?? [])
                .Select(item => new MiddayExtra(item.Title, item.LifeArea))
                .ToList();

            return Ok(await middayUpdate.ApplyAsync(
                user!.Id,
                dayId,
                body.Timezone,
                body.Transcript,
                add,
                outcomes,
                extras,
                body.StorageKey,
                body.Words,
                cancellationToken));
        }
        catch (BookDayNotFoundException)
        {
            return NotFound(new { error = "Day not found." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            await dayEdit.DeleteDayAsync(user!.Id, id, cancellationToken);
            return NoContent();
        }
        catch (BookDayNotFoundException)
        {
            return NotFound(new { error = "Day not found." });
        }
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Rename(Guid id, [FromBody] RenameRequest body, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            return Ok(await dayEdit.RenameDayAsync(user!.Id, id, body.Title, cancellationToken));
        }
        catch (BookDayNotFoundException)
        {
            return NotFound(new { error = "Day not found." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("commitments/{id:guid}")]
    public async Task<IActionResult> MarkCommitment(
        Guid id,
        [FromBody] MarkCommitmentRequest body,
        CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            return Ok(await dayEdit.SetCommitmentStatusAsync(user!.Id, id, body.Status, cancellationToken));
        }
        catch (BookCommitmentNotFoundException)
        {
            return NotFound(new { error = "Commitment not found." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("commitments/{id:guid}")]
    public async Task<IActionResult> DeleteCommitment(Guid id, CancellationToken cancellationToken)
    {
        var (user, rejection) = await AuthGate.AuthorizeAsync(
            Request, auth, rateLimits, RateLimitBucket.Write, cancellationToken);
        if (rejection is not null)
        {
            return rejection;
        }

        try
        {
            return Ok(await dayEdit.DeleteCommitmentAsync(user!.Id, id, cancellationToken));
        }
        catch (BookCommitmentNotFoundException)
        {
            return NotFound(new { error = "Commitment not found." });
        }
    }

    public sealed record RenameRequest(string Title);

    public sealed record MarkCommitmentRequest(string Status);

    public sealed record MiddayRequest(
        string Timezone,
        string Transcript,
        string DayId,
        string? StorageKey,
        IReadOnlyList<SpokenWord>? Words,
        IReadOnlyList<MiddayAddRequest>? Add,
        IReadOnlyList<MiddayOutcomeRequest>? Outcomes,
        IReadOnlyList<MiddayExtraRequest>? Extras);

    public sealed record MiddayAddRequest(
        string Title,
        int? PlannedDurationMinutes,
        int? PlannedStartMinute,
        string? LifeArea);

    public sealed record MiddayOutcomeRequest(string Id, string Status);

    public sealed record MiddayExtraRequest(string Title, string? LifeArea);
}
