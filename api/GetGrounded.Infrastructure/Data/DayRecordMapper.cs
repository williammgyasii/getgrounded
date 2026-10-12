using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Time;
using GetGrounded.Infrastructure.Data.Entities;

namespace GetGrounded.Infrastructure.Data;

internal static class DayRecordMapper
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static DayRecord ToRecord(DayRow day) =>
        new(
            day.Id,
            day.LocalDate,
            day.Timezone,
            day.ShowedUp,
            day.Title,
            day.Commitments
                .OrderBy(item => item.SortOrder)
                .ThenBy(item => item.CreatedAt)
                .Select(item => new CommitmentRecord(
                    item.Id,
                    item.Title,
                    item.Status,
                    item.PlannedDurationMinutes,
                    item.ActualDurationMinutes,
                    item.PlannedAt is DateTimeOffset at ? LocalClock.MinuteOfDay(day.Timezone, at) : null,
                    item.LifeArea,
                    item.CreatedAt))
                .ToList(),
            day.Wins
                .OrderBy(item => item.CreatedAt)
                .Select(item => new WinRecord(item.Id, item.Title, item.LifeArea))
                .ToList(),
            day.VoiceSessions
                .OrderBy(item => item.CreatedAt)
                .Select(item => new ClipRecord(
                    item.Id,
                    item.Kind,
                    item.Transcript,
                    item.CreatedAt,
                    item.StorageKey is not null,
                    ReadWords(item.WordsJson)))
                .ToList(),
            day.CoachNote);

    private static IReadOnlyList<SpokenWord>? ReadWords(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var words = JsonSerializer.Deserialize<List<SpokenWord>>(raw, Json);
        return words is { Count: > 0 } ? words : null;
    }

    public static string? WriteWords(IReadOnlyList<SpokenWord>? words) =>
        words is { Count: > 0 } ? JsonSerializer.Serialize(words, Json) : null;
}
