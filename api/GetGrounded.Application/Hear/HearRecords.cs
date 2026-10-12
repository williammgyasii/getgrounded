using GetGrounded.Application.Book;

namespace GetGrounded.Application.Hear;

public sealed record HearClip(byte[] Bytes, string ContentType);

public sealed record StoredClip(byte[] Bytes, string ContentType);

public sealed record SpokenWord(string Text, double Start, double End);

public sealed record HearResult(
    string Transcript,
    float? Confidence,
    string? StorageKey = null,
    IReadOnlyList<SpokenWord>? Words = null);

public sealed record MorningDraft(
    string? Title,
    IReadOnlyList<PlannedItem> Commitments,
    string? CoachNote = null);

public sealed record ClarifyQuestion(string Id, string Prompt, string? Topic);

public sealed record ClarifyExchange(string QuestionId, string Prompt, string Answer);

public sealed record PlanClarifyResult(string MuseLine, IReadOnlyList<ClarifyQuestion> Questions)
{
    public bool Complete => Questions.Count == 0;
}
