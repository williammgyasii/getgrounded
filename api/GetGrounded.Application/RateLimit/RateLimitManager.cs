namespace GetGrounded.Application.RateLimit;

public sealed class RateLimitManager(IRateLimitStore store)
{
    public bool TryAcquire(Guid userId, RateLimitBucket bucket)
    {
        if (!RateLimitEngine.Policies.TryGetValue(bucket, out var policy))
        {
            return true;
        }

        return store.TryAcquire(userId, bucket, policy.Permits, policy.Window);
    }
}
