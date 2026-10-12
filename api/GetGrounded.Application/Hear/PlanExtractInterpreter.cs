using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;

namespace GetGrounded.Application.Hear;

public sealed class PlanExtractInterpreter(ILanguageModelAccessor model)
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private const string MorningSystem =
        """
        Return JSON only.
        Extract actionable commitments the person intends to do today — meetings, workouts, deep work blocks, errands, calls.
        Do NOT create commitments from:
        - availability windows ("free until 4", "done by 5pm", "open until noon")
        - mood or commentary ("it's a busy day", "feeling tired")
        - meta talk about planning itself
        If the transcript has no real tasks, return an empty commitments array.
        title is REQUIRED: one witty, warm, slightly funny name for the whole day (3–6 words), like a friend nicknaming the vibe from the transcript — never a task title, never generic ("Busy day", "My plan").
        Commitment titles are short verb phrases (sentence case).
        plannedStart is 24h HH:mm local only when they named a clock time; otherwise null.
        plannedDurationMinutes is minutes when they said how long; otherwise infer a sensible default (e.g. cook 90 to 120, read 45 to 60, clean 30 to 45, gym 45 to 60) and use it.
        When they did not name a clock time, infer plannedStart from a logical day order in the transcript and assistant proposal in Clarifications.
        lifeArea is WORK, LEARNING, HEALTH, SPIRITUAL, RELATIONSHIPS, FINANCIAL, HOME, or PERSONAL.
        coachNote is one short Nevo comment (1 to 2 sentences) on the plan: encouraging, specific, not a list of tasks. Plain English, no dashes.
        Use plain English in all strings: no em dashes, en dashes, or hyphenated phrases.
        {"title":"","coachNote":"","commitments":[{"title":"","plannedStart":null,"plannedDurationMinutes":null,"lifeArea":null}]}
        """;

    public async Task<MorningDraft> ReadMorningAsync(
        string transcript,
        string timezone,
        DateTimeOffset spokenAt,
        CancellationToken cancellationToken = default)
    {
        var spokenMinute = LocalClock.MinuteOfDay(timezone, spokenAt);
        var raw = await model.CompleteJsonAsync(
            MorningSystem,
            UserMorning(transcript, timezone, spokenMinute),
            cancellationToken);

        MorningPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<MorningPayload>(SliceJson(raw), Json)
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
            .Where(item => item.Title.Length > 0 && !LooksLikeAvailability(item.Title))
            .ToList();
        var title = string.IsNullOrWhiteSpace(payload.Title)
            ? FallbackDayTitle(transcript)
            : AiPlainEnglish.Clean(Titles.Sentence(payload.Title));
        var coachNote = string.IsNullOrWhiteSpace(payload.CoachNote)
            ? null
            : AiPlainEnglish.Clean(payload.CoachNote);
        return new MorningDraft(title, DayPlanner.LayOut(items, spokenMinute), coachNote);
    }

    private static string UserMorning(string transcript, string timezone, int spokenMinute)
    {
        var hour = spokenMinute / 60;
        var minute = spokenMinute % 60;
        return $"Spoken at {hour:00}:{minute:00} {timezone}. Remaining day ends 22:00. Leave plannedStart null when they did not name a clock time. Transcript:\n{transcript}";
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

    private static string FallbackDayTitle(string transcript)
    {
        var trimmed = transcript.Trim();
        if (trimmed.Length == 0)
        {
            return "Plot twist day";
        }

        var snippet = trimmed.Length > 48 ? trimmed[..48].Trim() + "…" : trimmed;
        return Titles.Sentence(snippet);
    }

    private static bool LooksLikeAvailability(string title)
    {
        var lower = title.ToLowerInvariant();
        return lower.Contains("free until")
            || lower.Contains("open until")
            || lower.Contains("up to ")
            || lower.Contains("until ")
            && !lower.Contains("meeting")
            && !lower.Contains("call")
            && !lower.Contains("gym")
            && !lower.Contains("work");
    }

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

    private sealed record MorningPayload(
        string? Title,
        string? CoachNote,
        IReadOnlyList<MorningRow>? Commitments);

    private sealed record MorningRow(
        string? Title,
        int? PlannedDurationMinutes,
        string? PlannedStart,
        int? PlannedStartMinute,
        string? LifeArea,
        float? Confidence);
}
