using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GetGrounded.Application.Hear;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Infrastructure.Hear;

public sealed class ElevenLabsSpeechSynthesisAccessor(
    IHttpClientFactory http,
    IConfiguration config,
    ILogger<ElevenLabsSpeechSynthesisAccessor>? log = null) : ISpeechSynthesisAccessor
{
    private const string DefaultVoiceId = "EXAVITQu4vr4xnSDxMaL";
    private readonly ILogger _log = log ?? NullLogger<ElevenLabsSpeechSynthesisAccessor>.Instance;

    public async Task<MuseSpeechClip> SynthesizeAsync(string text, CancellationToken cancellationToken = default)
    {
        var key = config["ELEVENLABS_API_KEY"];
        if (string.IsNullOrWhiteSpace(key))
        {
            _log.LogWarning("muse voice missing key");
            throw new SpeechUnavailableException();
        }

        var voiceId = config["ELEVENLABS_VOICE_ID"]?.Trim();
        if (string.IsNullOrWhiteSpace(voiceId))
        {
            voiceId = DefaultVoiceId;
        }

        var url =
            $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("xi-api-key", key);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("audio/mpeg"));
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { text, model_id = "eleven_turbo_v2_5" }),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("elevenlabs").SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "muse voice transport failed");
            throw new SpeechUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            _log.LogWarning("muse voice http {Status}", (int)response.StatusCode);
            throw new SpeechUnavailableException();
        }

        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        if (bytes.Length == 0)
        {
            throw new SpeechUnavailableException();
        }

        return new MuseSpeechClip(bytes, "audio/mpeg");
    }
}
