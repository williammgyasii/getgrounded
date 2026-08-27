using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests;

public class FollowThroughTests
{
    private static readonly DateOnly Today = new(2026, 8, 26);

    [Fact]
    public void Empty_window_is_null_not_zero()
    {
        var review = FollowThrough.From(Today, "UTC", []);

        Assert.Equal(new DateOnly(2026, 8, 20), review.From);
        Assert.Equal(Today, review.To);
        Assert.Equal(0, review.ClosedNights);
        Assert.Equal(0, review.Planned);
        Assert.Null(review.FollowThrough);
        Assert.Empty(review.Nights);
    }

    [Fact]
    public void Open_morning_does_not_count()
    {
        var open = Day(
            Today,
            [Task("Gym", "PLANNED")],
            evening: false);

        var review = FollowThrough.From(Today, "UTC", [open]);

        Assert.Equal(0, review.ClosedNights);
        Assert.Null(review.FollowThrough);
    }

    [Fact]
    public void Closed_night_scores_done_partial_and_missed()
    {
        var night = Day(
            Today,
            [Task("Gym", "COMPLETED"), Task("Read", "PARTIAL"), Task("Ship", "MISSED")],
            extras: 1);

        var review = FollowThrough.From(Today, "UTC", [night]);

        Assert.Equal(1, review.ClosedNights);
        Assert.Equal(3, review.Planned);
        Assert.Equal(1, review.Done);
        Assert.Equal(1, review.Partial);
        Assert.Equal(1, review.Missed);
        Assert.Equal(1, review.Extras);
        Assert.Equal(1.5m, review.Earned);
        Assert.Equal(50, review.FollowThrough);
    }

    [Fact]
    public void Cancelled_and_rescheduled_leave_the_pile()
    {
        var night = Day(
            Today,
            [
                Task("Gym", "COMPLETED"),
                Task("Call", "CANCELLED"),
                Task("Read", "RESCHEDULED")
            ]);

        var review = FollowThrough.From(Today, "UTC", [night]);

        Assert.Equal(1, review.Planned);
        Assert.Equal(1, review.Done);
        Assert.Equal(100, review.FollowThrough);
    }

    [Fact]
    public void Night_outside_the_window_is_ignored()
    {
        var old = Day(
            new DateOnly(2026, 8, 19),
            [Task("Gym", "COMPLETED")]);

        var review = FollowThrough.From(Today, "UTC", [old]);

        Assert.Equal(0, review.ClosedNights);
        Assert.Null(review.FollowThrough);
    }

    private static DayRecord Day(
        DateOnly date,
        IReadOnlyList<CommitmentRecord> tasks,
        bool evening = true,
        int extras = 0)
    {
        var wins = Enumerable.Range(0, extras)
            .Select(_ => new WinRecord(Guid.CreateVersion7(), "Extra"))
            .ToList();
        var clips = new List<ClipRecord>
        {
            new(Guid.CreateVersion7(), "MORNING_PLAN", "plan", DateTimeOffset.UtcNow)
        };
        if (evening)
        {
            clips.Add(new ClipRecord(Guid.CreateVersion7(), "EVENING_REFLECTION", "night", DateTimeOffset.UtcNow));
        }

        return new DayRecord(Guid.CreateVersion7(), date, "UTC", true, "Gym day", tasks, wins, clips);
    }

    private static CommitmentRecord Task(string title, string status) =>
        new(Guid.CreateVersion7(), title, status, null, null);
}
