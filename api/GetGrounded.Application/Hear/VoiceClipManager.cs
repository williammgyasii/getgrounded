using GetGrounded.Application.Book;

namespace GetGrounded.Application.Hear;

public sealed class VoiceClipManager(IBookDayAccessor book, IAudioClipAccessor audio)
{
    public async Task<StoredClip?> LoadSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var key = await book.GetVoiceSessionStorageKeyAsync(userId, sessionId, cancellationToken);
        if (string.IsNullOrWhiteSpace(key))
        {
            return null;
        }

        return await audio.GetAsync(key, cancellationToken);
    }
}
