using System.Text.Json;
using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed class DayInterpreter(ILanguageModel model) : IDayInterpreter
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly HashSet<string> Statuses =
    [
        "COMPLETED", "PARTIAL", "MISSED", "RESCHEDULED", "CANCELLED", "BLOCKED"
    ];

    public async Task<MorningDraft> ReadMorningAsync(string transcript, CancellationToken cancellationToken = default)
    {
        var raw = await model.CompleteJsonAsync(MorningSystem, transcript, cancellationToken);
        MorningPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<MorningPayload>(raw, Json)
                ?? throw new InterpretException("Empty extract.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable extract.");
        }

        var items = (payload.Commitments ?? [])
            .Select(row => new PlannedItem(row.Title ?? "", row.PlannedDurationMinutes))
            .Where(item => item.Title.Trim().Length > 0)
            .ToList();
        var title = string.IsNullOrWhiteSpace(payload.Title) ? null : payload.Title.Trim();
        return new MorningDraft(title, items);
    }

    public async Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<CommitmentRecord> planned,
        CancellationToken cancellationToken = default)
    {
        var raw = await model.CompleteJsonAsync(EveningSystem(planned), transcript, cancellationToken);
        EveningPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<EveningPayload>(raw, Json)
                ?? throw new InterpretException("Empty extract.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable extract.");
        }

        var known = planned.Select(item => item.Id).ToHashSet();
        var seen = new HashSet<Guid>();
        var outcomes = new List<OutcomeItem>();
        foreach (var row in payload.Outcomes ?? [])
        {
            if (!Guid.TryParse(row.Id, out var id) || !known.Contains(id))
            {
                continue;
            }

            if (row.Status is null || !Statuses.Contains(row.Status))
            {
                continue;
            }

            seen.Add(id);
            outcomes.Add(new OutcomeItem(id, row.Status, row.ActualDurationMinutes, row.Reason));
        }

        foreach (var item in planned)
        {
            if (!seen.Contains(item.Id))
            {
                outcomes.Add(new OutcomeItem(item.Id, "MISSED"));
            }
        }

        var wins = (payload.Wins ?? [])
            .Select(row => new WinItem(row.Title ?? ""))
            .Where(win => win.Title.Trim().Length > 0)
            .ToList();
        return new EveningDraft(outcomes, wins);
    }

    private const string MorningSystem =
        "Return JSON only: {\"title\":\"\",\"commitments\":[{\"title\":\"\",\"plannedDurationMinutes\":null,\"confidence\":0}]}";

    private static string EveningSystem(IReadOnlyList<CommitmentRecord> planned)
    {
        var ids = string.Join(",", planned.Select(item => item.Id));
        return $"Return JSON only. Outcome ids must be from: {ids}. Statuses: COMPLETED,PARTIAL,MISSED,RESCHEDULED,CANCELLED,BLOCKED. {{\"outcomes\":[],\"wins\":[]}}";
    }

    private sealed record MorningPayload(string? Title, IReadOnlyList<MorningRow>? Commitments);
    private sealed record MorningRow(string? Title, int? PlannedDurationMinutes, float? Confidence);
    private sealed record EveningPayload(IReadOnlyList<EveningRow>? Outcomes, IReadOnlyList<WinRow>? Wins);
    private sealed record EveningRow(string? Id, string? Status, int? ActualDurationMinutes, string? Reason);
    private sealed record WinRow(string? Title);
}
