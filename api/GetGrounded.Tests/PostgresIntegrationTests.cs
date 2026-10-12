using GetGrounded.Application.Book;
using GetGrounded.Infrastructure.Book;
using GetGrounded.Infrastructure.Data;
using GetGrounded.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GetGrounded.Tests;

[Trait("Category", "Integration")]
public class PostgresIntegrationTests
{
    private static bool TryCreateServices(out ServiceProvider? provider, out string? skipReason)
    {
        GetGrounded.Api.LocalEnv.Load();
        var apiEnv = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env"));
        if (File.Exists(apiEnv))
        {
            LoadEnvFile(apiEnv);
        }

        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            provider = null;
            skipReason = "Set DATABASE_URL in api/.env (Neon connection string).";
            return false;
        }

        if (databaseUrl.Contains("127.0.0.1", StringComparison.Ordinal) ||
            databaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            provider = null;
            skipReason = "Point DATABASE_URL at Neon, not local Postgres.";
            return false;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DATABASE_URL"] = databaseUrl,
                ["FIREBASE_PROJECT_ID"] = "get-ground-448ca"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddDbContextFactory<GroundedDbContext>(options =>
            DbContextOptionsFactory.Configure(options, configuration));
        services.AddSingleton<PostgresAuthUserAccessor>();
        services.AddSingleton<PostgresBookDayAccessor>();

        provider = services.BuildServiceProvider();
        skipReason = null;
        return true;
    }

    private static void LoadEnvFile(string path)
    {
        foreach (var raw in File.ReadAllLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#') || !line.Contains('='))
            {
                continue;
            }

            var split = line.Split('=', 2);
            var key = split[0].Trim();
            var value = split[1].Trim().Trim('"');
            if (key.Length == 0 || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    [SkippableFact]
    public async Task Neon_user_and_morning_plan_round_trip()
    {
        Skip.IfNot(
            TryCreateServices(out var services, out var skipReason),
            skipReason ?? "Neon DATABASE_URL not configured.");

        await using var scope = services!.CreateAsyncScope();
        var users = scope.ServiceProvider.GetRequiredService<PostgresAuthUserAccessor>();
        var book = scope.ServiceProvider.GetRequiredService<PostgresBookDayAccessor>();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<GroundedDbContext>>();

        await using (var db = await dbFactory.CreateDbContextAsync())
        {
            await db.Database.MigrateAsync();
        }

        var loginId = $"test-{Guid.NewGuid():N}";
        var user = await users.FindOrCreateAsync(loginId);
        var localDate = new DateOnly(2026, 8, 26);
        var saved = await book.SaveMorningAsync(
            user.Id,
            localDate,
            "America/New_York",
            "Write tests and ship plan.",
            [new PlannedItem("Write tests", 30, 540, "WORK")],
            "Focus day");

        Assert.True(saved.ShowedUp);
        Assert.Equal("Focus day", saved.Title);
        Assert.Single(saved.Commitments);
        Assert.Equal("PLANNED", saved.Commitments[0].Status);

        var loaded = await book.GetDayAsync(user.Id, localDate);
        Assert.NotNull(loaded);
        Assert.Equal(saved.Id, loaded!.Id);
        Assert.Single(loaded.Clips);
        Assert.Equal("MORNING_PLAN", loaded.Clips[0].Kind);
    }
}
