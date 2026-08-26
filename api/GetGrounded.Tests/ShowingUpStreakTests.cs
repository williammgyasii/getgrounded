using GetGrounded.Domain;

namespace GetGrounded.Tests;

public class ShowingUpStreakTests
{
    [Fact]
    public void Completing_a_reflection_increments_showing_up_streak_even_when_everything_was_missed()
    {
        var day = DailyCheckIn.Plan("Work", "Read");
        day.Reflect(allMissed: true);

        Assert.Equal(1, day.ShowingUpStreak);
        Assert.All(day.Commitments, c => Assert.Equal(CommitmentStatus.Missed, c.Status));
    }
}
