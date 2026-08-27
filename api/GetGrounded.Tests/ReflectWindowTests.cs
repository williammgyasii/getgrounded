using GetGrounded.Application.Time;

namespace GetGrounded.Tests;

public class ReflectWindowTests
{
    [Fact]
    public void Seven_to_ten_includes_grace_hour()
    {
        Assert.True(ReflectWindow.Contains(19 * 60, 19 * 60, 22 * 60));
        Assert.True(ReflectWindow.Contains(22 * 60 + 30, 19 * 60, 22 * 60));
        Assert.False(ReflectWindow.Contains(23 * 60, 19 * 60, 22 * 60));
        Assert.False(ReflectWindow.Contains(12 * 60, 19 * 60, 22 * 60));
    }

    [Fact]
    public void Can_close_today_and_two_days_back()
    {
        var today = new DateOnly(2026, 8, 26);
        Assert.True(ReflectWindow.CanClose(today, today, hasMorning: true, hasEvening: false));
        Assert.True(ReflectWindow.CanClose(today.AddDays(-2), today, true, false));
        Assert.False(ReflectWindow.CanClose(today.AddDays(-3), today, true, false));
        Assert.False(ReflectWindow.CanClose(today, today, hasMorning: true, hasEvening: true));
        Assert.False(ReflectWindow.CanClose(today, today, hasMorning: false, hasEvening: false));
    }
}
