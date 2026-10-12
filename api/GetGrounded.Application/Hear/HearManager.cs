using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace GetGrounded.Application.Hear;

public sealed class HearManager(
    IAudioClipAccessor audio,
    ISpeechToTextAccessor speech,
    ILogger<HearManager>? log = null)
{
    private readonly ILogger _log = log ?? NullLogger<HearManager>.Instance;

    public async Task<HearResult> HearAsync(
        Guid userId,
        HearClip clip,
        CancellationToken cancellationToken = default)
    {
        HearEngine.RequireClip(clip);
        _log.LogInformation(
            "hear started user={UserId} bytes={Bytes} type={Type}",
            userId,
            clip.Bytes.Length,
            clip.ContentType);

        var key = await audio.PutAsync(userId, "MORNING_PLAN", clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            _log.LogWarning("hear empty user={UserId} bytes={Bytes}", userId, clip.Bytes.Length);
            throw new EmptySpeechException();
        }

        _log.LogInformation("hear ok user={UserId} chars={Chars}", userId, heard.Transcript.Length);
        return heard with { StorageKey = key };
    }
}
