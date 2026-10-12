namespace GetGrounded.Application.Book;

public static class MiddayScheduleEngine
{
    public static IReadOnlyList<PlannedItem> SlotNewItems(DayRecord day, IReadOnlyList<PlannedItem> add)
    {
        if (add.Count == 0)
        {
            return add;
        }

        var cursor = NextOpenMinute(day);
        var result = new List<PlannedItem>(add.Count);
        foreach (var item in add)
        {
            if (item.PlannedStartMinute is int start)
            {
                result.Add(item);
                var duration = item.PlannedDurationMinutes ?? 30;
                cursor = Math.Max(cursor, start + duration);
                continue;
            }

            var minutes = item.PlannedDurationMinutes ?? 30;
            result.Add(item with { PlannedStartMinute = cursor });
            cursor += minutes;
        }

        return result;
    }

    private static int NextOpenMinute(DayRecord day)
    {
        var cursor = 8 * 60;
        foreach (var item in day.Commitments.OrderBy(row => row.PlannedStartMinute ?? int.MaxValue))
        {
            if (item.PlannedStartMinute is not int start)
            {
                continue;
            }

            var duration = item.PlannedDurationMinutes ?? 30;
            cursor = Math.Max(cursor, start + duration + 15);
        }

        return Math.Min(cursor, 22 * 60);
    }
}
