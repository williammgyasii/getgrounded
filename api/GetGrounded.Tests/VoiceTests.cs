using System.Net;
using GetGrounded.Application.Auth;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class VoiceTests
{
    [Fact]
    public async Task Session_route_is_gone()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ITokenVerifier, StubVerifier>();
                services.AddSingleton<IUserStore, LivingUserStore>();
            });
        });
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
