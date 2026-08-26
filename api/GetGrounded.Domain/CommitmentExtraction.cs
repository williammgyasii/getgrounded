namespace GetGrounded.Domain;

public sealed record ExtractedCommitment(string Title, CommitmentStatus Status);

public sealed record ExtractionResult(bool IsValid);

public static class CommitmentExtraction
{
    public static ExtractionResult Validate(IEnumerable<ExtractedCommitment> commitments)
    {
        var isValid = commitments.All(commitment => !string.IsNullOrWhiteSpace(commitment.Title));
        return new ExtractionResult(isValid);
    }
}
