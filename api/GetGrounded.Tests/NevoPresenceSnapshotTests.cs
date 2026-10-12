namespace GetGrounded.Tests;

/// <summary>
/// Mirrors mobile next-task selection for Nevo snapshot (see mobile/src/lib/nevo-presence.ts).
/// </summary>
public class NevoPresenceSnapshotTests
{
    private sealed record Row(string Id, string Title, string Status, int? Start);

    [Fact]
    public void Next_task_prefers_upcoming_start()
    {
        var now = 8 * 60;
        var rows = new[]
        {
            new Row("1", "Gym", "PLANNED", 7 * 60),
            new Row("2", "Cook", "PLANNED", 12 * 60),
        };

        var next = PickNext(rows, now);

        Assert.Equal("2", next!.Id);
    }

    [Fact]
    public void Next_task_skips_completed()
    {
        var now = 8 * 60;
        var rows = new[]
        {
            new Row("1", "Gym", "COMPLETED", 9 * 60),
            new Row("2", "Read", "PLANNED", 10 * 60),
        };

        var next = PickNext(rows, now);

        Assert.Equal("2", next!.Id);
    }

    private static Row? PickNext(IReadOnlyList<Row> rows, int nowMinute) =>
        rows
            .Where(row => row.Title.Length > 0)
            .Where(row => !string.Equals(row.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            .Where(row => row.Start != null)
            .OrderBy(row => row.Start)
            .FirstOrDefault(row => row.Start >= nowMinute)
        ?? rows
            .Where(row => row.Title.Length > 0)
            .Where(row => !string.Equals(row.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            .Where(row => row.Start != null)
            .OrderBy(row => row.Start)
            .FirstOrDefault();
}
