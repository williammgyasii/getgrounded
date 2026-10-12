using GetGrounded.Application.Hear;

namespace GetGrounded.Tests;

public class PlanSuggestEngineTests
{
    [Fact]
    public void BuildBlocks_infers_wake_when_user_says_wake_early()
    {
        var blocks = PlanSuggestEngine.BuildBlocks(
            "Today I'm gonna hit the gym, do some cooking, and wake up early.",
            PlanScheduleVariant.Default);

        Assert.Contains(blocks, row => row.Title.Contains("Wake", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(blocks, row => row.Title.Contains("gym", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(blocks, row => row.Title.Contains("Cook", StringComparison.OrdinalIgnoreCase));
        Assert.Equal("inferred", blocks.First(row => row.Title.Contains("Wake", StringComparison.OrdinalIgnoreCase)).Source);
    }

    [Fact]
    public void BuildBlocks_alternate_shifts_times_not_titles()
    {
        var transcript = "Gym and cooking today.";
        var primary = PlanSuggestEngine.BuildBlocks(transcript, PlanScheduleVariant.Default);
        var alternate = PlanSuggestEngine.BuildBlocks(transcript, PlanScheduleVariant.Alternate);

        Assert.Equal(primary.Count, alternate.Count);
        Assert.Equal(
            primary.Select(row => row.Title.Trim().ToLowerInvariant()).OrderBy(item => item),
            alternate.Select(row => row.Title.Trim().ToLowerInvariant()).OrderBy(item => item));

        var primaryStarts = primary.Where(row => row.PlannedStartMinute != null).Select(row => row.PlannedStartMinute!.Value).ToList();
        var alternateStarts = alternate.Where(row => row.PlannedStartMinute != null).Select(row => row.PlannedStartMinute!.Value).ToList();
        Assert.NotEmpty(primaryStarts);
        Assert.NotEmpty(alternateStarts);
        Assert.NotEqual(primaryStarts, alternateStarts);
    }
}
