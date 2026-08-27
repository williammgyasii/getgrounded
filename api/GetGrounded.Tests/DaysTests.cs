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
            title = "Heavy gym Tuesday",
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
        Assert.Equal("Heavy gym Tuesday", day.Title);
        Assert.Equal(3, day.Commitments.Count);
        Assert.Single(day.Clips);
        Assert.Equal("Gym at 7, read 20 minutes, ship the API test.", day.Clips[0].Transcript);

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

    [Fact]
    public async Task Morning_with_storage_key_is_playable()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym.",
            title = "Gym day",
            storageKey = "user/morning/clip.m4a",
            commitments = new[] { new { title = "Gym" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        Assert.Equal(HttpStatusCode.OK, written.StatusCode);
        Assert.True(day!.Clips[0].Playable);
    }

    [Fact]
    public async Task Morning_accepts_the_phone_plan_shape()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = "Gym at 6, then cook dinner.",
            title = "New day",
            commitments = new object[]
            {
                new
                {
                    title = "Gym",
                    plannedDurationMinutes = 30,
                    plannedStartMinute = 18 * 60 + 21,
                    lifeArea = "HEALTH"
                },
                new
                {
                    title = "Cook dinner",
                    plannedDurationMinutes = 45,
                    plannedStartMinute = 19 * 60,
                    lifeArea = "HOME"
                }
            }
        });

        Assert.Equal(HttpStatusCode.OK, written.StatusCode);
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.Equal("New day", day!.Title);
        Assert.Equal(2, day.Commitments.Count);
    }

    [Fact]
    public async Task Day_title_check_and_delete_round_trip()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym and read.",
            title = "Today's commitment",
            commitments = new[] { new { title = "Gym" }, new { title = "Read" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.NotNull(day);

        var renamed = await client.PatchAsJsonAsync($"/days/{day.Id}", new { title = "Heavy gym day" });
        var afterName = await renamed.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.Equal(HttpStatusCode.OK, renamed.StatusCode);
        Assert.Equal("Heavy gym day", afterName!.Title);

        var marked = await client.PatchAsJsonAsync(
            $"/days/commitments/{day.Commitments[0].Id}",
            new { status = "COMPLETED" });
        var afterMark = await marked.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.Equal("COMPLETED", afterMark!.Commitments[0].Status);

        var removedTask = await client.DeleteAsync($"/days/commitments/{day.Commitments[1].Id}");
        var afterTask = await removedTask.Content.ReadFromJsonAsync<DayBody>(Json);
        Assert.Single(afterTask!.Commitments);

        var removed = await client.DeleteAsync($"/days/{day.Id}");
        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
    }

    [Fact]
    public async Task Evening_can_close_a_named_day()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym.",
            title = "Gym day",
            commitments = new[] { new { title = "Gym" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        var evening = await client.PostAsJsonAsync("/days/evening", new
        {
            timezone = "UTC",
            transcript = "Gym yes.",
            dayId = day!.Id,
            outcomes = new object[] { new { id = day.Commitments[0].Id, status = "COMPLETED" } },
            wins = Array.Empty<object>()
        });
        var closed = await evening.Content.ReadFromJsonAsync<DayBody>(Json);

        Assert.Equal(HttpStatusCode.OK, evening.StatusCode);
        Assert.Equal(day.Id, closed!.Id);
        Assert.Equal("COMPLETED", closed.Commitments[0].Status);
        Assert.Contains(closed.Clips, clip => clip.Kind == "EVENING_REFLECTION");
    }

    [Fact]
    public async Task Midday_writes_the_book_and_refuses_a_closed_night()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym and read.",
            title = "Gym day",
            commitments = new[] { new { title = "Gym" }, new { title = "Read" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        var midday = await client.PostAsJsonAsync("/days/midday", new
        {
            timezone = "UTC",
            transcript = "Gym is done. Add a call with dad. Took a shower.",
            dayId = day!.Id,
            add = new[] { new { title = "Call dad" } },
            outcomes = new object[] { new { id = day.Commitments[0].Id, status = "COMPLETED" } },
            extras = new[] { new { title = "Took a shower" } }
        });
        var updated = await midday.Content.ReadFromJsonAsync<DayBody>(Json);

        Assert.Equal(HttpStatusCode.OK, midday.StatusCode);
        Assert.Equal(day.Id, updated!.Id);
        Assert.Equal("COMPLETED", updated.Commitments[0].Status);
        Assert.Equal("PLANNED", updated.Commitments[1].Status);
        Assert.Equal("Call dad", updated.Commitments[2].Title);
        Assert.Equal(["Took a shower"], updated.Wins.Select(item => item.Title).ToArray());
        Assert.Contains(updated.Clips, clip => clip.Kind == "MIDDAY_UPDATE");

        await client.PostAsJsonAsync("/days/evening", new
        {
            timezone = "UTC",
            transcript = "Night closed.",
            dayId = day.Id,
            outcomes = new object[] { new { id = day.Commitments[0].Id, status = "COMPLETED" } },
            wins = Array.Empty<object>()
        });

        var refused = await client.PostAsJsonAsync("/days/midday", new
        {
            timezone = "UTC",
            transcript = "Too late.",
            dayId = day.Id,
            add = Array.Empty<object>(),
            outcomes = Array.Empty<object>(),
            extras = Array.Empty<object>()
        });
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
    }

    [Fact]
    public async Task Review_scores_closed_nights_only()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var empty = await client.GetAsync("/days/review?timezone=UTC");
        var before = await empty.Content.ReadFromJsonAsync<ReviewBody>(Json);
        Assert.Equal(HttpStatusCode.OK, empty.StatusCode);
        Assert.Equal(0, before!.ClosedNights);
        Assert.Null(before.FollowThrough);

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Gym, read, ship.",
            title = "Heavy gym Tuesday",
            commitments = new[]
            {
                new { title = "Gym" },
                new { title = "Read" },
                new { title = "Ship" }
            }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        var stillOpen = await client.GetAsync("/days/review?timezone=UTC");
        var open = await stillOpen.Content.ReadFromJsonAsync<ReviewBody>(Json);
        Assert.Equal(0, open!.ClosedNights);
        Assert.Null(open.FollowThrough);

        await client.PostAsJsonAsync("/days/evening", new
        {
            timezone = "UTC",
            transcript = "Gym yes, read half, didn't ship, cleaned.",
            dayId = day!.Id,
            outcomes = new object[]
            {
                new { id = day.Commitments[0].Id, status = "COMPLETED" },
                new { id = day.Commitments[1].Id, status = "PARTIAL" },
                new { id = day.Commitments[2].Id, status = "MISSED" }
            },
            wins = new[] { new { title = "Cleaned" } }
        });

        var scored = await client.GetAsync("/days/review?timezone=UTC");
        var review = await scored.Content.ReadFromJsonAsync<ReviewBody>(Json);
        Assert.Equal(HttpStatusCode.OK, scored.StatusCode);
        Assert.Equal(1, review!.ClosedNights);
        Assert.Equal(3, review.Planned);
        Assert.Equal(1, review.Done);
        Assert.Equal(1, review.Partial);
        Assert.Equal(1, review.Missed);
        Assert.Equal(1, review.Extras);
        Assert.Equal(50, review.FollowThrough);
        Assert.Single(review.Nights);
        Assert.Equal(day.Id, review.Nights[0].DayId);
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
    private sealed record DayBody(
        Guid Id,
        string? Title,
        IReadOnlyList<CommitmentBody> Commitments,
        IReadOnlyList<WinBody> Wins,
        IReadOnlyList<ClipBody> Clips);
    private sealed record ClipBody(string Kind, string Transcript, bool Playable);
    private sealed record CommitmentBody(Guid Id, string Title, string Status);
    private sealed record WinBody(string Title);
    private sealed record ReviewBody(
        int ClosedNights,
        int Planned,
        int Done,
        int Partial,
        int Missed,
        int Extras,
        int? FollowThrough,
        IReadOnlyList<ReviewNightBody> Nights);
    private sealed record ReviewNightBody(Guid DayId, int Planned, int Done);
}
