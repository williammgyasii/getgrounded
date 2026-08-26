using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed record MorningDraft(IReadOnlyList<PlannedItem> Commitments);

public sealed record EveningDraft(IReadOnlyList<OutcomeItem> Outcomes, IReadOnlyList<WinItem> Wins);
