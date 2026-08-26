namespace GetGrounded.Domain;

public sealed class Commitment
{
    public string Title { get; }
    public CommitmentStatus Status { get; private set; }

    internal Commitment(string title)
    {
        Title = title;
        Status = CommitmentStatus.Planned;
    }

    internal void MarkMissed()
    {
        Status = CommitmentStatus.Missed;
    }
}
