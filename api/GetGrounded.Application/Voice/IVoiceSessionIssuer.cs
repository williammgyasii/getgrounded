namespace GetGrounded.Application.Voice;

public interface IVoiceSessionIssuer
{
    Task<VoiceIssue> IssueAsync(string userId, CancellationToken cancellationToken = default);
}
