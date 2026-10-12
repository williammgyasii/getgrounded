using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class PlanMorningTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Morning_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/days/morning", MorningBody());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Morning_with_empty_commitments_is_bad_request()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/days/morning", MorningBody([]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Morning_with_valid_body_saves_day()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/days/morning", MorningBody());
        var body = await response.Content.ReadFromJsonAsync<DayRecord>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.ShowedUp);
        Assert.Single(body.Commitments);
        Assert.Equal("Write tests", body.Commitments[0].Title);
        Assert.Equal("PLANNED", body.Commitments[0].Status);
    }

    [Fact]
    public async Task Morning_persists_coach_note()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = "Gym and reading.",
            coachNote = "Block gym before the day runs away from you.",
            commitments = new[]
            {
                new
                {
                    title = "Gym",
                    plannedDurationMinutes = 45,
                    plannedStartMinute = (int?)null,
                    lifeArea = "HEALTH"
                }
            }
        });
        var body = await response.Content.ReadFromJsonAsync<DayRecord>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Block gym before the day runs away from you.", body.CoachNote);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }

    private static object MorningBody(object[]? commitments = null) => new
    {
        timezone = "America/New_York",
        transcript = "Write tests and ship the plan slice.",
        title = (string?)null,
        storageKey = (string?)null,
        words = (object?)null,
        commitments = commitments ?? new[]
        {
            new
            {
                title = "Write tests",
                plannedDurationMinutes = 30,
                plannedStartMinute = 540,
                lifeArea = "WORK"
            }
        }
    };
}
