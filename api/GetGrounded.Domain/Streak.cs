namespace GetGrounded.Domain;

public static class Streak
{
    public static int Count(IEnumerable<DateOnly> showedUp, DateOnly today)
    {
        var dates = showedUp.Distinct().OrderByDescending(day => day).ToList();
        if (dates.Count == 0)
        {
            return 0;
        }

        if (dates[0] != today && dates[0] != today.AddDays(-1))
        {
            return 0;
        }

        var expected = dates[0];
        var days = 0;
        foreach (var date in dates)
        {
            if (date != expected)
            {
                break;
            }

            days++;
            expected = expected.AddDays(-1);
        }

        return days;
    }
}
