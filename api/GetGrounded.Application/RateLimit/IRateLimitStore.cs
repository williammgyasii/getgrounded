namespace GetGrounded.Application.RateLimit;

public interface IRateLimitStore
{
    /// <summary>
    /// Returns false when the caller exceeded the limit for this bucket in the current window.
    /// </summary>
    bool TryAcquire(Guid userId, RateLimitBucket bucket, int permitLimit, TimeSpan window);
}
