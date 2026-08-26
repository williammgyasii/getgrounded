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
                .Select(item => new PlannedItem(item.Title, item.PlannedDurationMinutes))
                .ToList();
            return Ok(await book.PlanMorningAsync(user.Id, body.Timezone, body.Transcript, items, cancellationToken));
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
        IReadOnlyList<CommitmentDraft>? Commitments);

    public sealed record EveningRequest(
        string Timezone,
        string Transcript,
        IReadOnlyList<OutcomeDraft>? Outcomes,
        IReadOnlyList<WinDraft>? Wins);

    public sealed record CommitmentDraft(string Title, int? PlannedDurationMinutes);
    public sealed record OutcomeDraft(Guid Id, string Status, int? ActualDurationMinutes, string? Reason);
    public sealed record WinDraft(string Title);
}
