using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Health;
using GetGrounded.Application.Voice;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<AuthService>();
        services.AddSingleton<HealthService>();
        services.AddSingleton<BookService>();
        services.AddSingleton<IDayInterpreter, DayInterpreter>();
        services.AddSingleton<ClipService>();
        return services;
    }
}
