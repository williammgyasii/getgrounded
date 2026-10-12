using System.Text.Json;
using GetGrounded.Application.Book;

namespace GetGrounded.Application.Hear;

public sealed class MiddayExtractInterpreter(ILanguageModelAccessor model)
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private const string System =
        """
        Return JSON only.
        You interpret a midday plan update. The person already has a schedule — do NOT replace or delete existing tasks.
        Only add new tasks they explicitly asked for, and mark existing tasks completed or skipped when they say they finished or dropped something.
        New tasks must not duplicate existing titles. Leave plannedStartMinute null unless they named a clock time.
        Include every existing task id in outcomes with PLANNED, COMPLETED, or SKIPPED.
        {"add":[{"title":"","plannedStartMinute":null,"plannedDurationMinutes":30,"lifeArea":null}],"outcomes":[{"id":"","status":"PLANNED"}],"extras":[{"title":"","lifeArea":null}]}
        """;

    public async Task<MiddayDraft> ReadMiddayAsync(
        string transcript,
        DayRecord day,
        CancellationToken cancellationToken = default)
    {
        var schedule = day.Commitments
            .Select(item => new
            {
                id = item.Id,
                title = item.Title,
                status = item.Status,
                plannedStartMinute = item.PlannedStartMinute,
                plannedDurationMinutes = item.PlannedDurationMinutes,
            });

        var user = $"""
            Current schedule:
            {JsonSerializer.Serialize(schedule)}

            Update transcript:
            {transcript}
            """;

        var raw = await model.CompleteJsonAsync(System, user, cancellationToken);
        return Parse(raw, day);
    }

    private static MiddayDraft Parse(string raw, DayRecord day)
    {
        MiddayPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<MiddayPayload>(SliceJson(raw), Json)
                ?? throw new InterpretException("Empty midday extract.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable midday extract.");
        }

        var known = day.Commitments.ToDictionary(item => item.Id);
        var add = (payload.Add ?? [])
            .Select(row => new PlannedItem(
                Titles.Sentence(row.Title ?? ""),
                row.PlannedDurationMinutes ?? 30,
                row.PlannedStartMinute,
                row.LifeArea))
            .Where(item => item.Title.Length > 0)
            .ToList();

        var outcomes = new List<MiddayOutcomeDraft>();
        foreach (var row in payload.Outcomes ?? [])
        {
            if (row.Id is null || !Guid.TryParse(row.Id, out var id) || !known.ContainsKey(id))
            {
                continue;
            }

            var status = string.IsNullOrWhiteSpace(row.Status)
                ? known[id].Status
                : row.Status.Trim().ToUpperInvariant();
            outcomes.Add(new MiddayOutcomeDraft(id, status));
        }

        foreach (var item in day.Commitments)
        {
            if (outcomes.All(row => row.Id != item.Id))
            {
                outcomes.Add(new MiddayOutcomeDraft(item.Id, item.Status));
            }
        }

        var extras = (payload.Extras ?? [])
            .Select(row => new MiddayExtraDraft(Titles.Sentence(row.Title ?? ""), row.LifeArea))
            .Where(row => row.Title.Length > 0)
            .ToList();

        return new MiddayDraft(add, outcomes, extras);
    }

    private static string SliceJson(string raw)
    {
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            throw new InterpretException("Midday JSON missing.");
        }

        return raw[start..(end + 1)];
    }

    private sealed record MiddayPayload(
        IReadOnlyList<MiddayAddPayload>? Add,
        IReadOnlyList<MiddayOutcomePayload>? Outcomes,
        IReadOnlyList<MiddayExtraPayload>? Extras);

    private sealed record MiddayAddPayload(
        string? Title,
        int? PlannedStartMinute,
        int? PlannedDurationMinutes,
        string? LifeArea);

    private sealed record MiddayOutcomePayload(string? Id, string? Status);

    private sealed record MiddayExtraPayload(string? Title, string? LifeArea);
}
