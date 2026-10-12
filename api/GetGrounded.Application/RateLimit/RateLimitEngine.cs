namespace GetGrounded.Application.RateLimit;

public sealed class RateLimitEngine
{
    public static IReadOnlyDictionary<RateLimitBucket, (int Permits, TimeSpan Window)> Policies { get; } =
        new Dictionary<RateLimitBucket, (int, TimeSpan)>
        {
            [RateLimitBucket.Identity] = (30, TimeSpan.FromMinutes(1)),
            [RateLimitBucket.Read] = (120, TimeSpan.FromMinutes(1)),
            [RateLimitBucket.Write] = (40, TimeSpan.FromMinutes(1)),
            [RateLimitBucket.VoiceUpload] = (24, TimeSpan.FromHours(1)),
            [RateLimitBucket.VoiceLlm] = (40, TimeSpan.FromHours(1)),
            [RateLimitBucket.VoiceSpeak] = (60, TimeSpan.FromHours(1)),
            [RateLimitBucket.VoiceClip] = (120, TimeSpan.FromHours(1)),
        };
}
