using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Application.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<AuthEngine>();
        services.AddSingleton<AuthManager>();
        services.AddSingleton<PlanMorningManager>();
        services.AddSingleton<DeskManager>();
        services.AddSingleton<HistoryManager>();
        services.AddSingleton<DayEditManager>();
        services.AddSingleton<PlanExtractManager>();
        services.AddSingleton<PlanClarifyManager>();
        services.AddSingleton<MuseVoiceManager>();
        services.AddSingleton<HearManager>();
        services.AddSingleton<VoiceClipManager>();
        return services;
    }
}
