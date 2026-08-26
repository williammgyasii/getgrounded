using GetGrounded.Application.Auth;
using GetGrounded.Application.Health;
using GetGrounded.Infrastructure.Auth;
using GetGrounded.Infrastructure.Health;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ITokenVerifier, FirebaseTokenVerifier>();
        services.AddSingleton<IUserStore, PostgresUserStore>();
        services.AddSingleton<IDatabasePing, NpgsqlDatabasePing>();
        return services;
    }
}
