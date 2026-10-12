using GetGrounded.Application.Hear;
using GetGrounded.Application.Time;
using GetGrounded.Domain.Book;

namespace GetGrounded.Application.Book;

public sealed class PlanMorningManager(IBookDayAccessor book, IClock clock)
{
    public async Task<DayRecord> SaveAsync(
        Guid userId,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        DateOnly? planDate = null,
        string? coachNote = null,
        CancellationToken cancellationToken = default)
    {
        BookEngine.RequireTranscript(transcript);
        if (items.Count == 0)
        {
            throw new ArgumentException("At least one commitment is required.", nameof(items));
        }

        var today = LocalDay.From(timezone, clock.UtcNow);
        var localDate = planDate ?? today;
        if (localDate != today && localDate != today.AddDays(1))
        {
            throw new ArgumentException("Plan date must be today or tomorrow.", nameof(planDate));
        }
        var planned = BookEngine.CleanPlannedItems(items);
        if (planned.Count == 0)
        {
            throw new ArgumentException("At least one commitment is required.", nameof(items));
        }

        return await book.SaveMorningAsync(
            userId,
            localDate,
            timezone.Trim(),
            transcript,
            planned,
            BookEngine.SentenceTitle(title),
            storageKey,
            words,
            string.IsNullOrWhiteSpace(coachNote) ? null : coachNote.Trim(),
            cancellationToken);
    }
}
