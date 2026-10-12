using GetGrounded.Api.Http;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Book;

[ApiController]
[Route("days")]
public sealed class DaysController(
    AuthManager auth,
    PlanMorningManager planMorning,
    DeskManager desk,
    HistoryManager history,
    DayEditManager dayEdit) : ControllerBase
{
    [HttpGet("today")]
    public async Task<IActionResult> Today([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await desk.LoadAsync(user.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> History([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await history.ListAsync(user.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("morning")]
    public async Task<IActionResult> Morning([FromBody] MorningRequest body, CancellationToken cancellationToken)
    {
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
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
                user.Id,
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            await dayEdit.DeleteDayAsync(user.Id, id, cancellationToken);
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
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await dayEdit.RenameDayAsync(user.Id, id, body.Title, cancellationToken));
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
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await dayEdit.SetCommitmentStatusAsync(user.Id, id, body.Status, cancellationToken));
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
        var user = await AuthGate.IdentifyAsync(Request, auth, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await dayEdit.DeleteCommitmentAsync(user.Id, id, cancellationToken));
        }
        catch (BookCommitmentNotFoundException)
        {
            return NotFound(new { error = "Commitment not found." });
        }
    }

    public sealed record RenameRequest(string Title);

    public sealed record MarkCommitmentRequest(string Status);
}
