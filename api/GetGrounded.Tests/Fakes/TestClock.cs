using GetGrounded.Application.Time;

namespace GetGrounded.Tests.Fakes;

public sealed class TestClock(DateTimeOffset utcNow) : IClock
{
    public DateTimeOffset UtcNow { get; } = utcNow;
}
