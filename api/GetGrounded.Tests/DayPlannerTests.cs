using GetGrounded.Application.Book;
using GetGrounded.Application.Hear;

namespace GetGrounded.Tests;

public class DayPlannerTests
{
    [Fact]
    public void LayOut_mixed_timed_and_untimed_keeps_untimed_unscheduled()
    {
        var items = new[]
        {
            new PlannedItem("Team standup", 30, 540, "WORK"),
            new PlannedItem("Grocery run", 30, null, "HOME"),
            new PlannedItem("Read", 30, null, "LEARNING"),
        };

        var laid = DayPlanner.LayOut(items, 0);

        Assert.Equal(540, laid[0].PlannedStartMinute);
        Assert.Null(laid[1].PlannedStartMinute);
        Assert.Null(laid[2].PlannedStartMinute);
    }

    [Fact]
    public void LayOut_all_untimed_still_packs_from_spoken_minute()
    {
        var items = new[]
        {
            new PlannedItem("Email", 30, null, "WORK"),
            new PlannedItem("Walk", 30, null, "HEALTH"),
        };

        var laid = DayPlanner.LayOut(items, 480);

        Assert.Equal(480, laid[0].PlannedStartMinute);
        Assert.Equal(510, laid[1].PlannedStartMinute);
    }
}
