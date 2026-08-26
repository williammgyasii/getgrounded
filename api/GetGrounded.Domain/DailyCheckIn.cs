namespace GetGrounded.Domain;

public sealed class DailyCheckIn
{
    private readonly List<Commitment> _commitments = [];

    public IReadOnlyList<Commitment> Commitments => _commitments;

    public int ShowingUpStreak { get; private set; }

    public static DailyCheckIn Plan(params string[] titles)
    {
        var day = new DailyCheckIn();
        foreach (var title in titles)
        {
            day._commitments.Add(new Commitment(title));
        }

        return day;
    }

    public void Reflect(bool allMissed)
    {
        if (allMissed)
        {
            foreach (var commitment in _commitments)
            {
                commitment.MarkMissed();
            }
        }

        ShowingUpStreak = 1;
    }
}
