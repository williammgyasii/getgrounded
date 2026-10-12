namespace GetGrounded.Application.Hear;

public static class HearEngine
{
    public const int MaxBytes = 2 * 1024 * 1024;

    public static void RequireClip(HearClip clip)
    {
        if (clip.Bytes.Length == 0)
        {
            throw new ArgumentException("Audio is required.", nameof(clip));
        }

        if (clip.Bytes.Length > MaxBytes)
        {
            throw new ClipTooLargeException();
        }
    }
}
