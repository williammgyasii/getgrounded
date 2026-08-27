using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests;

public class DayInterpreterTests
{
    [Fact]
    public async Task Morning_json_becomes_planned_items()
    {
        var model = new StubLanguageModel(
            """{"title":"Reading morning","commitments":[{"title":"Read","plannedDurationMinutes":20,"confidence":0.9}]}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadMorningAsync("I will read 20 minutes");

        Assert.Equal("Reading morning", draft.Title);
        Assert.Single(draft.Commitments);
        Assert.Equal("Read", draft.Commitments[0].Title);
        Assert.Equal(20, draft.Commitments[0].PlannedDurationMinutes);
    }

    [Fact]
    public async Task Morning_untimed_items_are_scheduled_from_when_they_spoke()
    {
        var model = new StubLanguageModel(
            """{"title":"Workday","commitments":[{"title":"Gym","plannedStart":"07:00","plannedDurationMinutes":60,"lifeArea":"HEALTH"},{"title":"Get lunch"},{"title":"Ship the test","plannedStart":"14:00","plannedDurationMinutes":90,"lifeArea":"WORK"}]}""");
        var interpreter = new DayInterpreter(model);
        var spoken = new DateTimeOffset(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);

        var draft = await interpreter.ReadMorningAsync(
            "Gym at 7, lunch, ship the test at 2",
            new MorningContext("UTC", spoken));

        Assert.Equal("Workday", draft.Title);
        Assert.Equal(3, draft.Commitments.Count);
        Assert.Equal(7 * 60, draft.Commitments[0].PlannedStartMinute);
        Assert.Equal(12 * 60, draft.Commitments[1].PlannedStartMinute);
        Assert.Equal(45, draft.Commitments[1].PlannedDurationMinutes);
        Assert.Equal(14 * 60, draft.Commitments[2].PlannedStartMinute);
    }

    [Fact]
    public async Task Morning_titles_become_sentence_case()
    {
        var model = new StubLanguageModel(
            """{"title":"heavy gym tuesday","commitments":[{"title":"go to the gym"},{"title":"Read"}]}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadMorningAsync("go to the gym and read");

        Assert.Equal("Heavy gym tuesday", draft.Title);
        Assert.Equal("Go to the gym", draft.Commitments[0].Title);
        Assert.Equal("Read", draft.Commitments[1].Title);
    }

    [Fact]
    public async Task Morning_garbage_json_fails_interpret()
    {
        var interpreter = new DayInterpreter(new StubLanguageModel("not-json"));

        await Assert.ThrowsAsync<InterpretException>(() =>
            interpreter.ReadMorningAsync("hello"));
    }

    [Fact]
    public async Task Evening_drops_unknown_ids_and_marks_omitted_planned_missed()
    {
        var plannedId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var otherId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var model = new StubLanguageModel(
            """{"outcomes":[{"id":"99999999-9999-9999-9999-999999999999","status":"COMPLETED"}],"wins":[{"title":"Cleaned"}]}""");
        var interpreter = new DayInterpreter(model);
        var planned = new[]
        {
            new CommitmentRecord(plannedId, "Gym", "PLANNED", null, null),
            new CommitmentRecord(otherId, "Read", "PLANNED", 20, null)
        };

        var draft = await interpreter.ReadEveningAsync("gym later", planned);

        Assert.Equal(2, draft.Outcomes.Count);
        Assert.Contains(draft.Outcomes, o => o.Id == plannedId && o.Status == "MISSED");
        Assert.Contains(draft.Outcomes, o => o.Id == otherId && o.Status == "MISSED");
        Assert.DoesNotContain(draft.Outcomes, o => o.Id == Guid.Parse("99999999-9999-9999-9999-999999999999"));
        Assert.Equal("Cleaned", draft.Wins[0].Title);
    }

    [Fact]
    public async Task Evening_reads_json_wrapped_in_fences()
    {
        var id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var model = new StubLanguageModel(
            "```json\n{\"outcomes\":[{\"id\":\"11111111-1111-1111-1111-111111111111\",\"status\":\"completed\"}],\"wins\":[]}\n```");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadEveningAsync(
            "gym yes",
            [new CommitmentRecord(id, "Gym", "PLANNED", null, null)]);

        Assert.Equal("COMPLETED", draft.Outcomes[0].Status);
    }

    [Fact]
    public async Task Evening_garbage_still_returns_missed_planned()
    {
        var id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var interpreter = new DayInterpreter(new StubLanguageModel("not-json"));

        var draft = await interpreter.ReadEveningAsync(
            "messy night",
            [new CommitmentRecord(id, "Gym", "PLANNED", null, null)]);

        Assert.Single(draft.Outcomes);
        Assert.Equal(id, draft.Outcomes[0].Id);
        Assert.Equal("MISSED", draft.Outcomes[0].Status);
        Assert.Empty(draft.Wins);
    }

    [Fact]
    public async Task Evening_keeps_unplanned_wins_and_a_mirror()
    {
        var id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var model = new StubLanguageModel(
            """{"outcomes":[{"id":"11111111-1111-1111-1111-111111111111","status":"MISSED"}],"wins":[{"title":"called my friends","lifeArea":"RELATIONSHIPS"},{"title":"took a shower"}],"mirror":"Bible waited. You still called your friends. That counts."}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadEveningAsync(
            "I did not read my Bible. I called my friends. I took a shower.",
            [new CommitmentRecord(id, "Read my Bible", "PLANNED", null, null)]);

        Assert.Equal("MISSED", draft.Outcomes[0].Status);
        Assert.Equal("Called my friends", draft.Wins[0].Title);
        Assert.Equal("RELATIONSHIPS", draft.Wins[0].LifeArea);
        Assert.Equal("Took a shower", draft.Wins[1].Title);
        Assert.Equal("HEALTH", draft.Wins[1].LifeArea);
        Assert.Contains("called your friends", draft.Mirror, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Midday_keeps_named_outcomes_adds_and_extras()
    {
        var gym = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var read = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var model = new StubLanguageModel(
            """{"outcomes":[{"id":"11111111-1111-1111-1111-111111111111","status":"COMPLETED"}],"add":[{"title":"call dad","plannedStart":"16:00","lifeArea":"RELATIONSHIPS"}],"extras":[{"title":"took a shower","lifeArea":"HEALTH"}]}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadMiddayAsync(
            "Gym is done. Add a call with dad at 4. I took a shower.",
            [
                new CommitmentRecord(gym, "Gym", "PLANNED", null, null),
                new CommitmentRecord(read, "Read", "PLANNED", null, null)
            ]);

        Assert.Single(draft.Outcomes);
        Assert.Equal(gym, draft.Outcomes[0].Id);
        Assert.Equal("COMPLETED", draft.Outcomes[0].Status);
        Assert.Equal("Call dad", draft.Add[0].Title);
        Assert.Equal(16 * 60, draft.Add[0].PlannedStartMinute);
        Assert.Equal("Took a shower", draft.Extras[0].Title);
        Assert.Equal("HEALTH", draft.Extras[0].LifeArea);
    }

    private sealed class StubLanguageModel(string json) : ILanguageModel
    {
        public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
        {
            return Task.FromResult(json);
        }
    }
}
