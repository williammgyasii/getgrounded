using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;
using GetGrounded.Application.Voice;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class ClipTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Hear_returns_transcript_and_does_not_book()
    {
        var speech = new StubSpeechToText("Gym at 7 and read.");
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Gym"},{"title":"Read"}]}""");
        using var factory = CreateFactory(speech, model);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = AudioForm("MORNING_PLAN", [1, 2, 3, 4]);
        var heard = await client.PostAsync("/voice/hear", form);
        var body = await heard.Content.ReadFromJsonAsync<HearBody>(Json);
        var deskResponse = await client.GetAsync("/days/today?timezone=UTC");
        var desk = await deskResponse.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.OK, heard.StatusCode);
        Assert.Equal("Gym at 7 and read.", body!.Transcript);
        Assert.False(string.IsNullOrWhiteSpace(body.StorageKey));
        var store = factory.Services.GetRequiredService<IAudioStore>();
        var saved = await store.GetAsync(body.StorageKey, CancellationToken.None);
        Assert.NotNull(saved);
        Assert.Equal(1, speech.Calls);
        Assert.Null(desk!.Today);
        Assert.Equal(0, desk.StreakDays);
    }

    [Fact]
    public async Task Morning_clip_does_not_book()
    {
        var speech = new StubSpeechToText("Gym at 7 and read.");
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Gym"},{"title":"Read"}]}""");
        using var factory = CreateFactory(speech, model);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = AudioForm("MORNING_PLAN", [1, 2, 3, 4]);
        var response = await client.PostAsync("/voice/clips", form);
        var deskResponse = await client.GetAsync("/days/today?timezone=UTC");
        var desk = await deskResponse.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(desk!.Today);
    }

    [Fact]
    public async Task Clip_without_token_is_unauthorized()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("x"),
            new StubLanguageModel("""{"commitments":[]}"""));
        using var client = factory.CreateClient();

        var response = await client.PostAsync("/voice/clips", AudioForm("MORNING_PLAN", [1]));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Clip_over_two_megabytes_is_too_large()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("x"),
            new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsync(
            "/voice/hear",
            AudioForm("MORNING_PLAN", new byte[ClipService.MaxBytes + 1]));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task Hear_accepts_octet_stream_phone_audio()
    {
        var speech = new StubSpeechToText("Gym at 7 and read.");
        using var factory = CreateFactory(speech, new StubLanguageModel("""{"commitments":[]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = AudioForm("MORNING_PLAN", [1, 2, 3, 4], "application/octet-stream");
        var response = await client.PostAsync("/voice/hear", form);
        var body = await response.Content.ReadFromJsonAsync<HearBody>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Gym at 7 and read.", body!.Transcript);
    }

    [Fact]
    public async Task Empty_transcript_is_unprocessable()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("  "),
            new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsync("/voice/hear", AudioForm("MORNING_PLAN", [1, 2]));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Extract_morning_returns_title_and_commitments_without_booking()
    {
        var model = new StubLanguageModel(
            """{"title":"Heavy gym Tuesday","commitments":[{"title":"Gym"},{"title":"Read"}]}""");
        using var factory = CreateFactory(new StubSpeechToText("x"), model);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "MORNING_PLAN",
            transcript = "Gym at 7 and read.",
            timezone = "UTC",
            spokenAt = "2026-08-26T12:00:00Z"
        });
        var draft = await response.Content.ReadFromJsonAsync<ExtractBody>(Json);
        var deskResponse = await client.GetAsync("/days/today?timezone=UTC");
        var desk = await deskResponse.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Heavy gym Tuesday", draft!.Title);
        Assert.Equal(["Gym", "Read"], draft.Commitments.Select(item => item.Title).ToArray());
        Assert.Equal(12 * 60, draft.Commitments[0].PlannedStartMinute);
        Assert.Equal(12 * 60 + 30, draft.Commitments[1].PlannedStartMinute);
        Assert.Null(desk!.Today);
    }

    [Fact]
    public async Task Garbage_extract_is_bad_gateway()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("hello"),
            new StubLanguageModel("not-json"));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "MORNING_PLAN",
            transcript = "hello"
        });

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task Model_down_is_unavailable()
    {
        using var factory = CreateFactory(new StubSpeechToText("hello"), new DownLanguageModel());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsJsonAsync("/voice/extract", new
        {
            kind = "MORNING_PLAN",
            transcript = "hello"
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Play_returns_uploaded_bytes()
    {
        var bytes = new byte[] { 1, 2, 3, 4 };
        using var factory = CreateFactory(
            new StubSpeechToText("Gym at 7."),
            new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = AudioForm("MORNING_PLAN", bytes);
        var heard = await client.PostAsync("/voice/hear", form);
        var hearBody = await heard.Content.ReadFromJsonAsync<HearBody>(Json);
        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = hearBody!.Transcript,
            title = "Gym day",
            storageKey = hearBody.StorageKey,
            commitments = new[] { new { title = "Gym" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        var play = await client.GetAsync($"/voice/clips/{day!.Clips[0].Id}");
        var played = await play.Content.ReadAsByteArrayAsync();

        Assert.Equal(HttpStatusCode.OK, play.StatusCode);
        Assert.Equal("audio/mp4", play.Content.Headers.ContentType?.MediaType);
        Assert.Equal(bytes, played);
    }

    [Fact]
    public async Task Play_unknown_id_is_not_found()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("x"),
            new StubLanguageModel("""{"commitments":[]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync($"/voice/clips/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Play_without_storage_key_is_not_found()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("x"),
            new StubLanguageModel("""{"commitments":[]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var written = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "UTC",
            transcript = "Typed plan.",
            title = "Typed",
            commitments = new[] { new { title = "Gym" } }
        });
        var day = await written.Content.ReadFromJsonAsync<DayBody>(Json);

        var response = await client.GetAsync($"/voice/clips/{day!.Clips[0].Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Play_without_token_is_unauthorized()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("x"),
            new StubLanguageModel("""{"commitments":[]}"""));
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/voice/clips/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static MultipartFormDataContent AudioForm(string kind, byte[] bytes, string contentType = "audio/mp4")
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(kind), "kind");
        form.Add(new StringContent("UTC"), "timezone");
        form.Add(
            new ByteArrayContent(bytes) { Headers = { ContentType = new MediaTypeHeaderValue(contentType) } },
            "audio",
            "clip.m4a");
        return form;
    }

    private static WebApplicationFactory<Program> CreateFactory(ISpeechToText speech, ILanguageModel model)
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
                services.AddSingleton(speech);
                services.AddSingleton(model);
                services.AddSingleton<IAudioStore, Fakes.MemoryAudioStore>();
            });
        });
    }

    private sealed record HearBody(string Transcript, string? StorageKey);
    private sealed record ExtractBody(string? Title, IReadOnlyList<ExtractItem> Commitments);
    private sealed record ExtractItem(
        string Title,
        int? PlannedDurationMinutes,
        int? PlannedStartMinute,
        string? LifeArea);
    private sealed record DeskBody(int StreakDays, DayBody? Today);
    private sealed record DayBody(IReadOnlyList<CommitmentBody> Commitments, IReadOnlyList<ClipPlayBody> Clips);
    private sealed record ClipPlayBody(Guid Id, bool Playable);
    private sealed record CommitmentBody(Guid Id, string Title, string Status);
}
