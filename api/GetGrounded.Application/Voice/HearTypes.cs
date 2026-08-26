namespace GetGrounded.Application.Voice;

public sealed record HearClip(byte[] Bytes, string ContentType);

public sealed record StoredClip(byte[] Bytes, string ContentType);

public sealed record SpokenWord(string Text, double Start, double End);

public sealed record HearResult(
    string Transcript,
    float? Confidence,
    string? StorageKey = null,
    IReadOnlyList<SpokenWord>? Words = null);
