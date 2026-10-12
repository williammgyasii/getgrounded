namespace GetGrounded.Application.RateLimit;

public enum RateLimitBucket
{
    Identity,
    Read,
    Write,
    VoiceUpload,
    VoiceLlm,
    VoiceSpeak,
    VoiceClip,
}
