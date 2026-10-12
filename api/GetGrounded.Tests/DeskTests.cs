using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class DeskTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Desk_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/days/today?timezone=America/New_York");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Desk_with_no_days_returns_empty_snapshots()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.GetAsync("/days/today?timezone=America/New_York");
        var body = await response.Content.ReadFromJsonAsync<DeskRecord>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(0, body.StreakDays);
        Assert.Null(body.Today);
        Assert.Null(body.Yesterday);
    }

    [Fact]
    public async Task Desk_after_morning_save_shows_today_and_streak()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = "Write tests",
            commitments = new[] { new { title = "Write tests" } }
        });

        var response = await client.GetAsync("/days/today?timezone=America/New_York");
        var body = await response.Content.ReadFromJsonAsync<DeskRecord>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(1, body.StreakDays);
        Assert.NotNull(body.Today);
        Assert.Single(body.Today!.Commitments);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }
}
