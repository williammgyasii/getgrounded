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
    public async Task Morning_clip_calls_plan_once_and_returns_the_desk()
    {
        var speech = new StubSpeechToText("Gym at 7 and read.");
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Gym"},{"title":"Read"}]}""");
        using var factory = CreateFactory(speech, model);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = AudioForm("MORNING_PLAN", [1, 2, 3, 4]);
        var response = await client.PostAsync("/voice/clips", form);
        var desk = await response.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(desk);
        Assert.Equal(1, desk.StreakDays);
        Assert.Equal(2, desk.Today!.Commitments.Count);
        Assert.Equal("Gym", desk.Today.Commitments[0].Title);
        Assert.Equal("Read", desk.Today.Commitments[1].Title);
        Assert.Equal(1, speech.Calls);
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
            "/voice/clips",
            AudioForm("MORNING_PLAN", new byte[ClipService.MaxBytes + 1]));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task Empty_transcript_is_unprocessable()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("  "),
            new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsync("/voice/clips", AudioForm("MORNING_PLAN", [1, 2]));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Garbage_extract_is_bad_gateway()
    {
        using var factory = CreateFactory(
            new StubSpeechToText("hello"),
            new StubLanguageModel("not-json"));
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsync("/voice/clips", AudioForm("MORNING_PLAN", [1, 2]));

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task Model_down_is_unavailable()
    {
        using var factory = CreateFactory(new StubSpeechToText("hello"), new DownLanguageModel());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.PostAsync("/voice/clips", AudioForm("MORNING_PLAN", [1, 2]));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    private static MultipartFormDataContent AudioForm(string kind, byte[] bytes)
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(kind), "kind");
        form.Add(new StringContent("UTC"), "timezone");
        form.Add(
            new ByteArrayContent(bytes) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } },
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

    private sealed record DeskBody(int StreakDays, DayBody? Today);
    private sealed record DayBody(IReadOnlyList<CommitmentBody> Commitments);
    private sealed record CommitmentBody(Guid Id, string Title, string Status);
}
