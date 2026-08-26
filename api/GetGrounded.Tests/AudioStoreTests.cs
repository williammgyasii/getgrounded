using GetGrounded.Application.Voice;
using GetGrounded.Infrastructure.Voice;

namespace GetGrounded.Tests;

public class AudioStoreTests
{
    [Fact]
    public async Task Put_then_get_returns_the_same_bytes()
    {
        var store = new MemoryAudioStore();
        var clip = new HearClip([1, 2, 3, 4], "audio/mp4");
        var key = await store.PutAsync(Guid.NewGuid(), "MORNING_PLAN", clip, CancellationToken.None);
        var got = await store.GetAsync(key, CancellationToken.None);
        Assert.Equal(clip.Bytes, got!.Bytes);
        Assert.Equal("audio/mp4", got.ContentType);
    }

    [Fact]
    public async Task Delete_makes_get_return_null()
    {
        var store = new MemoryAudioStore();
        var key = await store.PutAsync(Guid.NewGuid(), "MORNING_PLAN", new HearClip([9], "audio/mp4"), default);
        await store.DeleteAsync(key, default);
        Assert.Null(await store.GetAsync(key, default));
    }
}
