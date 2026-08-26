using System.Net.Http.Headers;
using System.Text.Json;
using GetGrounded.Application.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Infrastructure.Voice;

public sealed class VertexSpeechToText(
    IHttpClientFactory http,
    IConfiguration config,
    ILogger<VertexSpeechToText>? log = null) : ISpeechToText
{
    private readonly ILogger _log = log ?? NullLogger<VertexSpeechToText>.Instance;

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken)
    {
        var project = config["GOOGLE_CLOUD_PROJECT"] ?? "get-ground-448ca";
        var location = config["GOOGLE_CLOUD_LOCATION"] ?? "us-central1";
        var url =
            $"https://{location}-speech.googleapis.com/v2/projects/{project}/locations/{location}/recognizers/_:recognize";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        try
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                await GoogleAccess.BearerAsync(cancellationToken));
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "speech auth failed");
            throw new SpeechUnavailableException();
        }

        request.Content = JsonContent.From(new
        {
            config = new
            {
                autoDecodingConfig = new { },
                languageCodes = new[] { "en-US" },
                model = "latest_short",
                features = new { enableAutomaticPunctuation = true }
            },
            content = Convert.ToBase64String(clip.Bytes)
        });

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("google").SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "speech transport failed");
            throw new SpeechUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(cancellationToken);
            if (detail.Length > 240)
            {
                detail = detail[..240];
            }

            _log.LogWarning("speech http {Status} {Detail}", (int)response.StatusCode, detail);
            throw new SpeechUnavailableException();
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonSerializer.Deserialize<RecognizeResponse>(body, Json);
        var text = string.Join(
            " ",
            parsed?.Results?
                .SelectMany(result => result.Alternatives ?? [])
                .Select(alt => alt.Transcript)
                .Where(part => !string.IsNullOrWhiteSpace(part)) ?? []);
        var confidence = parsed?.Results?.FirstOrDefault()?.Alternatives?.FirstOrDefault()?.Confidence;
        return new HearResult(text.Trim(), confidence);
    }

    private sealed record RecognizeResponse(IReadOnlyList<RecognizeResult>? Results);
    private sealed record RecognizeResult(IReadOnlyList<RecognizeAlt>? Alternatives);
    private sealed record RecognizeAlt(string? Transcript, float? Confidence);
}

internal static class JsonContent
{
    public static StringContent From(object value)
    {
        return new StringContent(
            JsonSerializer.Serialize(value),
            System.Text.Encoding.UTF8,
            "application/json");
    }
}
