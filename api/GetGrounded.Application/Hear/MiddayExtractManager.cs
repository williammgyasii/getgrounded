using GetGrounded.Application.Book;

namespace GetGrounded.Application.Hear;

public sealed class MiddayExtractManager(IBookDayAccessor book, IMiddayExtractAccessor extract)
{
    public async Task<MiddayDraft> ExtractAsync(
        Guid userId,
        Guid dayId,
        string transcript,
        CancellationToken cancellationToken = default)
    {
        BookEngine.RequireTranscript(transcript);
        var day = await book.GetDayByIdAsync(userId, dayId, cancellationToken);
        if (day is null)
        {
            throw new BookDayNotFoundException();
        }

        return await extract.ExtractMiddayAsync(transcript.Trim(), day, cancellationToken);
    }
}
