namespace GetGrounded.Application.Hear;

public interface ILanguageModelAccessor
{
    Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken = default);
}
