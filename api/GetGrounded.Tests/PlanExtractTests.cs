using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Hear;
using GetGrounded.Infrastructure.Hear;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class PlanExtractTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Extract_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/voice/extract", MorningBody());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Extract_with_blank_transcript_is_bad_request()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/voice/extract", MorningBody("   "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Extract_with_bad_kind_is_bad_request()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "UNKNOWN",
            transcript = "Run",
            timezone = "America/New_York",
            spokenAt = "2026-08-26T12:00:00Z"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Extract_evening_kind_is_not_implemented()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "EVENING_REFLECTION",
            transcript = "Done",
            dayId = Guid.NewGuid()
        });

        Assert.Equal(HttpStatusCode.NotImplemented, response.StatusCode);
    }

    [Fact]
    public async Task Extract_morning_returns_commitments()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync(
            "/voice/extract",
            MorningBody("Write tests\nShip plan slice"));
        var body = await response.Content.ReadFromJsonAsync<MorningDraft>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.Commitments.Count >= 1);
        Assert.Contains(
            body.Commitments,
            item => item.Title.Contains("Write tests", StringComparison.OrdinalIgnoreCase)
                || item.Title.Contains("Ship plan", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Extract_without_openai_key_returns_service_unavailable()
    {
        using var factory = TestFactory.Create(extract: new RejectPlanExtractAccessor());
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/voice/extract", MorningBody("Gym at 7 then standup at 9"));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }

    private static object MorningBody(string transcript = "Write tests and ship the plan slice.") => new
    {
        kind = "MORNING_PLAN",
        transcript,
        timezone = "America/New_York",
        spokenAt = "2026-08-26T12:00:00Z"
    };
}
