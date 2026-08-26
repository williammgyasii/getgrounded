using GetGrounded.Infrastructure.Voice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;

namespace GetGrounded.Tests;

public class R2AudioStoreTests
{
    [Fact]
    public void IsConfigured_is_true_when_all_four_are_set()
    {
        var config = Map(
            ("R2_ACCOUNT_ID", "acct"),
            ("R2_BUCKET", "getgrounded-dev-audio"),
            ("R2_ACCESS_KEY_ID", "key"),
            ("R2_SECRET_ACCESS_KEY", "secret"));

        Assert.True(R2AudioStore.IsConfigured(config));
    }

    [Theory]
    [InlineData("R2_ACCOUNT_ID")]
    [InlineData("R2_BUCKET")]
    [InlineData("R2_ACCESS_KEY_ID")]
    [InlineData("R2_SECRET_ACCESS_KEY")]
    public void IsConfigured_is_false_when_any_value_is_missing(string missing)
    {
        var values = new Dictionary<string, string?>
        {
            ["R2_ACCOUNT_ID"] = "acct",
            ["R2_BUCKET"] = "getgrounded-dev-audio",
            ["R2_ACCESS_KEY_ID"] = "key",
            ["R2_SECRET_ACCESS_KEY"] = "secret",
            [missing] = missing == "R2_BUCKET" ? " " : null
        };

        Assert.False(R2AudioStore.IsConfigured(new MapConfig(values)));
    }

    [Fact]
    public void Object_key_is_user_kind_and_guid_m4a()
    {
        var userId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var key = R2AudioStore.BuildObjectKey(userId, "MORNING_PLAN");

        Assert.StartsWith("aaaaaaaabbbbccccddddeeeeeeeeeeee/MORNING_PLAN/", key);
        Assert.Matches(@"^[0-9a-f]{32}/MORNING_PLAN/[0-9a-f]{32}\.m4a$", key);
    }

    [Fact]
    public void Constructor_accepts_config_without_calling_r2()
    {
        var config = Map(
            ("R2_ACCOUNT_ID", "e23518956f08ff35812d9ab001a39880"),
            ("R2_BUCKET", "getgrounded-dev-audio"),
            ("R2_ACCESS_KEY_ID", "test-key"),
            ("R2_SECRET_ACCESS_KEY", "test-secret"));

        var store = new R2AudioStore(config);

        Assert.NotNull(store);
    }

    private static IConfiguration Map(params (string Key, string? Value)[] pairs)
    {
        return new MapConfig(pairs.ToDictionary(p => p.Key, p => p.Value));
    }

    private sealed class MapConfig(IReadOnlyDictionary<string, string?> values) : IConfiguration
    {
        public string? this[string name]
        {
            get => values.TryGetValue(name, out var value) ? value : null;
            set { }
        }

        public IEnumerable<IConfigurationSection> GetChildren() => [];

        public IChangeToken GetReloadToken() => new QuietToken();

        public IConfigurationSection GetSection(string name) => new EmptySection(name);
    }

    private sealed class QuietToken : IChangeToken
    {
        public bool HasChanged => false;
        public bool ActiveChangeCallbacks => false;
        public IDisposable RegisterChangeCallback(Action<object?> callback, object? state) => new Silent();
    }

    private sealed class Silent : IDisposable
    {
        public void Dispose() { }
    }

    private sealed class EmptySection(string key) : IConfigurationSection
    {
        public string? this[string name]
        {
            get => null;
            set { }
        }

        public string Key { get; } = key;
        public string Path { get; } = key;
        public string? Value { get; set; }

        public IEnumerable<IConfigurationSection> GetChildren() => [];

        public IChangeToken GetReloadToken() => new QuietToken();

        public IConfigurationSection GetSection(string name) => new EmptySection(name);
    }
}
