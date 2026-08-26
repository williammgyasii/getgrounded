using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public static class DayPlanner
{
    public const int DefaultMinutes = 30;
    public const int MealMinutes = 45;

    public static IReadOnlyList<PlannedItem> LayOut(IReadOnlyList<PlannedItem> items, int spokenMinute)
    {
        var prepared = items
            .Select(item => item with
            {
                PlannedDurationMinutes = GuessDuration(item.Title, item.PlannedDurationMinutes),
                LifeArea = string.IsNullOrWhiteSpace(item.LifeArea)
                    ? GuessArea(item.Title)
                    : item.LifeArea.Trim().ToUpperInvariant(),
            })
            .ToList();

        var placed = prepared
            .Where(item => item.PlannedStartMinute is int)
            .ToList();
        var cursor = Math.Max(0, spokenMinute);

        foreach (var item in prepared.Where(item => item.PlannedStartMinute is null))
        {
            var duration = item.PlannedDurationMinutes ?? DefaultMinutes;
            var start = NextGap(cursor, duration, placed);
            placed.Add(item with { PlannedStartMinute = start });
            cursor = start + duration;
        }

        return placed
            .OrderBy(item => item.PlannedStartMinute ?? int.MaxValue)
            .ToList();
    }

    public static int GuessDuration(string title, int? given)
    {
        if (given is > 0)
        {
            return given.Value;
        }

        return LooksLikeMeal(title) ? MealMinutes : DefaultMinutes;
    }

    public static string GuessArea(string title)
    {
        var text = title.ToLowerInvariant();
        if (LooksLikeMeal(title) || ContainsAny(text, "cook", "grocery", "home", "laundry", "clean"))
        {
            return "HOME";
        }

        if (ContainsAny(text, "gym", "run", "walk", "workout", "yoga", "health", "doctor"))
        {
            return "HEALTH";
        }

        if (ContainsAny(text, "read", "study", "learn", "course", "class"))
        {
            return "LEARNING";
        }

        if (ContainsAny(text, "ship", "work", "meeting", "code", "api", "email", "office"))
        {
            return "WORK";
        }

        if (ContainsAny(text, "pray", "church", "meditat"))
        {
            return "SPIRITUAL";
        }

        if (ContainsAny(text, "call", "family", "friend", "date"))
        {
            return "RELATIONSHIPS";
        }

        if (ContainsAny(text, "bill", "money", "budget", "invoice"))
        {
            return "FINANCIAL";
        }

        return "PERSONAL";
    }

    private static int NextGap(int cursor, int duration, IReadOnlyList<PlannedItem> placed)
    {
        var busy = placed
            .Where(item => item.PlannedStartMinute is int)
            .Select(item => (
                Start: item.PlannedStartMinute!.Value,
                End: item.PlannedStartMinute.Value + (item.PlannedDurationMinutes ?? DefaultMinutes)))
            .OrderBy(slot => slot.Start)
            .ToList();

        var start = cursor;
        foreach (var slot in busy)
        {
            if (start + duration <= slot.Start)
            {
                return start;
            }

            if (start < slot.End)
            {
                start = slot.End;
            }
        }

        return start;
    }

    private static bool LooksLikeMeal(string title)
    {
        var text = title.ToLowerInvariant();
        return ContainsAny(text, "lunch", "dinner", "breakfast", "brunch", "eat", "meal");
    }

    private static bool ContainsAny(string text, params string[] needles)
    {
        return needles.Any(text.Contains);
    }
}
