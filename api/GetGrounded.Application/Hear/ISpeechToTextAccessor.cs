namespace GetGrounded.Application.Hear;

public interface ISpeechToTextAccessor
{
    Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken = default);
}
