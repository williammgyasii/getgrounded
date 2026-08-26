namespace GetGrounded.Application.Voice;

public interface IAudioStore
{
    Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken);
    Task<StoredClip?> GetAsync(string key, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}
