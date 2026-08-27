namespace GetGrounded.Application.Time;

public static class ReflectWindow
{
    public const int DefaultStartMinute = 19 * 60;
    public const int DefaultEndMinute = 22 * 60;
    public const int GraceMinutes = 60;
    public const int LookbackDays = 2;

    public static bool Contains(int minuteOfDay, int startMinute, int endMinute, int graceMinutes = GraceMinutes)
    {
        var start = Wrap(startMinute);
        var end = Wrap(endMinute);
        var now = Wrap(minuteOfDay);
        var close = Wrap(end + graceMinutes);

        if (start <= end)
        {
            return now >= start && now < close;
        }

        return now >= start || now < close;
    }

    public static bool CanClose(DateOnly localDate, DateOnly today, bool hasMorning, bool hasEvening)
    {
        if (!hasMorning || hasEvening)
        {
            return false;
        }

        var oldest = today.AddDays(-LookbackDays);
        return localDate >= oldest && localDate <= today;
    }

    private static int Wrap(int minute)
    {
        var day = 24 * 60;
        var value = minute % day;
        return value < 0 ? value + day : value;
    }
}
