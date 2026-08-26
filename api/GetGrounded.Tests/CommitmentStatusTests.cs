using GetGrounded.Domain;

namespace GetGrounded.Tests;

public class CommitmentStatusTests
{
    [Fact]
    public void Commitment_supports_the_full_life_status_set()
    {
        var statuses = Enum.GetNames<CommitmentStatus>();

        Assert.Contains("Planned", statuses);
        Assert.Contains("Completed", statuses);
        Assert.Contains("Partial", statuses);
        Assert.Contains("Missed", statuses);
        Assert.Contains("Rescheduled", statuses);
        Assert.Contains("Cancelled", statuses);
        Assert.Contains("Blocked", statuses);
        Assert.Contains("Unplanned", statuses);
        Assert.Equal(8, statuses.Length);
    }
}
