namespace GetGrounded.Application.Book;

public static class FollowThrough
{
    private static readonly HashSet<string> Dropped = ["CANCELLED", "RESCHEDULED"];

    public static ReviewRecord From(DateOnly today, string timezone, IReadOnlyList<DayRecord> days)
    {
        var from = today.AddDays(-6);
        var nights = days
            .Where(day => day.LocalDate >= from && day.LocalDate <= today)
            .Where(Closed)
            .OrderBy(day => day.LocalDate)
            .Select(ScoreNight)
            .ToList();

        var planned = nights.Sum(night => night.Planned);
        var done = nights.Sum(night => night.Done);
        var partial = nights.Sum(night => night.Partial);
        var missed = nights.Sum(night => night.Missed);
        var extras = nights.Sum(night => night.Extras);
        var earned = done + partial * 0.5m;
        int? percent = planned == 0
            ? null
            : (int)decimal.Round(earned / planned * 100m, MidpointRounding.AwayFromZero);

        return new ReviewRecord(
            from,
            today,
            timezone,
            nights.Count,
            planned,
            done,
            partial,
            missed,
            extras,
            earned,
            percent,
            nights);
    }

    private static bool Closed(DayRecord day) =>
        day.Clips.Any(clip => clip.Kind == "EVENING_REFLECTION");

    private static ReviewNight ScoreNight(DayRecord day)
    {
        var pile = day.Commitments
            .Where(item => !Dropped.Contains(item.Status.Trim().ToUpperInvariant()))
            .ToList();
        var done = pile.Count(item => item.Status.Equals("COMPLETED", StringComparison.OrdinalIgnoreCase));
        var partial = pile.Count(item => item.Status.Equals("PARTIAL", StringComparison.OrdinalIgnoreCase));
        var missed = pile.Count - done - partial;
        return new ReviewNight(day.Id, day.LocalDate, day.Title, pile.Count, done, partial, missed, day.Wins.Count);
    }
}
