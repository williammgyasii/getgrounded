using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

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
    public async Task Me_with_valid_identity_returns_our_guid()
    {
        var users = new StubAuthUserAccessor();
        using var factory = CreateFactory(new StubAuthTokenAccessor(), users);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/me");
        var body = await response.Content.ReadFromJsonAsync<MeResponse>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(StubAuthUserAccessor.UserId, body.UserId);
        Assert.Equal(["firebase-uid-1"], users.LoginIds);
    }

    [Fact]
    public async Task Me_with_a_tombstone_is_unauthorized()
    {
        using var factory = CreateFactory(new StubAuthTokenAccessor(), new TombstoneAuthUserAccessor());
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static WebApplicationFactory<Program> CreateFactory(
        Application.Identity.IAuthTokenAccessor? tokens = null,
        Application.Identity.IAuthUserAccessor? users = null) =>
        TestFactory.Create(tokens, users);

    private sealed record MeResponse(Guid UserId);
}
