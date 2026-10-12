namespace GetGrounded.Application.Hear;

public sealed class MuseVoiceManager(ISpeechSynthesisAccessor synthesis)
{
    private const int MaxChars = 600;

    public Task<MuseSpeechClip> SpeakAsync(string text, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("text", nameof(text));
        }

        var trimmed = text.Trim();
        if (trimmed.Length > MaxChars)
        {
            trimmed = trimmed[..MaxChars];
        }

        return synthesis.SynthesizeAsync(trimmed, cancellationToken);
    }
}
