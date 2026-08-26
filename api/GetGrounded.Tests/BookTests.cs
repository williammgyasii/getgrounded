using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;
using GetGrounded.Tests.Fakes;

namespace GetGrounded.Tests;

public class BookTests
{
    private static readonly DateTimeOffset NoonUtc = DateTimeOffset.Parse("2026-08-26T12:00:00Z");
    private static readonly Guid Person = Guid.Parse("0198c0a0-0000-7000-8000-000000000001");
    private static readonly Guid OtherPerson = Guid.Parse("0198c0a0-0000-7000-8000-000000000002");

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
    public async Task Morning_with_storage_key_is_playable()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(
            Person, "UTC", "Gym.", [new PlannedItem("Gym")], "Gym day", "user/morning/clip.m4a");
        Assert.True(day.Clips[0].Playable);
    }

    [Fact]
    public async Task GetClipAsync_wrong_user_returns_null()
    {
        const string storageKey = "user/morning/clip.m4a";
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(
            Person, "UTC", "Gym.", [new PlannedItem("Gym")], "Gym day", storageKey);
        var clipId = day.Clips[0].Id;

        var strangerClip = await book.GetClipAsync(OtherPerson, clipId);
        var ownerClip = await book.GetClipAsync(Person, clipId);

        Assert.Null(strangerClip);
        Assert.NotNull(ownerClip);
        Assert.Equal(storageKey, ownerClip!.StorageKey);
    }

    [Fact]
    public async Task Morning_without_storage_key_is_not_playable()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(Person, "UTC", "Gym.", [new PlannedItem("Gym")]);
        Assert.False(day.Clips[0].Playable);
    }

    [Fact]
    public async Task Morning_keeps_the_life_area_tag()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        var day = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym then lunch.",
            [
                new PlannedItem("Gym", 60, 7 * 60, "HEALTH"),
                new PlannedItem("Get lunch", 45, 12 * 60, "HOME"),
            ]);

        Assert.Equal("HEALTH", day.Commitments[0].LifeArea);
        Assert.Equal("HOME", day.Commitments[1].LifeArea);
    }

    [Fact]
    public async Task Morning_second_take_appends_and_stamps_when()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));

        await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym.",
            [new PlannedItem("Gym", 60, 7 * 60)]);
        var day = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Also call Mom.",
            [new PlannedItem("Call Mom", 20, 16 * 60)]);

        Assert.Equal(2, day.Commitments.Count);
        Assert.Equal(["Gym", "Call Mom"], day.Commitments.Select(item => item.Title).ToArray());
        Assert.All(day.Commitments, item => Assert.NotNull(item.CreatedAt));
        Assert.Equal(2, day.Clips.Count);
    }

    [Fact]
    public async Task Day_can_be_renamed_checked_and_deleted()
    {
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc));
        var day = await book.PlanMorningAsync(
            Person,
            "UTC",
            "Gym.",
            [new PlannedItem("Gym"), new PlannedItem("Read")],
            "Today's commitment");

        var renamed = await book.RenameDayAsync(Person, day.Id, "Heavy gym day");
        Assert.Equal("Heavy gym day", renamed!.Title);

        var checkedIn = await book.MarkCommitmentAsync(Person, day.Commitments[0].Id, "COMPLETED");
        Assert.Equal("COMPLETED", checkedIn!.Commitments[0].Status);
        Assert.Equal("PLANNED", checkedIn.Commitments[1].Status);

        var trimmed = await book.RemoveCommitmentAsync(Person, day.Commitments[1].Id);
        Assert.Single(trimmed!.Commitments);

        Assert.True(await book.RemoveDayAsync(Person, day.Id));
        var desk = await book.GetDeskAsync(Person, "UTC");
        Assert.Null(desk.Today);
    }

    [Fact]
    public async Task RemoveDay_deletes_the_audio_object()
    {
        var audio = new GetGrounded.Infrastructure.Voice.MemoryAudioStore();
        var book = new BookService(new MemoryBookStore(), new TestClock(NoonUtc), audio);
        var key = await audio.PutAsync(
            Person, "MORNING_PLAN", new HearClip([1, 2, 3], "audio/mp4"), default);

        var day = await book.PlanMorningAsync(
            Person, "UTC", "Gym.", [new PlannedItem("Gym")], "Gym day", key);

        Assert.True(await book.RemoveDayAsync(Person, day.Id));
        Assert.Null(await audio.GetAsync(key, default));
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
