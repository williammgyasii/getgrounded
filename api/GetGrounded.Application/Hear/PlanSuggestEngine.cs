using System.Text.RegularExpressions;

namespace GetGrounded.Application.Hear;

public static class PlanSuggestEngine
{
    private static readonly Regex WakeEarly =
        new(@"\bwake\s*(up)?\s*early\b|\bearly\s*wake\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static IReadOnlyList<PlanSuggestBlock> BuildBlocks(string transcript, PlanScheduleVariant variant)
    {
        var text = transcript ?? string.Empty;
        var slots = variant == PlanScheduleVariant.Alternate ? AlternateSlots : DefaultSlots;
        var blocks = new List<PlanSuggestBlock>();
        var cursor = slots.DayStartMinute;

        if (WakeEarly.IsMatch(text))
        {
            blocks.Add(new PlanSuggestBlock(
                "Wake up",
                slots.WakeMinute,
                30,
                "inferred"));
            cursor = Math.Max(cursor, slots.WakeMinute + 30);
        }

        if (Regex.IsMatch(text, @"\bgym\b|\bwork\s*out\b|\bworkout\b", RegexOptions.IgnoreCase))
        {
            var start = Math.Max(cursor, slots.GymMinute);
            blocks.Add(new PlanSuggestBlock("Hit the gym", start, 60, "spoken"));
            cursor = start + 60;
        }

        if (Regex.IsMatch(text, @"\bcook\b|\bcooking\b|\bmeal\b|\brecipe\b", RegexOptions.IgnoreCase))
        {
            var start = Math.Max(cursor + slots.GapAfterWorkout, slots.CookMinute);
            blocks.Add(new PlanSuggestBlock("Cooking", start, 120, "spoken"));
            cursor = start + 120;
        }

        if (Regex.IsMatch(text, @"\bread\b|\bbook\b", RegexOptions.IgnoreCase))
        {
            var start = Math.Max(cursor + 15, slots.ReadMinute);
            blocks.Add(new PlanSuggestBlock("Reading", start, 60, "spoken"));
        }

        if (Regex.IsMatch(text, @"\bcall\b|\bfriends\b|\bfamily\b", RegexOptions.IgnoreCase))
        {
            var start = Math.Max(cursor + 15, slots.CallMinute);
            blocks.Add(new PlanSuggestBlock("Call friends", start, 45, "spoken"));
        }

        return blocks;
    }

    public static IReadOnlyList<PlanSuggestBlock> AlternateTimes(
        IReadOnlyList<PlanSuggestBlock> blocks,
        string transcript)
    {
        if (blocks.Count == 0)
        {
            return BuildBlocks(transcript, PlanScheduleVariant.Alternate);
        }

        var titles = blocks.Select(row => row.Title.Trim().ToLowerInvariant()).ToHashSet();
        var rebuilt = BuildBlocks(transcript, PlanScheduleVariant.Alternate)
            .Where(row => titles.Contains(row.Title.Trim().ToLowerInvariant())
                || titles.Any(title => row.Title.Contains(title, StringComparison.OrdinalIgnoreCase)
                    || title.Contains(row.Title.Trim(), StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (rebuilt.Count >= blocks.Count)
        {
            return rebuilt;
        }

        var shift = 90;
        return blocks
            .Select(row => row with
            {
                PlannedStartMinute = row.PlannedStartMinute == null ? null : row.PlannedStartMinute + shift,
            })
            .ToList();
    }

    private static SlotPack DefaultSlots => new(6 * 60 + 30, 7 * 60, 9 * 60, 14 * 60, 17 * 60, 6 * 60, 30);

    private static SlotPack AlternateSlots => new(7 * 60, 8 * 60 + 30, 11 * 60, 15 * 60, 18 * 60, 6 * 60 + 30, 45);

    private readonly record struct SlotPack(
        int DayStartMinute,
        int WakeMinute,
        int GymMinute,
        int CookMinute,
        int ReadMinute,
        int CallMinute,
        int GapAfterWorkout);
}
