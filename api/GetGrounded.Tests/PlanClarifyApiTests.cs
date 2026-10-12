using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class PlanClarifyApiTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Clarify_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/voice/clarify", Body());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Clarify_with_gym_without_time_returns_question()
    {
        using var factory = TestFactory.Create();
        using var client = Authed(factory);

        var response = await client.PostAsJsonAsync(
            "/voice/clarify",
            Body("Gym later, read my book, call friends."));
        var payload = await response.Content.ReadFromJsonAsync<ClarifyPayload>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload!.MuseLine));
        Assert.True(payload.Questions.Length <= 1);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }

    private static object Body(string transcript = "Gym at 7") => new
    {
        kind = "MORNING_PLAN",
        transcript,
        timezone = "America/New_York"
    };

    private sealed record ClarifyPayload(string MuseLine, ClarifyQuestion[] Questions);

    private sealed record ClarifyQuestion(string Id, string Prompt, string? Topic);
}
