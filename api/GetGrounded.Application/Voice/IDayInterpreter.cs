using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public interface IDayInterpreter
{
    Task<MorningDraft> ReadMorningAsync(
        string transcript,
        MorningContext? context = null,
        CancellationToken cancellationToken = default);
    Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<CommitmentRecord> planned,
        CancellationToken cancellationToken = default);
}
