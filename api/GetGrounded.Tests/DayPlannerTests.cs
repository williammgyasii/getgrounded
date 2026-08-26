using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests;

public class DayPlannerTests
{
    [Fact]
    public void Untimed_lunch_sits_in_the_gap_after_the_spoken_hour()
    {
        var laid = DayPlanner.LayOut(
            [
                new PlannedItem("Gym", 60, 7 * 60, "HEALTH"),
                new PlannedItem("Get lunch"),
                new PlannedItem("Ship the test", 90, 14 * 60, "WORK"),
            ],
            spokenMinute: 8 * 60);

        Assert.Equal("Gym", laid[0].Title);
        Assert.Equal(7 * 60, laid[0].PlannedStartMinute);
        Assert.Equal("Get lunch", laid[1].Title);
        Assert.Equal(8 * 60, laid[1].PlannedStartMinute);
        Assert.Equal(45, laid[1].PlannedDurationMinutes);
        Assert.Equal("HOME", laid[1].LifeArea);
        Assert.Equal(14 * 60, laid[2].PlannedStartMinute);
    }

    [Fact]
    public void Spoken_time_keeps_later_work_from_sliding_into_the_morning()
    {
        var laid = DayPlanner.LayOut(
            [new PlannedItem("Read"), new PlannedItem("Walk the dog")],
            spokenMinute: 16 * 60 + 10);

        Assert.Equal(16 * 60 + 10, laid[0].PlannedStartMinute);
        Assert.Equal(16 * 60 + 40, laid[1].PlannedStartMinute);
        Assert.All(laid, item => Assert.NotNull(item.PlannedDurationMinutes));
    }
}
