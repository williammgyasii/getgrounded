using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace GetGrounded.Infrastructure.Data;

public sealed class GroundedDbContextFactory : IDesignTimeDbContextFactory<GroundedDbContext>
{
    public GroundedDbContext CreateDbContext(string[] args)
    {
        var cwd = Directory.GetCurrentDirectory();
        LoadEnv(Path.Combine(cwd, ".env"));
        LoadEnv(Path.Combine(cwd, "..", ".env"));

        var configuration = new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<GroundedDbContext>();
        DbContextOptionsFactory.Configure(options, configuration);
        return new GroundedDbContext(options.Options);
    }

    private static void LoadEnv(string path)
    {
        if (!File.Exists(path))
        {
            return;
        }

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
            if (key.Length == 0 || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
