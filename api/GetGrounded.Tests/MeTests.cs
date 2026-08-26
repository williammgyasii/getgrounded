using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Auth;
using GetGrounded.Domain;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class MeTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Me_without_token_is_unauthorized()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_with_invalid_token_is_unauthorized()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-firebase-token");

        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_with_valid_identity_returns_firebase_user_id()
    {
        var users = new RecordingUserStore();
        using var factory = CreateFactory(new StubVerifier(), users);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/me");
        var body = await response.Content.ReadFromJsonAsync<MeResponse>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("firebase-uid-1", body.UserId);
        Assert.Equal(["firebase-uid-1"], users.Ensured);
    }

    private static WebApplicationFactory<Program> CreateFactory(ITokenVerifier? verifier = null, IUserStore? users = null)
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

                services.AddSingleton(users ?? new RecordingUserStore());
            });
        });
    }

    private sealed class StubVerifier : ITokenVerifier
    {
        public Task<string?> VerifyUserIdAsync(string token, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<string?>(token == "valid-test-token" ? "firebase-uid-1" : null);
        }
    }

    private sealed class RecordingUserStore : IUserStore
    {
        public List<string> Ensured { get; } = [];

        public Task EnsureAsync(User user, CancellationToken cancellationToken = default)
        {
            Ensured.Add(user.Id);
            return Task.CompletedTask;
        }
    }

    private sealed record MeResponse(string UserId);
}
