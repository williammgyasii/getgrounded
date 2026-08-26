using System.Net.Http.Headers;
using System.Text.Json;
using GetGrounded.Application.Voice;

namespace GetGrounded.Infrastructure.Voice;

public sealed class VertexSpeechToText(IHttpClientFactory http) : ISpeechToText
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://speech.googleapis.com/v1/speech:recognize");
        try
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                await GoogleAccess.BearerAsync(cancellationToken));
        }
        catch (Exception)
        {
            throw new SpeechUnavailableException();
        }

        request.Content = JsonContent.From(new
        {
            config = new
            {
                languageCode = "en-US",
                enableAutomaticPunctuation = true
            },
            audio = new { content = Convert.ToBase64String(clip.Bytes) }
        });

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("google").SendAsync(request, cancellationToken);
        }
        catch (Exception)
        {
            throw new SpeechUnavailableException();
        }

        if ((int)response.StatusCode >= 500)
        {
            throw new SpeechUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new SpeechUnavailableException();
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonSerializer.Deserialize<RecognizeResponse>(body, Json);
        var alt = parsed?.Results?.FirstOrDefault()?.Alternatives?.FirstOrDefault();
        return new HearResult(alt?.Transcript ?? "", alt?.Confidence);
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
