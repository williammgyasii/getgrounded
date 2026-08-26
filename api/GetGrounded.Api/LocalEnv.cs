namespace GetGrounded.Api;

internal static class LocalEnv
{
    public static void Load()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        foreach (var path in CandidatePaths())
        {
            if (File.Exists(path))
            {
                Apply(path);
            }
        }
    }

    private static IEnumerable<string> CandidatePaths()
    {
        var api = AppContext.BaseDirectory;
        yield return Path.GetFullPath(Path.Combine(api, "..", "..", "..", ".env"));
        yield return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
        yield return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "GetGrounded.Api", ".env"));
    }

    private static void Apply(string path)
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
            if (key.Length == 0 || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
