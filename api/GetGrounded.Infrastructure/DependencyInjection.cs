using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Health;
using GetGrounded.Application.Time;
using GetGrounded.Application.Voice;
using GetGrounded.Infrastructure.Auth;
using GetGrounded.Infrastructure.Book;
using GetGrounded.Infrastructure.Health;
using GetGrounded.Infrastructure.Time;
using GetGrounded.Infrastructure.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient("google");
        services.AddHttpClient("elevenlabs");
        services.AddSingleton<ITokenVerifier, FirebaseTokenVerifier>();
        services.AddSingleton<IUserStore, PostgresUserStore>();
        services.AddSingleton<IBookStore, PostgresBookStore>();
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IDatabasePing, NpgsqlDatabasePing>();
        if (R2AudioStore.IsConfigured(configuration))
        {
            services.AddSingleton<IAudioStore, R2AudioStore>();
        }
        else
        {
            services.AddSingleton<IAudioStore, MemoryAudioStore>();
        }
        services.AddSingleton<ISpeechToText, ElevenLabsSpeechToText>();
        services.AddSingleton<ILanguageModel, VertexLanguageModel>();
        return services;
    }
}
