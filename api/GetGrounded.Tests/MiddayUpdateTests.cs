using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class MiddayUpdateTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Midday_update_adds_task_without_removing_existing()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);
        var saved = await SaveMorning(client);

        var extract = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "MIDDAY_UPDATE",
            transcript = "I also want to call some friends",
            dayId = saved.Id
        });
        extract.EnsureSuccessStatusCode();
        var draft = await extract.Content.ReadFromJsonAsync<MiddayDraftResponse>(Json);
        Assert.NotNull(draft);
        Assert.Contains(draft.Add, item => item.Title.Contains("call", StringComparison.OrdinalIgnoreCase));

        var response = await client.PostAsJsonAsync("/days/midday", new
        {
            timezone = "America/New_York",
            transcript = "I also want to call some friends",
            dayId = saved.Id.ToString(),
            add = draft.Add,
            outcomes = draft.Outcomes,
            extras = draft.Extras
        });

        var body = await response.Content.ReadFromJsonAsync<DayRecord>(Json);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(2, body.Commitments.Count);
        Assert.Contains(body.Commitments, item => item.Title == "Gym");
        Assert.Contains(body.Commitments, item => item.Title.Contains("call", StringComparison.OrdinalIgnoreCase));
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }

    private static async Task<DayRecord> SaveMorning(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = "Gym then standup",
            title = "Tuesday",
            commitments = new[]
            {
                new { title = "Gym", plannedDurationMinutes = 60, plannedStartMinute = 420, lifeArea = "PERSONAL" }
            }
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<DayRecord>(Json))!;
    }

    private sealed record MiddayDraftResponse(
        IReadOnlyList<MiddayAddResponse> Add,
        IReadOnlyList<MiddayOutcomeResponse> Outcomes,
        IReadOnlyList<MiddayExtraResponse> Extras);

    private sealed record MiddayAddResponse(string Title);

    private sealed record MiddayOutcomeResponse(string Id, string Status);

    private sealed record MiddayExtraResponse(string Title);
}
