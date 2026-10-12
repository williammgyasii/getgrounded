namespace GetGrounded.Application.Hear;

public interface IAudioClipAccessor
{
    Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken = default);

    Task<StoredClip?> GetAsync(string key, CancellationToken cancellationToken = default);

    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}
