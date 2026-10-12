using System.Net;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class HealthTests
{
    [Fact]
    public async Task Health_is_public_and_ok()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ok", body, StringComparison.OrdinalIgnoreCase);
    }
}
