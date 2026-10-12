using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class HearTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Hear_returns_transcript_and_does_not_book()
    {
        var speech = new StubSpeechToTextAccessor("Gym at 7 and read.");
        using var factory = TestFactory.Create(speech: speech);
        using var client = Authed(factory);

        using var form = AudioForm([1, 2, 3, 4]);
        var heard = await client.PostAsync("/voice/hear", form);
        var body = await heard.Content.ReadFromJsonAsync<HearBody>(Json);
        var deskResponse = await client.GetAsync("/days/today?timezone=UTC");
        var desk = await deskResponse.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.OK, heard.StatusCode);
        Assert.Equal("Gym at 7 and read.", body!.Transcript);
        Assert.False(string.IsNullOrWhiteSpace(body.StorageKey));
        Assert.Null(body.Words);
        var store = factory.Services.GetRequiredService<IAudioClipAccessor>();
        var saved = await store.GetAsync(body.StorageKey!, CancellationToken.None);
        Assert.NotNull(saved);
        Assert.Equal(1, speech.Calls);
        Assert.Null(desk!.Today);
        Assert.Equal(0, desk.StreakDays);
    }

    [Fact]
    public async Task Hear_returns_spoken_words()
    {
        var speech = new StubSpeechToTextAccessor(
            "Gym now.",
            [new SpokenWord("Gym", 0.1, 0.4), new SpokenWord("now", 0.5, 0.8)]);
        using var factory = TestFactory.Create(speech: speech);
        using var client = Authed(factory);

        using var form = AudioForm([1, 2, 3, 4]);
        var heard = await client.PostAsync("/voice/hear", form);
        var body = await heard.Content.ReadFromJsonAsync<HearBody>(Json);

        Assert.Equal(HttpStatusCode.OK, heard.StatusCode);
        Assert.Equal(2, body!.Words!.Count);
        Assert.Equal("Gym", body.Words[0].Text);
        Assert.Equal(0.1, body.Words[0].Start);
    }

    [Fact]
    public async Task GetClip_returns_audio_after_morning_save()
    {
        var speech = new StubSpeechToTextAccessor("Morning gym.");
        using var factory = TestFactory.Create(speech: speech);
        using var client = Authed(factory);

        using var form = AudioForm([9, 8, 7, 6, 5, 4]);
        var heard = await client.PostAsync("/voice/hear", form);
        var hearBody = await heard.Content.ReadFromJsonAsync<HearBody>(Json);
        Assert.Equal(HttpStatusCode.OK, heard.StatusCode);

        var saved = await client.PostAsJsonAsync("/days/morning", new
        {
            timezone = "America/New_York",
            transcript = hearBody!.Transcript,
            storageKey = hearBody.StorageKey,
            commitments = new[]
            {
                new { title = "Gym", plannedDurationMinutes = 45, plannedStartMinute = (int?)420, lifeArea = "HEALTH" }
            }
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var day = await saved.Content.ReadFromJsonAsync<DayRecord>(Json);
        var clipId = day!.Clips[0].Id;

        var clip = await client.GetAsync($"/voice/clips/{clipId}");
        var bytes = await clip.Content.ReadAsByteArrayAsync();

        Assert.Equal(HttpStatusCode.OK, clip.StatusCode);
        Assert.True(bytes.Length > 0);
    }

    [Fact]
    public async Task Hear_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create(speech: new StubSpeechToTextAccessor("Hi"));
        using var client = factory.CreateClient();

        using var form = AudioForm([1, 2, 3]);
        var heard = await client.PostAsync("/voice/hear", form);

        Assert.Equal(HttpStatusCode.Unauthorized, heard.StatusCode);
    }

    private static HttpClient Authed(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        return client;
    }

    private static MultipartFormDataContent AudioForm(byte[] bytes)
    {
        var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent(bytes), "audio", "clip.m4a");
        return form;
    }

    private sealed record HearBody(string Transcript, string? StorageKey, IReadOnlyList<SpokenWord>? Words);

    private sealed record DeskBody(DayRecord? Today, int StreakDays);
}
