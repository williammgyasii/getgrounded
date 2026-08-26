using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class HealthTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Health_without_database_url_reports_not_configured()
    {
        using var factory = CreateFactory(databaseUrl: null);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await ReadHealth(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertEnvelope(body, overall: "degraded", environment: "Development");
        Assert.Equal("not_configured", body.Database.Status);
        Assert.Equal("postgresql", body.Database.Engine);
        Assert.Null(body.Database.Name);
        Assert.Null(body.Database.ServerVersion);
        Assert.Null(body.Database.LatencyMs);
    }

    [Fact]
    public async Task Health_with_unreachable_database_reports_unavailable()
    {
        using var factory = CreateFactory(
            databaseUrl: "Host=127.0.0.1;Port=1;Username=getgrounded;Password=x;Database=getgrounded;Timeout=1");
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await ReadHealth(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertEnvelope(body, overall: "degraded", environment: "Development");
        Assert.Equal("unavailable", body.Database.Status);
        Assert.Equal("postgresql", body.Database.Engine);
        Assert.Null(body.Database.Name);
        Assert.Null(body.Database.ServerVersion);
        Assert.Null(body.Database.LatencyMs);
    }

    [Fact]
    public async Task Health_when_database_answers_reports_connected_details()
    {
        using var factory = CreateFactory(
            databaseUrl: "Host=stub;Username=getgrounded;Password=x;Database=getgrounded",
            ping: new StubPing());
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await ReadHealth(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertEnvelope(body, overall: "ok", environment: "Development");
        Assert.Equal("connected", body.Database.Status);
        Assert.Equal("postgresql", body.Database.Engine);
        Assert.Equal("getgrounded", body.Database.Name);
        Assert.False(string.IsNullOrWhiteSpace(body.Database.ServerVersion));
        Assert.True(body.Database.LatencyMs is >= 0);
    }

    private static WebApplicationFactory<Program> CreateFactory(string? databaseUrl, IDatabasePing? ping = null)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DATABASE_URL"] = databaseUrl
                });
            });

            if (ping is not null)
            {
                builder.ConfigureTestServices(services => services.AddSingleton(ping));
            }
        });
    }

    private sealed class StubPing : IDatabasePing
    {
        public Task<DatabasePingResult> PingAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new DatabasePingResult("connected", "getgrounded", "17.5", 1.2));
        }
    }

    private static async Task<HealthResponse> ReadHealth(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>(Json);
        Assert.NotNull(body);
        return body;
    }

    private static void AssertEnvelope(HealthResponse body, string overall, string environment)
    {
        Assert.Equal(overall, body.Status);
        Assert.Equal("getgrounded-api", body.Service);
        Assert.Equal(environment, body.Environment);
        Assert.True(body.CheckedAt <= DateTimeOffset.UtcNow.AddSeconds(5));
        Assert.True(body.CheckedAt >= DateTimeOffset.UtcNow.AddMinutes(-1));
    }

    private sealed record HealthResponse(
        string Status,
        string Service,
        string Environment,
        DateTimeOffset CheckedAt,
        DatabaseHealth Database);

    private sealed record DatabaseHealth(
        string Status,
        string Engine,
        string? Name,
        string? ServerVersion,
        double? LatencyMs);
}
