namespace GetGrounded.Application.Time;

public static class LocalClock
{
    public static int MinuteOfDay(string timezone, DateTimeOffset instant)
    {
        var local = TimeZoneInfo.ConvertTime(instant, Zone(timezone));
        return local.Hour * 60 + local.Minute;
    }

    public static DateTimeOffset At(string timezone, DateOnly date, int minute)
    {
        var zone = Zone(timezone);
        var local = DateTime.SpecifyKind(
            date.ToDateTime(TimeOnly.MinValue).AddMinutes(minute),
            DateTimeKind.Unspecified);
        var utc = TimeZoneInfo.ConvertTimeToUtc(local, zone);
        return new DateTimeOffset(utc, TimeSpan.Zero);
    }

    public static TimeZoneInfo Zone(string timezone)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timezone.Trim());
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
