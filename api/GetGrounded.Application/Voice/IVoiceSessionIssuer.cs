namespace GetGrounded.Application.Voice;

public interface IVoiceSessionIssuer
{
    Task<VoiceSession?> IssueAsync(string userId, CancellationToken cancellationToken = default);
}
