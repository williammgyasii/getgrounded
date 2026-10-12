using GetGrounded.Application.Hear;

namespace GetGrounded.Tests;

public class PlanClarifyEngineTests
{
    [Fact]
    public void DropRedundantQuestions_skips_duration_when_hour_given()
    {
        var prior = new[]
        {
            new ClarifyExchange("cook-time", "How long will you cook?", "Maybe an hour")
        };
        var questions = new List<ClarifyQuestion>
        {
            new("cook-duration", "How long do you expect to spend cooking?", "cooking")
        };

        var kept = PlanClarifyEngine.DropRedundantQuestions("Cook at 9 pm.", prior, questions);

        Assert.Empty(kept);
    }

    [Fact]
    public void DropRedundantQuestions_skips_time_when_clock_given()
    {
        var questions = new List<ClarifyQuestion>
        {
            new("cook-time", "What time will you cook?", "cooking")
        };

        var kept = PlanClarifyEngine.DropRedundantQuestions("I will cook at 9 pm tonight.", [], questions);

        Assert.Empty(kept);
    }

    [Fact]
    public void FilterQuestions_skips_repeated_read_duration_after_hour_answer()
    {
        var prior = new[]
        {
            new ClarifyExchange(
                "clarify-turn-1",
                "About how long do you want to read?",
                "About an hour")
        };
        var transcript = "Read my book today.\n\nClarifications:\nAbout how long do you want to read?: About an hour";
        var questions = new List<ClarifyQuestion>
        {
            new("read-duration", "How long do you expect to finish reading the book?", "reading")
        };

        var kept = PlanClarifyEngine.FilterQuestions(transcript, prior, questions);

        Assert.Empty(kept);
    }

    [Fact]
    public void DropAfterUnknownAnswers_skips_reading_after_i_dont_know()
    {
        var prior = new[]
        {
            new ClarifyExchange(
                "clarify-turn-1",
                "What time do you plan to finish reading the book?",
                "I don't know")
        };
        var questions = new List<ClarifyQuestion>
        {
            new("read-finish", "When do you expect to finish reading?", "reading")
        };

        var kept = PlanClarifyEngine.DropAfterUnknownAnswers(prior, questions);

        Assert.Empty(kept);
    }
}
