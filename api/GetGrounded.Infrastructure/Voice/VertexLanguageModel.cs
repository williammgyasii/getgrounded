using System.Net.Http.Headers;
using System.Text.Json;
using GetGrounded.Application.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Infrastructure.Voice;

public sealed class VertexLanguageModel(
    IHttpClientFactory http,
    IConfiguration config,
    ILogger<VertexLanguageModel>? log = null) : ILanguageModel
{
    private readonly ILogger _log = log ?? NullLogger<VertexLanguageModel>.Instance;

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
    {
        var project = config["GOOGLE_CLOUD_PROJECT"] ?? "get-ground-448ca";
        var location = config["GOOGLE_CLOUD_LOCATION"] ?? "us-central1";
        var model = config["VERTEX_MODEL"] ?? "gemini-2.5-flash";
        var url =
            $"https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        try
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                await GoogleAccess.BearerAsync(cancellationToken));
        }
        catch (Exception)
        {
            throw new ModelUnavailableException();
        }

        request.Content = JsonContent.From(new
        {
            systemInstruction = new { parts = new[] { new { text = system } } },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = user } } }
            },
            generationConfig = new { responseMimeType = "application/json", temperature = 0.2 }
        });

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("google").SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "model transport failed");
            throw new ModelUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            _log.LogWarning("model http {Status}", (int)response.StatusCode);
            throw new ModelUnavailableException();
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonSerializer.Deserialize<GenerateResponse>(body, Json);
        var parts = parsed?.Candidates?.FirstOrDefault()?.Content?.Parts ?? [];
        var text = parts
            .Where(part => part.Thought != true && !string.IsNullOrWhiteSpace(part.Text))
            .Select(part => part.Text)
            .LastOrDefault();
        if (string.IsNullOrWhiteSpace(text))
        {
            _log.LogWarning("model empty parts={Parts}", parts.Count);
            throw new InterpretException("Empty model.");
        }

        return text;
    }

    private sealed record GenerateResponse(IReadOnlyList<Candidate>? Candidates);
    private sealed record Candidate(ContentBody? Content);
    private sealed record ContentBody(IReadOnlyList<PartBody>? Parts);
    private sealed record PartBody(string? Text, bool? Thought);
}
