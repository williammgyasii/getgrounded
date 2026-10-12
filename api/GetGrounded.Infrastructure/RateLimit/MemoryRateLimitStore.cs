using System.Collections.Concurrent;
using GetGrounded.Application.RateLimit;
using GetGrounded.Application.Time;

namespace GetGrounded.Infrastructure.RateLimit;

public sealed class MemoryRateLimitStore(IClock clock) : IRateLimitStore
{
    private readonly ConcurrentDictionary<string, WindowCounter> _windows = new();

    public bool TryAcquire(Guid userId, RateLimitBucket bucket, int permitLimit, TimeSpan window)
    {
        if (permitLimit <= 0)
        {
            return false;
        }

        var key = $"{userId:N}:{bucket}";
        var now = clock.UtcNow;
        var counter = _windows.GetOrAdd(key, _ => new WindowCounter());

        lock (counter)
        {
            if (now - counter.WindowStart >= window)
            {
                counter.WindowStart = now;
                counter.Count = 0;
            }

            if (counter.Count >= permitLimit)
            {
                return false;
            }

            counter.Count++;
            return true;
        }
    }

    private sealed class WindowCounter
    {
        public DateTimeOffset WindowStart { get; set; } = DateTimeOffset.MinValue;
        public int Count { get; set; }
    }
}
