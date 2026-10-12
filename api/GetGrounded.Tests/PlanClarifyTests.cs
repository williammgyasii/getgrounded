using GetGrounded.Application.Hear;
using GetGrounded.Infrastructure.Hear;

namespace GetGrounded.Tests;

public class PlanClarifyTests
{
    [Fact]
    public async Task Heuristic_asks_when_gym_has_no_time()
    {
        var accessor = new HeuristicPlanClarifyAccessor();
        var result = await accessor.ClarifyMorningAsync(
            "I'm going to the gym, read my book, and call some friends.",
            "America/New_York",
            []);

        Assert.Contains(result.Questions, item => item.Id == "gym-time");
    }

    [Fact]
    public async Task Heuristic_skips_gym_when_time_named()
    {
        var accessor = new HeuristicPlanClarifyAccessor();
        var result = await accessor.ClarifyMorningAsync(
            "Gym at 7am, then interview at dawn.",
            "America/New_York",
            []);

        Assert.DoesNotContain(result.Questions, item => item.Id == "gym-time");
    }

    [Fact]
    public async Task Heuristic_second_turn_skips_answered_gym()
    {
        var accessor = new HeuristicPlanClarifyAccessor();
        var prior = new[]
        {
            new ClarifyExchange("gym-time", "What time do you want to hit the gym?", "7am")
        };
        var result = await accessor.ClarifyMorningAsync(
            "Gym and read my book.",
            "America/New_York",
            prior);

        Assert.DoesNotContain(result.Questions, item => item.Id == "gym-time");
        Assert.Empty(result.Questions);
        Assert.True(result.MuseLine.Contains("build", StringComparison.OrdinalIgnoreCase));
    }
}
