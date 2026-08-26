using System.Net.Http.Headers;
using System.Text.Json;
using GetGrounded.Application.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Infrastructure.Voice;

public sealed class ElevenLabsSpeechToText(
    IHttpClientFactory http,
    IConfiguration config,
    ILogger<ElevenLabsSpeechToText>? log = null) : ISpeechToText
{
    private const string RecognizeUrl = "https://api.elevenlabs.io/v1/speech-to-text";
    private readonly ILogger _log = log ?? NullLogger<ElevenLabsSpeechToText>.Instance;

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken)
    {
        var key = config["ELEVENLABS_API_KEY"];
        if (string.IsNullOrWhiteSpace(key))
        {
            _log.LogWarning("scribe missing key");
            throw new SpeechUnavailableException();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, RecognizeUrl);
        request.Headers.TryAddWithoutValidation("xi-api-key", key);
        request.Content = BuildForm(clip);

        _log.LogInformation("scribe started bytes={Bytes} type={Type}", clip.Bytes.Length, clip.ContentType);

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("elevenlabs").SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "scribe transport failed");
            throw new SpeechUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            _log.LogWarning("scribe http {Status}", (int)response.StatusCode);
            throw new SpeechUnavailableException();
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonSerializer.Deserialize<ScribeResponse>(body, Json);
        var text = parsed?.Text?.Trim() ?? "";
        _log.LogInformation("scribe ok chars={Chars}", text.Length);
        return new HearResult(text, null);
    }

    private static MultipartFormDataContent BuildForm(HearClip clip)
    {
        var type = MediaType(clip.ContentType);
        var audio = new ByteArrayContent(clip.Bytes);
        audio.Headers.ContentType = new MediaTypeHeaderValue(type);

        var form = new MultipartFormDataContent();
        form.Add(new StringContent("scribe_v2"), "model_id");
        form.Add(new StringContent("eng"), "language_code");
        form.Add(new StringContent("false"), "tag_audio_events");
        form.Add(audio, "file", FileName(type));
        return form;
    }

    private static string MediaType(string contentType)
    {
        var type = contentType.Split(';', 2)[0].Trim().ToLowerInvariant();
        return type is "" or "application/octet-stream" or "audio/mpeg"
            ? "audio/mp4"
            : type;
    }

    private static string FileName(string mediaType)
    {
        return mediaType is "audio/wav" or "audio/x-wav"
            ? "clip.wav"
            : "clip.m4a";
    }

    private sealed record ScribeResponse(string? Text);
}
