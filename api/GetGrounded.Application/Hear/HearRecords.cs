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

public sealed record PlanSuggestBlock(
    string Title,
    int? PlannedStartMinute,
    int? PlannedDurationMinutes,
    string Source);

public sealed record PlanClarifyResult(
    string MuseLine,
    IReadOnlyList<ClarifyQuestion> Questions,
    IReadOnlyList<PlanSuggestBlock> SuggestedBlocks)
{
    public bool Complete => Questions.Count == 0;
}

public sealed record MiddayOutcomeDraft(Guid Id, string Status);

public sealed record MiddayExtraDraft(string Title, string? LifeArea);

public sealed record MiddayDraft(
    IReadOnlyList<PlannedItem> Add,
    IReadOnlyList<MiddayOutcomeDraft> Outcomes,
    IReadOnlyList<MiddayExtraDraft> Extras);
