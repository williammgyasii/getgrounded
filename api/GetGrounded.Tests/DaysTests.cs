using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class DaysTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Today_without_token_is_unauthorized()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/days/today?timezone=UTC");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Morning_then_today_shows_the_plan_and_streak()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym at 7, read 20 minutes, ship the API test.",
            commitments = new[]
            {
                new { title = "Gym" },
                new { title = "Read 20 minutes" },
                new { title = "Ship the API test" }
            }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.Equal(HttpStatusCode.OK, written.StatusCode);
        Assert.NotNull(day);
        Assert.Equal(3, day.Commitments.Count);

        var evening = await client.PostAsJsonAsync("/days/evening", new
        {
            timezone = "UTC",
            transcript = "Gym yes, read half, didn't ship, cleaned the kitchen.",
            outcomes = new object[]
            {
                new { id = day.Commitments[0].Id, status = "COMPLETED" },
                new { id = day.Commitments[1].Id, status = "PARTIAL", actualDurationMinutes = 10 },
                new { id = day.Commitments[2].Id, status = "MISSED" }
            },
            wins = new[] { new { title = "Cleaned the kitchen" } }
        });
        Assert.Equal(HttpStatusCode.OK, evening.StatusCode);

        var deskResponse = await client.GetAsync("/days/today?timezone=UTC");
        var desk = await deskResponse.Content.ReadFromJsonAsync<DeskBody>(Json);
        Assert.Equal(HttpStatusCode.OK, deskResponse.StatusCode);
        Assert.NotNull(desk);
        Assert.Equal(1, desk.StreakDays);
        Assert.Equal("COMPLETED", desk.Today!.Commitments[0].Status);
        Assert.Equal("PARTIAL", desk.Today.Commitments[1].Status);
        Assert.Equal("MISSED", desk.Today.Commitments[2].Status);
        Assert.Equal("Cleaned the kitchen", desk.Today.Wins[0].Title);

        var historyResponse = await client.GetAsync("/days?timezone=UTC");
        var history = await historyResponse.Content.ReadFromJsonAsync<List<DayBody>>(Json);
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        Assert.NotNull(history);
        Assert.Single(history);
    }

    private static WebApplicationFactory<Program> CreateFactory()
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ITokenVerifier, StubVerifier>();
                services.AddSingleton<IUserStore, LivingUserStore>();
                services.AddSingleton<IBookStore, MemoryBookStore>();
                services.AddSingleton<IClock>(_ => new TestClock(DateTimeOffset.Parse("2026-08-26T12:00:00Z")));
            });
        });
    }

    private sealed record DeskBody(int StreakDays, DayBody? Today);
    private sealed record DayBody(IReadOnlyList<CommitmentBody> Commitments, IReadOnlyList<WinBody> Wins);
    private sealed record CommitmentBody(Guid Id, string Title, string Status);
    private sealed record WinBody(string Title);
}
