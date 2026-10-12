using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class HistoryTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task History_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/days?timezone=America/New_York");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task History_after_morning_save_lists_the_day()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = "Write tests",
            commitments = new[] { new { title = "Write tests" } }
        });

        var response = await client.GetAsync("/days?timezone=America/New_York");
        var body = await response.Content.ReadFromJsonAsync<List<DayRecord>>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Single(body);
        Assert.Single(body[0].Commitments);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }
}
