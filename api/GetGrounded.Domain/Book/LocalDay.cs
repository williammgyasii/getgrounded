namespace GetGrounded.Domain.Book;

public static class LocalDay
{
    public static DateOnly From(string timezone, DateTimeOffset utcNow)
    {
        if (string.IsNullOrWhiteSpace(timezone))
        {
            throw new ArgumentException("Timezone is required.", nameof(timezone));
        }

        TimeZoneInfo zone;
        try
        {
            zone = TimeZoneInfo.FindSystemTimeZoneById(timezone.Trim());
        }
        catch (TimeZoneNotFoundException ex)
        {
            throw new ArgumentException("Timezone is not a valid IANA zone.", nameof(timezone), ex);
        }
        catch (InvalidTimeZoneException ex)
        {
            throw new ArgumentException("Timezone is not a valid IANA zone.", nameof(timezone), ex);
        }

        var local = TimeZoneInfo.ConvertTime(utcNow, zone);
        return DateOnly.FromDateTime(local.DateTime);
    }
}
