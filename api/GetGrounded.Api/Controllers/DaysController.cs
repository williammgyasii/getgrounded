using GetGrounded.Api.Http;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Domain;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("days")]
public sealed class DaysController(AuthService auth, BookService book) : ControllerBase
{
    [HttpGet("today")]
    public async Task<IActionResult> Today([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await book.GetDeskAsync(user.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> History([FromQuery] string timezone, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await book.GetHistoryAsync(user.Id, timezone, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("morning")]
    public async Task<IActionResult> Morning([FromBody] MorningRequest body, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
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
            return Ok(await book.PlanMorningAsync(
                user.Id,
                body.Timezone,
                body.Transcript,
                items,
                body.Title,
                cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("evening")]
    public async Task<IActionResult> Evening([FromBody] EveningRequest body, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var outcomes = (body.Outcomes ?? [])
                .Select(item => new OutcomeItem(item.Id, item.Status, item.ActualDurationMinutes, item.Reason))
                .ToList();
            var wins = (body.Wins ?? []).Select(item => new WinItem(item.Title)).ToList();
            return Ok(await book.ReflectEveningAsync(
                user.Id,
                body.Timezone,
                body.Transcript,
                outcomes,
                wins,
                cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{dayId:guid}")]
    public async Task<IActionResult> Rename(Guid dayId, [FromBody] RenameRequest body, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var day = await book.RenameDayAsync(user.Id, dayId, body.Title, cancellationToken);
            return day is null ? NotFound() : Ok(day);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{dayId:guid}")]
    public async Task<IActionResult> Remove(Guid dayId, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return await book.RemoveDayAsync(user.Id, dayId, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpPatch("commitments/{commitmentId:guid}")]
    public async Task<IActionResult> Mark(Guid commitmentId, [FromBody] MarkRequest body, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var day = await book.MarkCommitmentAsync(user.Id, commitmentId, body.Status, cancellationToken);
            return day is null ? NotFound() : Ok(day);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("commitments/{commitmentId:guid}")]
    public async Task<IActionResult> RemoveCommitment(Guid commitmentId, CancellationToken cancellationToken)
    {
        var user = await IdentifyAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var day = await book.RemoveCommitmentAsync(user.Id, commitmentId, cancellationToken);
        return day is null ? NotFound() : Ok(day);
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

    public sealed record MorningRequest(
        string Timezone,
        string Transcript,
        string? Title,
        IReadOnlyList<CommitmentDraft>? Commitments);

    public sealed record EveningRequest(
        string Timezone,
        string Transcript,
        IReadOnlyList<OutcomeDraft>? Outcomes,
        IReadOnlyList<WinDraft>? Wins);

    public sealed record CommitmentDraft(
        string Title,
        int? PlannedDurationMinutes,
        int? PlannedStartMinute,
        string? LifeArea);
    public sealed record OutcomeDraft(Guid Id, string Status, int? ActualDurationMinutes, string? Reason);
    public sealed record WinDraft(string Title);
    public sealed record RenameRequest(string Title);
    public sealed record MarkRequest(string Status);
}
