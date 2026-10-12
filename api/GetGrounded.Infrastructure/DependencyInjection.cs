using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Identity;
using GetGrounded.Application.Time;
using GetGrounded.Infrastructure.Book;
using GetGrounded.Infrastructure.Data;
using GetGrounded.Infrastructure.Hear;
using GetGrounded.Infrastructure.Identity;
using GetGrounded.Infrastructure.Time;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient("elevenlabs");
        services.AddHttpClient("openai");
        services.AddSingleton<IClock, SystemClock>();
        RegisterHear(services, configuration);

        var databaseUrl = configuration["DATABASE_URL"];
        var firebaseProjectId = configuration["FIREBASE_PROJECT_ID"];

        if (!string.IsNullOrWhiteSpace(databaseUrl) && !string.IsNullOrWhiteSpace(firebaseProjectId))
        {
            services.AddDbContextFactory<GroundedDbContext>(options =>
                DbContextOptionsFactory.Configure(options, configuration));
            services.AddSingleton<IAuthTokenAccessor, FirebaseAuthTokenAccessor>();
            services.AddSingleton<IAuthUserAccessor, PostgresAuthUserAccessor>();
            services.AddSingleton<IBookDayAccessor, PostgresBookDayAccessor>();
        }
        else
        {
            services.AddSingleton<IAuthTokenAccessor, RejectAllAuthTokenAccessor>();
            services.AddSingleton<IAuthUserAccessor, UnconfiguredAuthUserAccessor>();
            services.AddSingleton<IBookDayAccessor, UnconfiguredBookDayAccessor>();
        }

        return services;
    }

    private static void RegisterHear(IServiceCollection services, IConfiguration configuration)
    {
        if (R2AudioClipAccessor.IsConfigured(configuration))
        {
            services.AddSingleton<IAudioClipAccessor, R2AudioClipAccessor>();
        }
        else
        {
            services.AddSingleton<IAudioClipAccessor, MemoryAudioClipAccessor>();
        }

        if (!string.IsNullOrWhiteSpace(configuration["ELEVENLABS_API_KEY"]))
        {
            services.AddSingleton<ISpeechToTextAccessor, ElevenLabsSpeechToTextAccessor>();
            services.AddSingleton<ISpeechSynthesisAccessor, ElevenLabsSpeechSynthesisAccessor>();
        }
        else
        {
            services.AddSingleton<ISpeechToTextAccessor, RejectSpeechToTextAccessor>();
            services.AddSingleton<ISpeechSynthesisAccessor, RejectSpeechSynthesisAccessor>();
        }

        if (!string.IsNullOrWhiteSpace(configuration["OPENAI_API_KEY"]))
        {
            services.AddSingleton<ILanguageModelAccessor, OpenAiLanguageModelAccessor>();
            services.AddSingleton<PlanExtractInterpreter>();
            services.AddSingleton<IPlanExtractAccessor, OpenAiPlanExtractAccessor>();
            services.AddSingleton<PlanClarifyInterpreter>();
            services.AddSingleton<IPlanClarifyAccessor, OpenAiPlanClarifyAccessor>();
        }
        else
        {
            services.AddSingleton<IPlanExtractAccessor, RejectPlanExtractAccessor>();
            services.AddSingleton<IPlanClarifyAccessor, HeuristicPlanClarifyAccessor>();
        }
    }
}
