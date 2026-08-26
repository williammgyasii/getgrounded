namespace GetGrounded.Application.Voice;

public sealed record HearClip(byte[] Bytes, string ContentType);

public sealed record HearResult(string Transcript, float? Confidence);
