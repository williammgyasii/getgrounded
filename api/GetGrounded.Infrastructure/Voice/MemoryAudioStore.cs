using System.Collections.Concurrent;
using GetGrounded.Application.Voice;

namespace GetGrounded.Infrastructure.Voice;

public sealed class MemoryAudioStore : IAudioStore
{
    private readonly ConcurrentDictionary<string, StoredClip> _clips = new();

    public Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken)
    {
        var key = $"{userId}/{kind}/{Guid.NewGuid():N}.m4a";
        _clips[key] = new StoredClip(clip.Bytes, clip.ContentType);
        return Task.FromResult(key);
    }

    public Task<StoredClip?> GetAsync(string key, CancellationToken cancellationToken)
    {
        _clips.TryGetValue(key, out var clip);
        return Task.FromResult(clip);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        _clips.TryRemove(key, out _);
        return Task.CompletedTask;
    }
}
