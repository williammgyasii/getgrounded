using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed record MorningContext(string Timezone, DateTimeOffset SpokenAt);

public sealed record MorningDraft(string? Title, IReadOnlyList<PlannedItem> Commitments);

public sealed record EveningDraft(IReadOnlyList<OutcomeItem> Outcomes, IReadOnlyList<WinItem> Wins, string? Mirror = null);

public sealed record MiddayDraft(
    IReadOnlyList<PlannedItem> Add,
    IReadOnlyList<OutcomeItem> Outcomes,
    IReadOnlyList<WinItem> Extras);
