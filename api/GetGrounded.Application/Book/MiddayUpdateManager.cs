using GetGrounded.Application.Hear;

namespace GetGrounded.Application.Book;

public sealed class MiddayUpdateManager(IBookDayAccessor book)
{
    public async Task<DayRecord> ApplyAsync(
        Guid userId,
        Guid dayId,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> add,
        IReadOnlyList<MiddayOutcomeUpdate> outcomes,
        IReadOnlyList<MiddayExtra> extras,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default)
    {
        BookEngine.RequireTranscript(transcript);
        var day = await book.GetDayByIdAsync(userId, dayId, cancellationToken);
        if (day is null)
        {
            throw new BookDayNotFoundException();
        }

        var known = day.Commitments.Select(item => item.Id).ToHashSet();
        foreach (var row in outcomes)
        {
            if (!known.Contains(row.Id))
            {
                throw new ArgumentException("Outcome does not belong to this day.");
            }
        }

        var cleanedAdd = BookEngine.CleanPlannedItems(add);
        var scheduledAdd = MiddayScheduleEngine.SlotNewItems(day, cleanedAdd);

        return await book.ApplyMiddayUpdateAsync(
            userId,
            dayId,
            timezone.Trim(),
            transcript,
            scheduledAdd,
            outcomes,
            extras,
            storageKey,
            words,
            cancellationToken);
    }
}

public sealed record MiddayOutcomeUpdate(Guid Id, string Status);

public sealed record MiddayExtra(string Title, string? LifeArea);
