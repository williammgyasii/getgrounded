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
                Titles.Sentence(row.Title),
                row.PlannedDurationMinutes,
                ReadStart(row),
                row.LifeArea))
            .Where(item => item.Title.Length > 0)
            .ToList();
        var title = string.IsNullOrWhiteSpace(payload.Title) ? null : Titles.Sentence(payload.Title);
        return new MorningDraft(title, DayPlanner.LayOut(items, spokenMinute));
    }

    public async Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<CommitmentRecord> planned,
        CancellationToken cancellationToken = default)
    {
        EveningPayload? payload = null;
        try
        {
            var raw = SliceJson(await model.CompleteJsonAsync(EveningSystem(planned), transcript, cancellationToken));
            payload = JsonSerializer.Deserialize<EveningPayload>(raw, Json);
        }
        catch (JsonException)
        {
            payload = null;
        }

        if (payload is null)
        {
            return MissedNight(planned);
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

            var status = row.Status?.Trim().ToUpperInvariant();
            if (status is null || !Statuses.Contains(status))
            {
                continue;
            }

            seen.Add(id);
            outcomes.Add(new OutcomeItem(id, status, row.ActualDurationMinutes, row.Reason));
        }

        foreach (var item in planned)
        {
            if (!seen.Contains(item.Id))
            {
                outcomes.Add(new OutcomeItem(item.Id, "MISSED"));
            }
        }

        var wins = (payload.Wins ?? [])
            .Select(row =>
            {
                var title = Titles.Sentence(row.Title);
                return new WinItem(title, ReadArea(row.LifeArea) ?? DayPlanner.GuessArea(title));
            })
            .Where(win => win.Title.Length > 0)
            .ToList();
        var mirror = string.IsNullOrWhiteSpace(payload.Mirror) ? null : payload.Mirror.Trim();
        return new EveningDraft(outcomes, wins, mirror);
    }

    private const string MorningSystem =
        "Return JSON only. Pick real commitments, not filler. Title and commitment titles must be sentence case. plannedStart is 24h HH:mm local or null if they did not say a time. lifeArea is WORK, LEARNING, HEALTH, SPIRITUAL, RELATIONSHIPS, FINANCIAL, HOME, or PERSONAL. {\"title\":\"\",\"commitments\":[{\"title\":\"\",\"plannedStart\":null,\"plannedDurationMinutes\":null,\"lifeArea\":null}]}";

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

    private static EveningDraft MissedNight(IReadOnlyList<CommitmentRecord> planned) =>
        new(planned.Select(item => new OutcomeItem(item.Id, "MISSED")).ToList(), [], null);

    private static string SliceJson(string raw)
    {
        var text = raw.Trim();
        if (text.StartsWith("```", StringComparison.Ordinal))
        {
            var start = text.IndexOf('{');
            var end = text.LastIndexOf("```", StringComparison.Ordinal);
            if (start >= 0 && end > start)
            {
                text = text[start..end].Trim();
            }
        }

        var open = text.IndexOf('{');
        var close = text.LastIndexOf('}');
        return open >= 0 && close > open ? text[open..(close + 1)] : text;
    }

    private static string EveningSystem(IReadOnlyList<CommitmentRecord> items)
    {
        var labeled = string.Join("; ", items.Select(item => $"{item.Id}:{item.Title}"));
        return $"You are a warm evening mirror, not a scorekeeper. Planned: {labeled}. Outcome ids must be from those ids. Statuses: COMPLETED,PARTIAL,MISSED,RESCHEDULED,CANCELLED,BLOCKED. Match a planned item only when they spoke about that same thing — do not swap titles or invent deeds (no push-ups if they did not say push-ups). wins MUST list every extra they named that was not planned — calls, showers, cooking, talks, errands — each as its own win. Never invent extras. lifeArea is WORK, LEARNING, HEALTH, SPIRITUAL, RELATIONSHIPS, FINANCIAL, HOME, or PERSONAL. mirror is 1-2 sentences using their words. Celebrate extras. Do not scold missed plans. Sentence case. {{\"outcomes\":[],\"wins\":[{{\"title\":\"\",\"lifeArea\":\"\"}}],\"mirror\":\"\"}}";
    }

    private static readonly HashSet<string> Areas =
    [
        "WORK", "LEARNING", "HEALTH", "SPIRITUAL", "RELATIONSHIPS", "FINANCIAL", "HOME", "PERSONAL"
    ];

    private static string? ReadArea(string? raw)
    {
        var area = raw?.Trim().ToUpperInvariant();
        return area is not null && Areas.Contains(area) ? area : null;
    }

    private sealed record MorningPayload(string? Title, IReadOnlyList<MorningRow>? Commitments);
    private sealed record MorningRow(
        string? Title,
        int? PlannedDurationMinutes,
        string? PlannedStart,
        int? PlannedStartMinute,
        string? LifeArea,
        float? Confidence);
    private sealed record EveningPayload(IReadOnlyList<EveningRow>? Outcomes, IReadOnlyList<WinRow>? Wins, string? Mirror);
    private sealed record EveningRow(string? Id, string? Status, int? ActualDurationMinutes, string? Reason);
    private sealed record WinRow(string? Title, string? LifeArea);
}
