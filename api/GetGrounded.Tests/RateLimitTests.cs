using System.Net;
using System.Net.Http.Headers;
using GetGrounded.Application.RateLimit;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class RateLimitTests
{
    [Fact]
    public async Task Me_after_limit_returns_429()
    {
        using var factory = CreateFactory(new DenyAfterRateLimitStore(maxPermits: 2));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/me")).StatusCode);

        var limited = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Contains("rate_limit", await limited.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Me_without_token_is_still_unauthorized_not_rate_limited()
    {
        using var factory = CreateFactory(new DenyAfterRateLimitStore(maxPermits: 0));
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public void Memory_store_resets_after_window()
    {
        var clock = new FakeClock { UtcNow = DateTimeOffset.Parse("2026-01-01T12:00:00Z") };
        var store = new Infrastructure.RateLimit.MemoryRateLimitStore(clock);
        var userId = Guid.NewGuid();

        Assert.True(store.TryAcquire(userId, RateLimitBucket.Identity, permitLimit: 2, TimeSpan.FromMinutes(1)));
        Assert.True(store.TryAcquire(userId, RateLimitBucket.Identity, permitLimit: 2, TimeSpan.FromMinutes(1)));
        Assert.False(store.TryAcquire(userId, RateLimitBucket.Identity, permitLimit: 2, TimeSpan.FromMinutes(1)));

        clock.UtcNow = clock.UtcNow.AddMinutes(1);

        Assert.True(store.TryAcquire(userId, RateLimitBucket.Identity, permitLimit: 2, TimeSpan.FromMinutes(1)));
    }

    private static WebApplicationFactory<Program> CreateFactory(IRateLimitStore store) =>
        TestFactory.Create(rateLimits: store);
}
