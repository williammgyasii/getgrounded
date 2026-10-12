using GetGrounded.Application.Hear;

namespace GetGrounded.Tests.Fakes;

internal sealed class StubSpeechToTextAccessor : ISpeechToTextAccessor
{
    public StubSpeechToTextAccessor(string transcript, IReadOnlyList<SpokenWord>? words = null)
    {
        Transcript = transcript;
        Words = words;
    }

    public string Transcript { get; }
    public IReadOnlyList<SpokenWord>? Words { get; }
    public int Calls { get; private set; }

    public Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken = default)
    {
        Calls++;
        return Task.FromResult(new HearResult(Transcript, 0.9f, Words: Words));
    }
}
