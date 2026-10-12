using GetGrounded.Application.RateLimit;

namespace GetGrounded.Tests.Fakes;

internal sealed class DenyAfterRateLimitStore(int maxPermits) : IRateLimitStore
{
    private int _count;

    public bool TryAcquire(Guid userId, RateLimitBucket bucket, int permitLimit, TimeSpan window)
    {
        _count++;
        return _count <= maxPermits;
    }
}
