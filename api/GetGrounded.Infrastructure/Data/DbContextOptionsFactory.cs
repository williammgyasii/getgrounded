using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace GetGrounded.Infrastructure.Data;

public static class DbContextOptionsFactory
{
    public static void Configure(DbContextOptionsBuilder options, IConfiguration configuration)
    {
        var connectionString = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DATABASE_URL is not configured.");
        }

        options.UseNpgsql(DatabaseUrl.ToNpgsql(connectionString));
    }
}
