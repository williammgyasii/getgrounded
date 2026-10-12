namespace GetGrounded.Application.Book;

public static class BookEngine
{
    public static void RequireTranscript(string transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript is required.", nameof(transcript));
        }
    }

    public static string? SentenceTitle(string? title) =>
        string.IsNullOrWhiteSpace(title) ? null : Titles.Sentence(title);

    public static IReadOnlyList<PlannedItem> CleanPlannedItems(IReadOnlyList<PlannedItem> items) =>
        items
            .Select(item => item with { Title = Titles.Sentence(item.Title) })
            .Where(item => item.Title.Length > 0)
            .ToList();
}
