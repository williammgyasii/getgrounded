namespace GetGrounded.Application.Voice;

public interface IAudioStore
{
    Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken);
}
