namespace GetGrounded.Application.Hear;

public static class PlanExtractEngine
{
    public static void RequireTranscript(string transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript is required.", nameof(transcript));
        }
    }

    public static string RequireTimezone(string? timezone)
    {
        if (string.IsNullOrWhiteSpace(timezone))
        {
            throw new ArgumentException("Timezone is required.", nameof(timezone));
        }

        return timezone.Trim();
    }
}
