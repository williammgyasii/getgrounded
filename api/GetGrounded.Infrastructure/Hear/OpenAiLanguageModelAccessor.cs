using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GetGrounded.Application.Hear;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Infrastructure.Hear;

public sealed class OpenAiLanguageModelAccessor(
    IHttpClientFactory http,
    IConfiguration config,
    ILogger<OpenAiLanguageModelAccessor>? log = null) : ILanguageModelAccessor
{
    private const string ChatUrl = "https://api.openai.com/v1/chat/completions";
    private readonly ILogger _log = log ?? NullLogger<OpenAiLanguageModelAccessor>.Instance;

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
    {
        var key = config["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(key))
        {
            _log.LogWarning("openai missing key");
            throw new ModelUnavailableException();
        }

        var model = config["OPENAI_MODEL"];
        if (string.IsNullOrWhiteSpace(model))
        {
            model = "gpt-4o-mini";
        }

        var payload = new
        {
            model,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = system },
                new { role = "user", content = user }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, ChatUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        _log.LogInformation("openai started model={Model} userChars={Chars}", model, user.Length);

        HttpResponseMessage response;
        try
        {
            response = await http.CreateClient("openai").SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "openai transport failed");
            throw new ModelUnavailableException();
        }

        if (!response.IsSuccessStatusCode)
        {
            _log.LogWarning("openai http {Status}", (int)response.StatusCode);
            throw new ModelUnavailableException();
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var parsed = JsonSerializer.Deserialize<ChatResponse>(body, Json);
        var content = parsed?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InterpretException("Empty extract.");
        }

        _log.LogInformation("openai ok chars={Chars}", content.Length);
        return content;
    }

    private sealed record ChatResponse(IReadOnlyList<ChatChoice>? Choices);

    private sealed record ChatChoice(ChatMessage? Message);

    private sealed record ChatMessage(string? Content);
}
