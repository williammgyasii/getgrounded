using GetGrounded.Application.Time;

namespace GetGrounded.Tests.Fakes;

internal sealed class FakeClock : IClock
{
    public DateTimeOffset UtcNow { get; set; } = DateTimeOffset.Parse("2026-08-26T18:00:00Z");
}
