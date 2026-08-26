using GetGrounded.Application.Voice;

namespace GetGrounded.Tests.Fakes;

public sealed class StubSpeechToText(string transcript) : ISpeechToText
{
    public int Calls { get; private set; }

    public Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(new HearResult(transcript, 0.9f));
    }
}

public sealed class StubLanguageModel(string json) : ILanguageModel
{
    public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
    {
        return Task.FromResult(json);
    }
}

public sealed class DownLanguageModel : ILanguageModel
{
    public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
    {
        throw new ModelUnavailableException();
    }
}

public sealed class MemoryAudioStore : IAudioStore
{
    public Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken)
    {
        return Task.FromResult($"memory/{userId}/{kind}");
    }
}
