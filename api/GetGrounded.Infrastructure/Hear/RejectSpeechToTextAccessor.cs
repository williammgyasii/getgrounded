using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class RejectSpeechToTextAccessor : ISpeechToTextAccessor
{
    public Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken) =>
        throw new SpeechUnavailableException();
}
