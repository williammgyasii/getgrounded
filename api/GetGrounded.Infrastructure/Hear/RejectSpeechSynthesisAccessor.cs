using GetGrounded.Application.Hear;

namespace GetGrounded.Infrastructure.Hear;

public sealed class RejectSpeechSynthesisAccessor : ISpeechSynthesisAccessor
{
    public Task<MuseSpeechClip> SynthesizeAsync(string text, CancellationToken cancellationToken = default) =>
        throw new SpeechUnavailableException();
}
