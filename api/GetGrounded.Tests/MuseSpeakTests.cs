using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GetGrounded.Tests;

public class MuseSpeakTests
{
    [Fact]
    public async Task Speak_without_token_is_unauthorized()
    {
        using var factory = TestFactory.Create();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/voice/speak", new { text = "Hello" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
