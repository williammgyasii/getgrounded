using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class DayEditTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Delete_day_removes_it_from_history()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);
        var saved = await SaveMorning(client);

        var response = await client.DeleteAsync($"/days/{saved.Id}");
        var history = await client.GetFromJsonAsync<List<DayRecord>>("/days?timezone=America/New_York", Json);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.NotNull(history);
        Assert.DoesNotContain(history, day => day.Id == saved.Id);
    }

    [Fact]
    public async Task Delete_commitment_removes_task_from_day()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);
        var saved = await SaveMorning(client);
        var taskId = saved.Commitments[0].Id;

        var response = await client.DeleteAsync($"/days/commitments/{taskId}");
        var body = await response.Content.ReadFromJsonAsync<DayRecord>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Empty(body.Commitments);
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
}
