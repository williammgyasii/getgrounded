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

    private sealed class StubLanguageModel(string json) : ILanguageModel
    {
        public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
        {
            return Task.FromResult(json);
        }
    }
}
