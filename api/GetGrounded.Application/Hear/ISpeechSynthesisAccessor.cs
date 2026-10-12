namespace GetGrounded.Application.Hear;

public interface ISpeechSynthesisAccessor
{
    Task<MuseSpeechClip> SynthesizeAsync(string text, CancellationToken cancellationToken = default);
}

public sealed record MuseSpeechClip(byte[] Bytes, string ContentType);
