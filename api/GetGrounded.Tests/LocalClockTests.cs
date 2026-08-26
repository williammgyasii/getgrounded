using GetGrounded.Application.Time;

namespace GetGrounded.Tests;

public class LocalClockTests
{
    [Fact]
    public void Evening_in_new_york_keeps_a_real_clock()
    {
        var at = LocalClock.At("America/New_York", new DateOnly(2026, 8, 26), 18 * 60 + 21);

        Assert.Equal(TimeSpan.Zero, at.Offset);
        Assert.Equal(18 * 60 + 21, LocalClock.MinuteOfDay("America/New_York", at));
    }
}
