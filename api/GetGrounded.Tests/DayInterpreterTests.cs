using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests;

public class DayInterpreterTests
{
    [Fact]
    public async Task Morning_json_becomes_planned_items()
    {
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Read","plannedDurationMinutes":20,"confidence":0.9}]}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadMorningAsync("I will read 20 minutes");

        Assert.Single(draft.Commitments);
        Assert.Equal("Read", draft.Commitments[0].Title);
        Assert.Equal(20, draft.Commitments[0].PlannedDurationMinutes);
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
