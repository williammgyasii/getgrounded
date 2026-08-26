using Npgsql;

namespace GetGrounded.Infrastructure.Data;

internal static class DatabaseUrl
{
    public static string ToNpgsql(string connectionString)
    {
        if (!connectionString.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.Trim('/'),
            Timeout = 2
        };

        builder.Host = QueryValue(uri.Query, "host") ?? uri.Host;

        if (uri.Port > 0)
        {
            builder.Port = uri.Port;
        }

        return builder.ConnectionString;
    }

    private static string? QueryValue(string query, string key)
    {
        if (string.IsNullOrEmpty(query))
        {
            return null;
        }

        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            if (parts.Length == 2 && parts[0] == key)
            {
                return Uri.UnescapeDataString(parts[1]);
            }
        }

        return null;
    }
}
