using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Infrastructure.Hear;
using GetGrounded.Application.Identity;
using GetGrounded.Application.RateLimit;
using GetGrounded.Application.Time;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests.Fakes;

internal static class TestFactory
{
    public static WebApplicationFactory<Program> Create(
        IAuthTokenAccessor? tokens = null,
        IAuthUserAccessor? users = null,
        IBookDayAccessor? book = null,
        IClock? clock = null,
        ISpeechToTextAccessor? speech = null,
        IAudioClipAccessor? audio = null,
        IPlanExtractAccessor? extract = null,
        IRateLimitStore? rateLimits = null)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                Replace(services, tokens ?? new StubAuthTokenAccessor());
                Replace(services, users ?? new StubAuthUserAccessor());
                Replace(services, book ?? new MemoryBookDayAccessor());
                Replace(services, clock ?? new FakeClock());

                if (speech is not null)
                {
                    Replace(services, speech);
                }

                if (audio is not null)
                {
                    Replace(services, audio);
                }

                Replace(services, extract ?? new StubPlanExtractAccessor());
                if (rateLimits is not null)
                {
                    Replace(services, rateLimits);
                }
                foreach (var descriptor in services.Where(item => item.ServiceType == typeof(IMiddayExtractAccessor)).ToList())
                {
                    services.Remove(descriptor);
                }
                services.AddSingleton<IMiddayExtractAccessor, HeuristicMiddayExtractAccessor>();
            });
        });
    }

    private static void Replace<T>(IServiceCollection services, T implementation) where T : class
    {
        foreach (var descriptor in services.Where(item => item.ServiceType == typeof(T)).ToList())
        {
            services.Remove(descriptor);
        }

        services.AddSingleton(implementation);
    }
}
