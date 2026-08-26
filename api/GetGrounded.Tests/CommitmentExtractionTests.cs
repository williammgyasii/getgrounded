using GetGrounded.Domain;

namespace GetGrounded.Tests;

public class CommitmentExtractionTests
{
    [Fact]
    public void Extraction_is_rejected_when_a_commitment_has_no_title()
    {
        var result = CommitmentExtraction.Validate(new[]
        {
            new ExtractedCommitment(Title: "", Status: CommitmentStatus.Planned)
        });

        Assert.False(result.IsValid);
    }
}
