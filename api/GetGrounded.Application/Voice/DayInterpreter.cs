using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;

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

    public async Task<MorningDraft> ReadMorningAsync(
        string transcript,
        MorningContext? context = null,
        CancellationToken cancellationToken = default)
    {
        var spoken = context ?? new MorningContext("UTC", DateTimeOffset.UtcNow);
        var spokenMinute = LocalClock.MinuteOfDay(spoken.Timezone, spoken.SpokenAt);
        var raw = await model.CompleteJsonAsync(MorningSystem, UserMorning(transcript, spoken, spokenMinute), cancellationToken);
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
            .Select(row => new PlannedItem(
                row.Title ?? "",
                row.PlannedDurationMinutes,
                ReadStart(row),
                row.LifeArea))
            .Where(item => item.Title.Trim().Length > 0)
            .ToList();
        var title = string.IsNullOrWhiteSpace(payload.Title) ? null : payload.Title.Trim();
        return new MorningDraft(title, DayPlanner.LayOut(items, spokenMinute));
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
        "Return JSON only. Pick real commitments, not filler. plannedStart is 24h HH:mm local or null if they did not say a time. lifeArea is WORK, LEARNING, HEALTH, SPIRITUAL, RELATIONSHIPS, FINANCIAL, HOME, or PERSONAL. {\"title\":\"\",\"commitments\":[{\"title\":\"\",\"plannedStart\":null,\"plannedDurationMinutes\":null,\"lifeArea\":null}]}";

    private static string UserMorning(string transcript, MorningContext spoken, int spokenMinute)
    {
        var hour = spokenMinute / 60;
        var minute = spokenMinute % 60;
        return $"Spoken at {hour:00}:{minute:00} {spoken.Timezone}. Remaining day ends 22:00. Leave plannedStart null when they did not name a clock time. Transcript:\n{transcript}";
    }

    private static int? ReadStart(MorningRow row)
    {
        if (row.PlannedStartMinute is int numbered && numbered is >= 0 and < 24 * 60)
        {
            return numbered;
        }

        var raw = row.PlannedStart?.Trim();
        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        return TimeOnly.TryParse(raw, out var time) ? time.Hour * 60 + time.Minute : null;
    }

    private static string EveningSystem(IReadOnlyList<CommitmentRecord> planned)
    {
        var ids = string.Join(",", planned.Select(item => item.Id));
        return $"Return JSON only. Outcome ids must be from: {ids}. Statuses: COMPLETED,PARTIAL,MISSED,RESCHEDULED,CANCELLED,BLOCKED. {{\"outcomes\":[],\"wins\":[]}}";
    }

    private sealed record MorningPayload(string? Title, IReadOnlyList<MorningRow>? Commitments);
    private sealed record MorningRow(
        string? Title,
        int? PlannedDurationMinutes,
        string? PlannedStart,
        int? PlannedStartMinute,
        string? LifeArea,
        float? Confidence);
    private sealed record EveningPayload(IReadOnlyList<EveningRow>? Outcomes, IReadOnlyList<WinRow>? Wins);
    private sealed record EveningRow(string? Id, string? Status, int? ActualDurationMinutes, string? Reason);
    private sealed record WinRow(string? Title);
}
