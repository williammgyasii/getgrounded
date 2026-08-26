using GetGrounded.Application.Book;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Application.Voice;

public sealed class ClipService(
    IAudioStore audio,
    ISpeechToText speech,
    IDayInterpreter interpreter,
    BookService book,
    ILogger<ClipService>? log = null)
{
    public const int MaxBytes = 2 * 1024 * 1024;
    private readonly ILogger _log = log ?? NullLogger<ClipService>.Instance;

    public async Task<HearResult> HearAsync(
        Guid userId,
        HearClip clip,
        CancellationToken cancellationToken)
    {
        RequireClip(clip);
        _log.LogInformation("hear started user={UserId} bytes={Bytes} type={Type}", userId, clip.Bytes.Length, clip.ContentType);
        await audio.PutAsync(userId, "MORNING_PLAN", clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            _log.LogWarning("hear empty user={UserId} bytes={Bytes}", userId, clip.Bytes.Length);
            throw new EmptySpeechException();
        }

        _log.LogInformation("hear ok user={UserId} chars={Chars}", userId, heard.Transcript.Length);
        return heard;
    }

    public async Task<MorningDraft> ExtractMorningAsync(string transcript, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Transcript is required.", nameof(transcript));
        }

        _log.LogInformation("extract started chars={Chars}", transcript.Length);
        var draft = await interpreter.ReadMorningAsync(transcript, cancellationToken);
        _log.LogInformation("extract ok title={HasTitle} items={Items}", draft.Title is not null, draft.Commitments.Count);
        return draft;
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

        if (!IsAudio(clip.ContentType))
        {
            throw new ArgumentException("Unsupported audio type.", nameof(clip));
        }
    }

    private static bool IsAudio(string contentType)
    {
        var type = contentType.Split(';', 2)[0].Trim().ToLowerInvariant();
        return type is ""
            or "application/octet-stream"
            or "audio/mp4"
            or "audio/m4a"
            or "audio/x-m4a"
            or "audio/aac"
            or "audio/mpeg"
            or "audio/mp3"
            or "audio/wav"
            or "audio/x-wav"
            or "audio/3gpp"
            or "audio/amr"
            or "audio/webm";
    }
}
