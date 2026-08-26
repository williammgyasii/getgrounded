using System.Net;
using System.Text;
using GetGrounded.Application.Voice;
using GetGrounded.Infrastructure.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;

namespace GetGrounded.Tests;

public class ScribeTests
{
    [Fact]
    public async Task Hear_reads_scribe_text()
    {
        var handler = new ScriptedHandler
        {
            Next = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"text":"Gym at 7 and read."}""", Encoding.UTF8, "application/json")
            }
        };
        var speech = Create(handler, "test-key");

        var heard = await speech.HearAsync(Clip(), CancellationToken.None);

        Assert.Equal("Gym at 7 and read.", heard.Transcript);
        Assert.Equal("https://api.elevenlabs.io/v1/speech-to-text", handler.Last?.RequestUri?.ToString());
        Assert.Equal("test-key", handler.Last?.Headers.GetValues("xi-api-key").Single());
        Assert.Contains("scribe_v2", handler.Body);
        Assert.DoesNotContain("latest_short", handler.Body);
    }

    [Fact]
    public async Task Hear_empty_text_stays_empty()
    {
        var handler = new ScriptedHandler
        {
            Next = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"text":"  "}""", Encoding.UTF8, "application/json")
            }
        };

        var heard = await Create(handler, "test-key").HearAsync(Clip(), CancellationToken.None);

        Assert.Equal("", heard.Transcript);
    }

    [Fact]
    public async Task Hear_http_error_is_unavailable()
    {
        var handler = new ScriptedHandler
        {
            Next = new HttpResponseMessage(HttpStatusCode.Unauthorized)
        };

        await Assert.ThrowsAsync<SpeechUnavailableException>(() =>
            Create(handler, "test-key").HearAsync(Clip(), CancellationToken.None));
    }

    [Fact]
    public async Task Hear_missing_key_is_unavailable()
    {
        var speech = Create(
            new ScriptedHandler { Next = new HttpResponseMessage(HttpStatusCode.OK) },
            null);

        await Assert.ThrowsAsync<SpeechUnavailableException>(() =>
            speech.HearAsync(Clip(), CancellationToken.None));
    }

    private static ElevenLabsSpeechToText Create(ScriptedHandler handler, string? key)
    {
        return new ElevenLabsSpeechToText(new FixedFactory(new HttpClient(handler)), new KeyConfig(key));
    }

    private static HearClip Clip() => new([1, 2, 3, 4], "audio/mpeg");

    private sealed class ScriptedHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Last { get; private set; }
        public string Body { get; private set; } = "";
        public required HttpResponseMessage Next { get; set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Last = request;
            if (request.Content is not null)
            {
                Body = await request.Content.ReadAsStringAsync(cancellationToken);
            }

            return Next;
        }
    }

    private sealed class FixedFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class KeyConfig(string? key) : IConfiguration
    {
        public string? this[string name]
        {
            get => name == "ELEVENLABS_API_KEY" ? key : null;
            set { }
        }

        public IEnumerable<IConfigurationSection> GetChildren() => [];

        public IChangeToken GetReloadToken() => new QuietToken();

        public IConfigurationSection GetSection(string name) => new EmptySection(name);
    }

    private sealed class QuietToken : IChangeToken
    {
        public bool HasChanged => false;
        public bool ActiveChangeCallbacks => false;
        public IDisposable RegisterChangeCallback(Action<object?> callback, object? state) => new Silent();
    }

    private sealed class Silent : IDisposable
    {
        public void Dispose() { }
    }

    private sealed class EmptySection(string key) : IConfigurationSection
    {
        public string? this[string name]
        {
            get => null;
            set { }
        }

        public string Key { get; } = key;
        public string Path { get; } = key;
        public string? Value { get; set; }

        public IEnumerable<IConfigurationSection> GetChildren() => [];

        public IChangeToken GetReloadToken() => new QuietToken();

        public IConfigurationSection GetSection(string name) => new EmptySection(name);
    }
}
