using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Health;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<AuthService>();
        services.AddSingleton<HealthService>();
        services.AddSingleton<BookService>();
        return services;
    }
}
