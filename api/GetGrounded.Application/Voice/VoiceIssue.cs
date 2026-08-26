namespace GetGrounded.Application.Voice;

public enum VoiceIssueKind
{
    Ready,
    NotConfigured,
    Busy,
    Failed
}

public sealed record VoiceIssue(VoiceIssueKind Kind, VoiceSession? Session = null)
{
    public static VoiceIssue Ready(VoiceSession session) => new(VoiceIssueKind.Ready, session);

    public static VoiceIssue NotConfigured { get; } = new(VoiceIssueKind.NotConfigured);

    public static VoiceIssue Busy { get; } = new(VoiceIssueKind.Busy);

    public static VoiceIssue Failed { get; } = new(VoiceIssueKind.Failed);
}
