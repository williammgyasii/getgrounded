using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Voice;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class VoiceTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Session_without_token_is_unauthorized()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Session_with_invalid_token_is_unauthorized()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-firebase-token");

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Session_without_elevenlabs_config_is_unavailable()
    {
        using var factory = CreateFactory(new StubVerifier(), new MissingVoiceSessions());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Session_when_workspace_is_busy_is_too_many_requests()
    {
        using var factory = CreateFactory(new StubVerifier(), new BusyVoiceSessions());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Fact]
    public async Task Session_with_identity_returns_conversation_ticket()
    {
        using var factory = CreateFactory(new StubVerifier(), new StubVoiceSessions());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/voice/session");
        var body = await response.Content.ReadFromJsonAsync<SessionResponse>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("conv-token-1", body.ConversationToken);
        Assert.Equal("agent-1", body.AgentId);
    }

    private static WebApplicationFactory<Program> CreateFactory(
        ITokenVerifier? verifier = null,
        IVoiceSessionIssuer? voice = null)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                if (verifier is not null)
                {
                    services.AddSingleton(verifier);
                }

                services.AddSingleton(voice ?? new MissingVoiceSessions());
                services.AddSingleton<IUserStore, LivingUserStore>();
            });
        });
    }

    private sealed class MissingVoiceSessions : IVoiceSessionIssuer
    {
        public Task<VoiceIssue> IssueAsync(string userId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(VoiceIssue.NotConfigured);
        }
    }

    private sealed class BusyVoiceSessions : IVoiceSessionIssuer
    {
        public Task<VoiceIssue> IssueAsync(string userId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(VoiceIssue.Busy);
        }
    }

    private sealed class StubVoiceSessions : IVoiceSessionIssuer
    {
        public Task<VoiceIssue> IssueAsync(string userId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(VoiceIssue.Ready(new VoiceSession("conv-token-1", "agent-1")));
        }
    }

    private sealed record SessionResponse(string ConversationToken, string AgentId);
}
