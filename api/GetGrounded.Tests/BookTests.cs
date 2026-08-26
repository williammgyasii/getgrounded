using GetGrounded.Application.Book;
using GetGrounded.Tests.Fakes;

namespace GetGrounded.Tests;

public class BookTests
{
    private static readonly DateTimeOffset NoonUtc = DateTimeOffset.Parse("2026-08-26T12:00:00Z");
    private static readonly Guid Person = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");

    [Fact]
    public async Task Morning_writes_planned_commitments_and_counts_as_showing_up()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym, read, ship the test.",
            [new PlannedItem("Gym"), new PlannedItem("Read"), new PlannedItem("Ship the test")]);

        Assert.Equal(new DateOnly(2026, 8, 26), day.LocalDate);
        Assert.True(day.ShowedUp);
        Assert.Equal(["Gym", "Read", "Ship the test"], day.Commitments.Select(item => item.Title).ToArray());
        Assert.All(day.Commitments, item => Assert.Equal("PLANNED", item.Status));

        var desk = await book.GetDeskAsync(Person, "UTC");
        Assert.Equal(1, desk.StreakDays);
        Assert.Equal(3, desk.Today!.Commitments.Count);
    }

    [Fact]
    public async Task Morning_saves_the_day_title()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym and read.",
            [new PlannedItem("Gym"), new PlannedItem("Read")],
            "Heavy gym Tuesday");

        Assert.Equal("Heavy gym Tuesday", day.Title);
        var desk = await book.GetDeskAsync(Person, "UTC");
        Assert.Equal("Heavy gym Tuesday", desk.Today!.Title);
    }

    [Fact]
    public async Task Evening_reconciles_outcomes_and_records_wins()
    {
        var store = new MemoryBookStore();
        var book = new BookService(store, new TestClock(NoonUtc));
        var morning = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym and read.",
            [new PlannedItem("Gym"), new PlannedItem("Read")]);

        var evening = await book.ReflectEveningAsync(
            Person,
            "UTC",
            "Gym yes. Read half. Cleaned the kitchen.",
            [
                new OutcomeItem(morning.Commitments[0].Id, "COMPLETED"),
                new OutcomeItem(morning.Commitments[1].Id, "PARTIAL", 10)
            ],
            [new WinItem("Cleaned the kitchen")]);

        Assert.NotNull(evening);
        Assert.Equal("COMPLETED", evening.Commitments[0].Status);
        Assert.Equal("PARTIAL", evening.Commitments[1].Status);
        Assert.Equal(10, evening.Commitments[1].ActualDurationMinutes);
        Assert.Equal(["Cleaned the kitchen"], evening.Wins.Select(item => item.Title).ToArray());
    }

    [Fact]
    public async Task History_returns_the_spoken_day()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));
        await book.PlanMorningAsync(Person, "UTC", "Just gym.", [new PlannedItem("Gym")]);

        var history = await book.GetHistoryAsync(Person, "UTC");

        Assert.Single(history);
        Assert.Equal("Gym", history[0].Commitments[0].Title);
    }
}
