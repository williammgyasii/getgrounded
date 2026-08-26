using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed class ClipService(
    IAudioStore audio,
    ISpeechToText speech,
    IDayInterpreter interpreter,
    BookService book)
{
    public const int MaxBytes = 2 * 1024 * 1024;

    public async Task<DeskRecord> CaptureAsync(
        Guid userId,
        string kind,
        string timezone,
        HearClip clip,
        CancellationToken cancellationToken)
    {
        if (kind is not ("MORNING_PLAN" or "EVENING_REFLECTION"))
        {
            throw new ArgumentException("Unknown clip kind.", nameof(kind));
        }

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

        await audio.PutAsync(userId, kind, clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            throw new EmptySpeechException();
        }

        if (kind == "MORNING_PLAN")
        {
            var draft = await interpreter.ReadMorningAsync(heard.Transcript, cancellationToken);
            await book.PlanMorningAsync(userId, timezone, heard.Transcript, draft.Commitments, cancellationToken);
        }
        else
        {
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
        }

        return await book.GetDeskAsync(userId, timezone, cancellationToken);
    }
}
