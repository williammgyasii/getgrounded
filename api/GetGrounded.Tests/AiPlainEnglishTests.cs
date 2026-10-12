using GetGrounded.Application.Hear;

namespace GetGrounded.Tests;

public class AiPlainEnglishTests
{
    [Fact]
    public void Clean_replaces_em_dash_with_period()
    {
        var text = AiPlainEnglish.Clean("Gym first — then calls.");
        Assert.Equal("Gym first. then calls.", text);
    }

    [Fact]
    public void Clean_replaces_spaced_hyphens()
    {
        var text = AiPlainEnglish.Clean("Read - write - ship");
        Assert.Equal("Read, write, ship", text);
    }
}
