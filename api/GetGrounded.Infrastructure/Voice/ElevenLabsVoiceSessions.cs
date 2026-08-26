using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using GetGrounded.Application.Voice;
using Microsoft.Extensions.Configuration;

namespace GetGrounded.Infrastructure.Voice;

public sealed class ElevenLabsVoiceSessions(IHttpClientFactory http, IConfiguration config) : IVoiceSessionIssuer
{
    public async Task<VoiceIssue> IssueAsync(string userId, CancellationToken cancellationToken = default)
    {
        var key = config["ELEVENLABS_API_KEY"];
        var agentId = config["ELEVENLABS_AGENT_ID"];
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(agentId))
        {
            return VoiceIssue.NotConfigured;
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://api.elevenlabs.io/v1/convai/conversation/token?agent_id={Uri.EscapeDataString(agentId)}");
        request.Headers.TryAddWithoutValidation("xi-api-key", key);

        var response = await http.CreateClient("elevenlabs").SendAsync(request, cancellationToken);
        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            return VoiceIssue.Busy;
        }

        if (!response.IsSuccessStatusCode)
        {
            return VoiceIssue.Failed;
        }

        var body = await response.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken);
        return string.IsNullOrWhiteSpace(body?.Token)
            ? VoiceIssue.Failed
            : VoiceIssue.Ready(new VoiceSession(body.Token, agentId));
    }

    private sealed record TokenResponse([property: JsonPropertyName("token")] string? Token);
}
