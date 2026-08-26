namespace GetGrounded.Application.Voice;

public interface ILanguageModel
{
    Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken);
}
