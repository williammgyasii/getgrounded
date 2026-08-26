using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed class ClipService(
    IAudioStore audio,
    ISpeechToText speech,
    IDayInterpreter interpreter,
    BookService book)
{
    public const int MaxBytes = 2 * 1024 * 1024;

    public async Task<HearResult> HearAsync(
        Guid userId,
        HearClip clip,
        CancellationToken cancellationToken)
    {
        RequireClip(clip);
        await audio.PutAsync(userId, "MORNING_PLAN", clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            throw new EmptySpeechException();
        }

        return heard;
    }

    public async Task<MorningDraft> ExtractMorningAsync(string transcript, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript is required.", nameof(transcript));
        }

        return await interpreter.ReadMorningAsync(transcript, cancellationToken);
    }

    public async Task<DeskRecord> CaptureAsync(
        Guid userId,
        string kind,
        string timezone,
        HearClip clip,
        CancellationToken cancellationToken)
    {
        if (kind == "MORNING_PLAN")
        {
            throw new ArgumentException("Morning uses hear, extract, then /days/morning.", nameof(kind));
        }

        if (kind is not "EVENING_REFLECTION")
        {
            throw new ArgumentException("Unknown clip kind.", nameof(kind));
        }

        RequireClip(clip);
        await audio.PutAsync(userId, kind, clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            throw new EmptySpeechException();
        }

        var desk = await book.GetDeskAsync(userId, timezone, cancellationToken);
        var planned = desk.Today?.Commitments ?? [];
        var draft = await interpreter.ReadEveningAsync(heard.Transcript, planned, cancellationToken);
        await book.ReflectEveningAsync(
            userId,
            timezone,
            heard.Transcript,
            draft.Outcomes,
            draft.Wins,
            cancellationToken);

        return await book.GetDeskAsync(userId, timezone, cancellationToken);
    }

    private static void RequireClip(HearClip clip)
    {
        if (clip.Bytes.Length == 0)
        {
            throw new ArgumentException("Audio is required.", nameof(clip));
        }

        if (clip.Bytes.Length > MaxBytes)
        {
            throw new ClipTooLargeException();
        }

        if (clip.ContentType is not ("audio/mp4" or "audio/m4a" or "audio/x-m4a"))
        {
            throw new ArgumentException("Unsupported audio type.", nameof(clip));
        }
    }
}
