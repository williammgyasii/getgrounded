namespace GetGrounded.Application.Voice;

public interface ISpeechToText
{
    Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken);
}
