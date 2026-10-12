using GetGrounded.Domain.Book;

namespace GetGrounded.Tests;

public class StreakTests
{
    [Fact]
    public void Count_is_zero_when_nobody_showed_up()
    {
        Assert.Equal(0, Streak.Count([], new DateOnly(2026, 8, 26)));
    }

    [Fact]
    public void Count_is_zero_when_the_last_day_is_older_than_yesterday()
    {
        Assert.Equal(0, Streak.Count([new DateOnly(2026, 8, 23)], new DateOnly(2026, 8, 26)));
    }

    [Fact]
    public void Count_walks_consecutive_days_ending_today()
    {
        var showedUp = new[]
        {
            new DateOnly(2026, 8, 26),
            new DateOnly(2026, 8, 25),
            new DateOnly(2026, 8, 24)
        };

        Assert.Equal(3, Streak.Count(showedUp, new DateOnly(2026, 8, 26)));
    }

    [Fact]
    public void Count_can_start_from_yesterday()
    {
        Assert.Equal(1, Streak.Count([new DateOnly(2026, 8, 25)], new DateOnly(2026, 8, 26)));
    }

    [Fact]
    public void Count_stops_at_the_first_gap()
    {
        var showedUp = new[]
        {
            new DateOnly(2026, 8, 26),
            new DateOnly(2026, 8, 24)
        };

        Assert.Equal(1, Streak.Count(showedUp, new DateOnly(2026, 8, 26)));
    }
}
