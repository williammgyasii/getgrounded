using GetGrounded.Application.Voice;

namespace GetGrounded.Infrastructure.Voice;

public sealed class MemoryAudioStore : IAudioStore
{
    public Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken)
    {
        return Task.FromResult($"memory/{userId}/{kind}/{clip.Bytes.Length}");
    }
}
