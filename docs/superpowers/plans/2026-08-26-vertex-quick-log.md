# Vertex Quick Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the ElevenLabs ticket path and book a spoken morning or evening through Vertex Speech + Gemini into the existing day book.

**Architecture:** Phone sends audio (or typed text) to `.NET`. `ISpeechToText` hears. `ILanguageModel` returns JSON. `DayInterpreter` maps JSON onto `PlannedItem` / `OutcomeItem` / `WinItem` and fills omitted planned ids as `MISSED`. `ClipService` calls existing `BookService`. Gemini never writes `showed_up` or the streak.

**Tech Stack:** .NET 10, xUnit, WebApplicationFactory, Cloud Speech-to-Text, Vertex `generateContent`, existing Postgres book, Expo Talk typed stand-in first / mic last.

## Global Constraints

- Spec: [docs/superpowers/specs/2026-08-26-vertex-quick-log-design.md](../specs/2026-08-26-vertex-quick-log-design.md)
- Book tables do not change. Companion: [2026-08-26-phase1-book-design.md](../specs/2026-08-26-phase1-book-design.md)
- Phone never talks to Google AI. No Gemini API key. No `generativelanguage.googleapis.com`.
- Never log transcript, draft JSON, or audio bytes. Log `kind`, byte length, status code only.
- Allowed evening statuses only: `COMPLETED`, `PARTIAL`, `MISSED`, `RESCHEDULED`, `CANCELLED`, `BLOCKED`.
- Invented outcome ids are dropped. Omitted planned ids become `MISSED`.
- Audio: ≤ 2 MiB. MIME `audio/mp4` or `audio/m4a`. Sync STT only.
- `GET /voice/session` is deleted. No ticket types remain.
- Do not destroy Secret Manager `getgrounded-dev-elevenlabs-api-key` in the same apply that unmounts Cloud Run env.
- Do not commit unless William explicitly asks. Plan commit steps wait for that.
- Do not enable Agent Registry, Compute Engine, Notebooks, or Model Armor.
- Pin model config name `VERTEX_MODEL`. Default string `gemini-2.5-flash`.
- Project `get-ground-448ca`, location `us-central1`.
- Park `voice/agent_configs/` and Chirp mp3 samples. Do not delete them.

## File map

| File | Job |
|---|---|
| `api/GetGrounded.Application/Voice/ISpeechToText.cs` | Hear port |
| `api/GetGrounded.Application/Voice/HearTypes.cs` | `HearClip`, `HearResult` |
| `api/GetGrounded.Application/Voice/ILanguageModel.cs` | JSON string from a prompt |
| `api/GetGrounded.Application/Voice/IDayInterpreter.cs` | Transcript → drafts |
| `api/GetGrounded.Application/Voice/Drafts.cs` | `MorningDraft`, `EveningDraft` |
| `api/GetGrounded.Application/Voice/DayInterpreter.cs` | Parse + validate + MISSED leftovers |
| `api/GetGrounded.Application/Voice/IAudioStore.cs` | Persist clip, return `storage_key` |
| `api/GetGrounded.Application/Voice/ClipService.cs` | Orchestrate hear → interpret → book |
| `api/GetGrounded.Api/Controllers/VoiceController.cs` | `POST /voice/clips` only |
| `api/GetGrounded.Infrastructure/Voice/VertexSpeechToText.cs` | Live STT (Task 7) |
| `api/GetGrounded.Infrastructure/Voice/VertexLanguageModel.cs` | Live Gemini (Task 7) |
| `api/GetGrounded.Infrastructure/Voice/MemoryAudioStore.cs` | Dev/test store until R2 adapter |
| `api/GetGrounded.Tests/DayInterpreterTests.cs` | Parser + leftover rules |
| `api/GetGrounded.Tests/ClipTests.cs` | HTTP clips with stubs |
| `mobile/src/app/(app)/talk.tsx` | Always `TalkLog`, no WebRTC gate |

Delete ticket files listed in Task 1.

---

### Task 1: Delete the ElevenLabs ticket

**Files:**
- Test: `api/GetGrounded.Tests/VoiceTests.cs`
- Delete: `api/GetGrounded.Infrastructure/Voice/ElevenLabsVoiceSessions.cs`
- Delete: `api/GetGrounded.Application/Voice/IVoiceSessionIssuer.cs`
- Delete: `api/GetGrounded.Application/Voice/VoiceSession.cs`
- Delete: `api/GetGrounded.Application/Voice/VoiceIssue.cs`
- Delete: `api/GetGrounded.Api/Controllers/VoiceController.cs` (recreate empty-route-free in Task 5)
- Modify: `api/GetGrounded.Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: nothing
- Produces: no `IVoiceSessionIssuer`. `GET /voice/session` is 404.

- [ ] **Step 1: Write the failing test**

Replace `api/GetGrounded.Tests/VoiceTests.cs` with:

```csharp
using System.Net;
using GetGrounded.Application.Auth;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class VoiceTests
{
    [Fact]
    public async Task Session_route_is_gone()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ITokenVerifier, StubVerifier>();
                services.AddSingleton<IUserStore, LivingUserStore>();
            });
        });
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/voice/session");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~VoiceTests.Session_route_is_gone`

Expected: FAIL. Status is `Unauthorized` (401) or `ServiceUnavailable` (503), not `NotFound` (404).

- [ ] **Step 3: Delete the ticket path**

Delete the five ticket files listed above.

`api/GetGrounded.Infrastructure/DependencyInjection.cs` becomes:

```csharp
using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Health;
using GetGrounded.Application.Time;
using GetGrounded.Infrastructure.Auth;
using GetGrounded.Infrastructure.Book;
using GetGrounded.Infrastructure.Health;
using GetGrounded.Infrastructure.Time;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ITokenVerifier, FirebaseTokenVerifier>();
        services.AddSingleton<IUserStore, PostgresUserStore>();
        services.AddSingleton<IBookStore, PostgresBookStore>();
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IDatabasePing, NpgsqlDatabasePing>();
        return services;
    }
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj`

Expected: PASS. Old ticket facts are gone. Book tests still pass. `Session_route_is_gone` is 404.

- [ ] **Step 5: Commit only if William asked**

```bash
git add api/GetGrounded.Tests/VoiceTests.cs \
  api/GetGrounded.Infrastructure/DependencyInjection.cs
git rm api/GetGrounded.Infrastructure/Voice/ElevenLabsVoiceSessions.cs \
  api/GetGrounded.Application/Voice/IVoiceSessionIssuer.cs \
  api/GetGrounded.Application/Voice/VoiceSession.cs \
  api/GetGrounded.Application/Voice/VoiceIssue.cs \
  api/GetGrounded.Api/Controllers/VoiceController.cs
```

Message: `Remove the ElevenLabs voice ticket.`

---

### Task 2: Typed Talk for everyone

**Files:**
- Modify: `mobile/src/app/(app)/talk.tsx`
- Modify: `mobile/src/store/api.ts`
- Delete: `mobile/src/components/talk/talk-agent.tsx`
- Modify: `mobile/package.json`
- Modify: `mobile/app.json`
- Modify: `mobile/src/app/(app)/talk.tsx` subtitle copy

**Interfaces:**
- Consumes: existing `TalkLog`, `usePlanMorningMutation`, `useReflectEveningMutation`
- Produces: Talk always renders `TalkLog`. No `useStartVoiceSessionMutation`.

- [ ] **Step 1: Write the failing check**

There is no Jest suite for Talk. Fail by making `talk.tsx` still contain `WebRTCModule` until this task removes it. Add this assertion as the first line of the task work in a comment-free grep the implementer must run **before** edits:

Run: `rg "WebRTCModule|TalkAgent|startVoiceSession|@elevenlabs" mobile/src`

Expected now: matches in `talk.tsx`, `talk-agent.tsx`, `api.ts`.

The “test” for this task is: after the edits, that same command prints nothing, and `npx tsc --noEmit` in `mobile/` exits 0.

- [ ] **Step 2: Confirm the gate still exists**

Expected: `talk.tsx` still has `hasWebRtcNative` and `TalkAgent`.

- [ ] **Step 3: Point Talk at TalkLog only**

Replace `mobile/src/app/(app)/talk.tsx` with:

```tsx
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TalkLog } from '@/components/talk/talk-log';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + Spacing.five, paddingBottom: Spacing.five },
        ]}>
        <ThemedText style={styles.title}>Talk</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Type the day for now. Each line is a commitment. Wins start with win:.
        </ThemedText>
        <TalkLog />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});
```

Delete `mobile/src/components/talk/talk-agent.tsx`.

In `mobile/src/store/api.ts` remove the `startVoiceSession` endpoint and `useStartVoiceSessionMutation` from the export list. Leave `planMorning` and `reflectEvening`.

In `mobile/package.json` remove these dependency keys: `@elevenlabs/react-native`, `@livekit/react-native`, `@livekit/react-native-expo-plugin`, `@livekit/react-native-webrtc`, `@config-plugins/react-native-webrtc`, `livekit-client`.

In `mobile/app.json` `expo.plugins`, remove `"@livekit/react-native-expo-plugin"` and `"@config-plugins/react-native-webrtc"`. Keep `RECORD_AUDIO` and the iOS mic string.

Then from `mobile/`: `npm install` so `package-lock.json` matches.

- [ ] **Step 4: Run the checks**

Run: `rg "WebRTCModule|TalkAgent|startVoiceSession|@elevenlabs" mobile/src`

Expected: no matches.

Run: `cd mobile && npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit only if William asked**

Message: `Drop the ElevenLabs Talk agent.`

---

### Task 3: DayInterpreter (JSON → book drafts)

**Files:**
- Create: `api/GetGrounded.Application/Voice/HearTypes.cs`
- Create: `api/GetGrounded.Application/Voice/ILanguageModel.cs`
- Create: `api/GetGrounded.Application/Voice/IDayInterpreter.cs`
- Create: `api/GetGrounded.Application/Voice/Drafts.cs`
- Create: `api/GetGrounded.Application/Voice/DayInterpreter.cs`
- Test: `api/GetGrounded.Tests/DayInterpreterTests.cs`

**Interfaces:**
- Consumes: `PlannedItem`, `OutcomeItem`, `WinItem`, `CommitmentRecord` from `GetGrounded.Application.Book`
- Produces:

```csharp
public sealed record HearClip(byte[] Bytes, string ContentType);
public sealed record HearResult(string Transcript, float? Confidence);

public interface ILanguageModel
{
    Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken);
}

public sealed record MorningDraft(IReadOnlyList<PlannedItem> Commitments);
public sealed record EveningDraft(IReadOnlyList<OutcomeItem> Outcomes, IReadOnlyList<WinItem> Wins);

public interface IDayInterpreter
{
    Task<MorningDraft> ReadMorningAsync(string transcript, CancellationToken cancellationToken);
    Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<CommitmentRecord> planned,
        CancellationToken cancellationToken);
}

public sealed class InterpretException : Exception
{
    public InterpretException(string message) : base(message) { }
}
```

- [ ] **Step 1: Write the failing tests**

Create `api/GetGrounded.Tests/DayInterpreterTests.cs`:

```csharp
using GetGrounded.Application.Book;
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests;

public class DayInterpreterTests
{
    [Fact]
    public async Task Morning_json_becomes_planned_items()
    {
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Read","plannedDurationMinutes":20,"confidence":0.9}]}""");
        var interpreter = new DayInterpreter(model);

        var draft = await interpreter.ReadMorningAsync("I will read 20 minutes");

        Assert.Single(draft.Commitments);
        Assert.Equal("Read", draft.Commitments[0].Title);
        Assert.Equal(20, draft.Commitments[0].PlannedDurationMinutes);
    }

    [Fact]
    public async Task Morning_garbage_json_fails_interpret()
    {
        var interpreter = new DayInterpreter(new StubLanguageModel("not-json"));

        await Assert.ThrowsAsync<InterpretException>(() =>
            interpreter.ReadMorningAsync("hello"));
    }

    [Fact]
    public async Task Evening_drops_unknown_ids_and_marks_omitted_planned_missed()
    {
        var plannedId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var otherId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var model = new StubLanguageModel(
            """{"outcomes":[{"id":"99999999-9999-9999-9999-999999999999","status":"COMPLETED"}],"wins":[{"title":"Cleaned"}]}""");
        var interpreter = new DayInterpreter(model);
        var planned = new[]
        {
            new CommitmentRecord(plannedId, "Gym", "PLANNED", null, null),
            new CommitmentRecord(otherId, "Read", "PLANNED", 20, null)
        };

        var draft = await interpreter.ReadEveningAsync("gym later", planned);

        Assert.Equal(2, draft.Outcomes.Count);
        Assert.Contains(draft.Outcomes, o => o.Id == plannedId && o.Status == "MISSED");
        Assert.Contains(draft.Outcomes, o => o.Id == otherId && o.Status == "MISSED");
        Assert.DoesNotContain(draft.Outcomes, o => o.Id == Guid.Parse("99999999-9999-9999-9999-999999999999"));
        Assert.Equal("Cleaned", draft.Wins[0].Title);
    }

    private sealed class StubLanguageModel(string json) : ILanguageModel
    {
        public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
        {
            return Task.FromResult(json);
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~DayInterpreterTests`

Expected: FAIL compile. `DayInterpreter` / `ILanguageModel` / `InterpretException` do not exist.

- [ ] **Step 3: Write minimal implementation**

`HearTypes.cs` — `HearClip`, `HearResult` as in Interfaces (needed by later tasks; empty records are fine).

`ILanguageModel.cs`, `Drafts.cs`, `IDayInterpreter.cs` — as in Interfaces.

`DayInterpreter.cs`:

```csharp
using System.Text.Json;
using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed class DayInterpreter(ILanguageModel model) : IDayInterpreter
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly HashSet<string> Statuses =
    [
        "COMPLETED", "PARTIAL", "MISSED", "RESCHEDULED", "CANCELLED", "BLOCKED"
    ];

    public async Task<MorningDraft> ReadMorningAsync(string transcript, CancellationToken cancellationToken)
    {
        var raw = await model.CompleteJsonAsync(MorningSystem, transcript, cancellationToken);
        MorningPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<MorningPayload>(raw, Json)
                ?? throw new InterpretException("Empty extract.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable extract.");
        }

        var items = (payload.Commitments ?? [])
            .Select(row => new PlannedItem(row.Title ?? "", row.PlannedDurationMinutes))
            .Where(item => item.Title.Trim().Length > 0)
            .ToList();
        return new MorningDraft(items);
    }

    public async Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<CommitmentRecord> planned,
        CancellationToken cancellationToken)
    {
        var raw = await model.CompleteJsonAsync(EveningSystem(planned), transcript, cancellationToken);
        EveningPayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<EveningPayload>(raw, Json)
                ?? throw new InterpretException("Empty extract.");
        }
        catch (JsonException)
        {
            throw new InterpretException("Unusable extract.");
        }

        var known = planned.Select(item => item.Id).ToHashSet();
        var seen = new HashSet<Guid>();
        var outcomes = new List<OutcomeItem>();
        foreach (var row in payload.Outcomes ?? [])
        {
            if (!Guid.TryParse(row.Id, out var id) || !known.Contains(id))
            {
                continue;
            }

            if (row.Status is null || !Statuses.Contains(row.Status))
            {
                continue;
            }

            seen.Add(id);
            outcomes.Add(new OutcomeItem(id, row.Status, row.ActualDurationMinutes, row.Reason));
        }

        foreach (var item in planned)
        {
            if (!seen.Contains(item.Id))
            {
                outcomes.Add(new OutcomeItem(item.Id, "MISSED"));
            }
        }

        var wins = (payload.Wins ?? [])
            .Select(row => new WinItem(row.Title ?? ""))
            .Where(win => win.Title.Trim().Length > 0)
            .ToList();
        return new EveningDraft(outcomes, wins);
    }

    private const string MorningSystem =
        "Return JSON only: {\"commitments\":[{\"title\":\"\",\"plannedDurationMinutes\":null,\"confidence\":0}]}";

    private static string EveningSystem(IReadOnlyList<CommitmentRecord> planned)
    {
        var ids = string.Join(",", planned.Select(item => item.Id));
        return $"Return JSON only. Outcome ids must be from: {ids}. Statuses: COMPLETED,PARTIAL,MISSED,RESCHEDULED,CANCELLED,BLOCKED. {{\"outcomes\":[],\"wins\":[]}}";
    }

    private sealed record MorningPayload(IReadOnlyList<MorningRow>? Commitments);
    private sealed record MorningRow(string? Title, int? PlannedDurationMinutes, float? Confidence);
    private sealed record EveningPayload(IReadOnlyList<EveningRow>? Outcomes, IReadOnlyList<WinRow>? Wins);
    private sealed record EveningRow(string? Id, string? Status, int? ActualDurationMinutes, string? Reason);
    private sealed record WinRow(string? Title);
}

public sealed class InterpretException : Exception
{
    public InterpretException(string message) : base(message) { }
}
```

Register in `api/GetGrounded.Application/DependencyInjection.cs`:

```csharp
services.AddSingleton<IDayInterpreter, DayInterpreter>();
```

Do **not** register a live `ILanguageModel` yet. Tests construct `DayInterpreter` directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~DayInterpreterTests`

Expected: PASS (3 tests).

- [ ] **Step 5: Commit only if William asked**

Message: `Extract morning and evening drafts from model JSON.`

---

### Task 4: ClipService books a stubbed morning clip

**Files:**
- Create: `api/GetGrounded.Application/Voice/ISpeechToText.cs`
- Create: `api/GetGrounded.Application/Voice/IAudioStore.cs`
- Create: `api/GetGrounded.Application/Voice/ClipService.cs`
- Create: `api/GetGrounded.Application/Voice/ClipExceptions.cs`
- Create: `api/GetGrounded.Api/Controllers/VoiceController.cs`
- Create: `api/GetGrounded.Tests/Fakes/VoiceFakes.cs`
- Test: `api/GetGrounded.Tests/ClipTests.cs`
- Modify: `api/GetGrounded.Application/DependencyInjection.cs`

**Interfaces:**
- Consumes: `DayInterpreter`, `BookService`, `HearClip`, `HearResult`, `MorningDraft`, `EveningDraft`
- Produces:

```csharp
public interface ISpeechToText
{
    Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken);
}

public interface IAudioStore
{
    Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken);
}

public sealed class EmptySpeechException : Exception;
public sealed class SpeechUnavailableException : Exception;
public sealed class ClipTooLargeException : Exception;

public sealed class ClipService
{
    public Task<DeskRecord> CaptureAsync(
        Guid userId,
        string kind,
        string timezone,
        HearClip clip,
        CancellationToken cancellationToken);
}
```

`kind` must be `MORNING_PLAN` or `EVENING_REFLECTION`. Audio over 2 * 1024 * 1024 bytes throws `ClipTooLargeException`. Empty transcript throws `EmptySpeechException`. `InterpretException` bubbles. Speech port throws `SpeechUnavailableException` when the vendor is down.

- [ ] **Step 1: Write the failing HTTP test**

`api/GetGrounded.Tests/ClipTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;
using GetGrounded.Application.Voice;
using GetGrounded.Tests.Fakes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GetGrounded.Tests;

public class ClipTests
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public async Task Morning_clip_calls_plan_once_and_returns_the_desk()
    {
        var speech = new StubSpeechToText("Gym at 7 and read.");
        var model = new StubLanguageModel(
            """{"commitments":[{"title":"Gym"},{"title":"Read"}]}""");
        using var factory = CreateFactory(speech, model);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("MORNING_PLAN"), "kind");
        form.Add(new StringContent("UTC"), "timezone");
        form.Add(new ByteArrayContent([1, 2, 3, 4]) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } }, "audio", "clip.m4a");

        var response = await client.PostAsync("/voice/clips", form);
        var desk = await response.Content.ReadFromJsonAsync<DeskBody>(Json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(desk);
        Assert.Equal(1, desk.StreakDays);
        Assert.Equal(2, desk.Today!.Commitments.Count);
        Assert.Equal("Gym", desk.Today.Commitments[0].Title);
        Assert.Equal("Read", desk.Today.Commitments[1].Title);
        Assert.Equal(1, speech.Calls);
    }

    private static WebApplicationFactory<Program> CreateFactory(ISpeechToText speech, ILanguageModel model)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ITokenVerifier, StubVerifier>();
                services.AddSingleton<IUserStore, LivingUserStore>();
                services.AddSingleton<IBookStore, MemoryBookStore>();
                services.AddSingleton<IClock>(_ => new TestClock(DateTimeOffset.Parse("2026-08-26T12:00:00Z")));
                services.AddSingleton(speech);
                services.AddSingleton(model);
                services.AddSingleton<IAudioStore, MemoryAudioStore>();
                services.AddSingleton<IDayInterpreter, DayInterpreter>();
                services.AddSingleton<ClipService>();
            });
        });
    }

    private sealed record DeskBody(int StreakDays, DayBody? Today);
    private sealed record DayBody(IReadOnlyList<CommitmentBody> Commitments);
    private sealed record CommitmentBody(Guid Id, string Title, string Status);
}
```

`api/GetGrounded.Tests/Fakes/VoiceFakes.cs`:

```csharp
using GetGrounded.Application.Voice;

namespace GetGrounded.Tests.Fakes;

public sealed class StubSpeechToText(string transcript) : ISpeechToText
{
    public int Calls { get; private set; }

    public Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(new HearResult(transcript, 0.9f));
    }
}

public sealed class StubLanguageModel(string json) : ILanguageModel
{
    public Task<string> CompleteJsonAsync(string system, string user, CancellationToken cancellationToken)
    {
        return Task.FromResult(json);
    }
}

public sealed class MemoryAudioStore : IAudioStore
{
    public Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken)
    {
        return Task.FromResult($"memory/{userId}/{kind}");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~ClipTests.Morning_clip`

Expected: FAIL compile or 404. `POST /voice/clips` does not exist.

- [ ] **Step 3: Write minimal implementation**

Ports + `ClipExceptions.cs` as in Interfaces.

`MemoryAudioStore` also lives in `api/GetGrounded.Infrastructure/Voice/MemoryAudioStore.cs` (same body as the test fake is fine; tests may keep their own).

`ClipService.cs`:

```csharp
using GetGrounded.Application.Book;

namespace GetGrounded.Application.Voice;

public sealed class ClipService(
    IAudioStore audio,
    ISpeechToText speech,
    IDayInterpreter interpreter,
    BookService book)
{
    public const int MaxBytes = 2 * 1024 * 1024;

    public async Task<DeskRecord> CaptureAsync(
        Guid userId,
        string kind,
        string timezone,
        HearClip clip,
        CancellationToken cancellationToken)
    {
        if (kind is not ("MORNING_PLAN" or "EVENING_REFLECTION"))
        {
            throw new ArgumentException("Unknown clip kind.", nameof(kind));
        }

        if (clip.Bytes.Length == 0)
        {
            throw new ArgumentException("Audio is required.", nameof(clip));
        }

        if (clip.Bytes.Length > MaxBytes)
        {
            throw new ClipTooLargeException();
        }

        if (clip.ContentType is not ("audio/mp4" or "audio/m4a"))
        {
            throw new ArgumentException("Unsupported audio type.", nameof(clip));
        }

        await audio.PutAsync(userId, kind, clip, cancellationToken);
        var heard = await speech.HearAsync(clip, cancellationToken);
        if (string.IsNullOrWhiteSpace(heard.Transcript))
        {
            throw new EmptySpeechException();
        }

        if (kind == "MORNING_PLAN")
        {
            var draft = await interpreter.ReadMorningAsync(heard.Transcript, cancellationToken);
            await book.PlanMorningAsync(userId, timezone, heard.Transcript, draft.Commitments, cancellationToken);
        }
        else
        {
            var desk = await book.GetDeskAsync(userId, timezone, cancellationToken);
            var planned = desk.Today?.Commitments ?? [];
            var draft = await interpreter.ReadEveningAsync(heard.Transcript, planned, cancellationToken);
            await book.ReflectEveningAsync(userId, timezone, heard.Transcript, draft.Outcomes, draft.Wins, cancellationToken);
        }

        return await book.GetDeskAsync(userId, timezone, cancellationToken);
    }
}
```

`VoiceController.cs`:

```csharp
using GetGrounded.Api.Http;
using GetGrounded.Application.Auth;
using GetGrounded.Application.Voice;
using Microsoft.AspNetCore.Mvc;

namespace GetGrounded.Api.Controllers;

[ApiController]
[Route("voice")]
public sealed class VoiceController(AuthService auth, ClipService clips) : ControllerBase
{
    [HttpPost("clips")]
    public async Task<IActionResult> Clips(CancellationToken cancellationToken)
    {
        var token = Bearer.Read(Request);
        if (token is null)
        {
            return Unauthorized();
        }

        var user = await auth.IdentifyAsync(token, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var kind = Request.Form["kind"].ToString();
        var timezone = Request.Form["timezone"].ToString();
        var file = Request.Form.Files["audio"];
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "audio" });
        }

        await using var stream = file.OpenReadStream();
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, cancellationToken);
        var clip = new HearClip(memory.ToArray(), file.ContentType ?? "");

        try
        {
            return Ok(await clips.CaptureAsync(user.Id, kind, timezone, clip, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ClipTooLargeException)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new { error = "too_large" });
        }
        catch (EmptySpeechException)
        {
            return UnprocessableEntity(new { error = "no_speech" });
        }
        catch (InterpretException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "extract" });
        }
        catch (SpeechUnavailableException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "speech" });
        }
    }
}
```

Register `ClipService` in Application DI. Do not register live speech yet.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~ClipTests`

Expected: PASS.

Also run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj`

Expected: all green, including `Session_route_is_gone`.

- [ ] **Step 5: Commit only if William asked**

Message: `Book a morning clip through stubbed speech and extract.`

---

### Task 5: Clip error statuses

**Files:**
- Test: `api/GetGrounded.Tests/ClipTests.cs` (add facts)
- Modify: `api/GetGrounded.Tests/Fakes/VoiceFakes.cs` if needed

**Interfaces:**
- Consumes: `ClipService` exceptions from Task 4
- Produces: 413 / 422 / 502 / 401 as specified

- [ ] **Step 1: Write the failing tests**

Append to `ClipTests`:

```csharp
[Fact]
public async Task Clip_without_token_is_unauthorized()
{
    using var factory = CreateFactory(
        new StubSpeechToText("x"),
        new StubLanguageModel("""{"commitments":[]}"""));
    using var client = factory.CreateClient();
    using var form = new MultipartFormDataContent();
    form.Add(new StringContent("MORNING_PLAN"), "kind");
    form.Add(new StringContent("UTC"), "timezone");
    form.Add(new ByteArrayContent([1]) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } }, "audio", "clip.m4a");

    var response = await client.PostAsync("/voice/clips", form);

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}

[Fact]
public async Task Clip_over_two_megabytes_is_too_large()
{
    using var factory = CreateFactory(
        new StubSpeechToText("x"),
        new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
    using var client = factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
    using var form = new MultipartFormDataContent();
    form.Add(new StringContent("MORNING_PLAN"), "kind");
    form.Add(new StringContent("UTC"), "timezone");
    form.Add(new ByteArrayContent(new byte[ClipService.MaxBytes + 1]) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } }, "audio", "clip.m4a");

    var response = await client.PostAsync("/voice/clips", form);

    Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
}

[Fact]
public async Task Empty_transcript_is_unprocessable()
{
    using var factory = CreateFactory(
        new StubSpeechToText("  "),
        new StubLanguageModel("""{"commitments":[{"title":"Gym"}]}"""));
    using var client = factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
    using var form = new MultipartFormDataContent();
    form.Add(new StringContent("MORNING_PLAN"), "kind");
    form.Add(new StringContent("UTC"), "timezone");
    form.Add(new ByteArrayContent([1, 2]) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } }, "audio", "clip.m4a");

    var response = await client.PostAsync("/voice/clips", form);

    Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
}

[Fact]
public async Task Garbage_extract_is_bad_gateway()
{
    using var factory = CreateFactory(
        new StubSpeechToText("hello"),
        new StubLanguageModel("not-json"));
    using var client = factory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
    using var form = new MultipartFormDataContent();
    form.Add(new StringContent("MORNING_PLAN"), "kind");
    form.Add(new StringContent("UTC"), "timezone");
    form.Add(new ByteArrayContent([1, 2]) { Headers = { ContentType = new MediaTypeHeaderValue("audio/mp4") } }, "audio", "clip.m4a");

    var response = await client.PostAsync("/voice/clips", form);

    Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj --filter FullyQualifiedName~ClipTests`

Expected: FAIL on any mapping still missing (if Task 4 already mapped these, this step should fail because the new facts are not compiled yet — after adding them, if Task 4 mapped correctly they may pass immediately; if a fact passes on first run, keep it only when Task 4 already implemented that branch. If all four pass immediately, do not add more production code.)

- [ ] **Step 3: Map any missing status**

Only add controller `catch` arms that a failing fact requires. Do not add rate-limit in this task.

- [ ] **Step 4: Run full suite**

Run: `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj`

Expected: PASS.

- [ ] **Step 5: Commit only if William asked**

Message: `Map clip failures to 413, 422, and 502.`

---

### Task 6: Unmount ElevenLabs from Cloud Run (keep the secret)

**Files:**
- Modify: `infra/terraform/modules/cloud_run/main.tf`
- Modify: `infra/terraform/modules/cloud_run/variables.tf`
- Modify: `infra/terraform/environments/dev/main.tf`
- Modify: `infra/terraform/README.md`
- Modify: `infra/terraform/modules/cloud_run/main.tf` timeout `30s` → `60s`
- Add env on the container: `GOOGLE_CLOUD_PROJECT=get-ground-448ca`, `GOOGLE_CLOUD_LOCATION=us-central1`, `VERTEX_MODEL=gemini-2.5-flash`

**Interfaces:**
- Consumes: existing `module.vertex`
- Produces: Cloud Run no longer has `ELEVENLABS_*`. Secret resource stays.

- [ ] **Step 1: Write the failing check**

Run: `rg "ELEVENLABS" infra/terraform/modules/cloud_run infra/terraform/environments/dev`

Expected now: matches. After this task: no matches in those two trees. Secret module may still mention ElevenLabs — that is required.

- [ ] **Step 2: Confirm env still mounted**

Expected: `cloud_run/main.tf` still has `ELEVENLABS_AGENT_ID` and `ELEVENLABS_API_KEY`.

- [ ] **Step 3: Remove Cloud Run bindings only**

Delete the two `env` blocks for ElevenLabs from `cloud_run/main.tf`.

Delete `elevenlabs_api_key_secret_id` and `elevenlabs_agent_id` from `cloud_run/variables.tf`.

In `environments/dev/main.tf` `module "cloud_run"` remove:

```hcl
elevenlabs_api_key_secret_id  = module.secret.elevenlabs_api_key_secret_id
elevenlabs_agent_id           = "agent_1601m0y7h0mxer8rpc06xrvcpn69"
```

Set `timeout = "60s"`.

Add:

```hcl
env {
  name  = "GOOGLE_CLOUD_PROJECT"
  value = "get-ground-448ca"
}

env {
  name  = "GOOGLE_CLOUD_LOCATION"
  value = "us-central1"
}

env {
  name  = "VERTEX_MODEL"
  value = "gemini-2.5-flash"
}
```

Do **not** delete `google_secret_manager_secret.elevenlabs_api_key` or its IAM member.

Update README `secret` row: database URL only for the live mount; ElevenLabs secret still exists, unused.

Do not `terraform apply` unless William asks. Last apply died on `ACCESS_TOKEN_TYPE_UNSUPPORTED`. Prefer a later targeted apply, or `gcloud run services update` only if he asks to ship.

- [ ] **Step 4: Grep again**

Run: `rg "ELEVENLABS" infra/terraform/modules/cloud_run infra/terraform/environments/dev`

Expected: no matches.

- [ ] **Step 5: Commit only if William asked**

Message: `Stop mounting ElevenLabs on Cloud Run.`

---

### Task 7: Live Vertex adapters (after HTTP is green)

**Files:**
- Create: `api/GetGrounded.Infrastructure/Voice/VertexSpeechToText.cs`
- Create: `api/GetGrounded.Infrastructure/Voice/VertexLanguageModel.cs`
- Create: `api/GetGrounded.Infrastructure/Voice/MemoryAudioStore.cs`
- Modify: `api/GetGrounded.Infrastructure/DependencyInjection.cs`
- Modify: `api/GetGrounded.Infrastructure/GetGrounded.Infrastructure.csproj` (add Google Cloud client packages only if a compile requires them; prefer raw `HttpClient` + ADC)

**Interfaces:**
- Consumes: `ISpeechToText`, `ILanguageModel`, `IAudioStore`
- Produces: production registrations. Tests still override with stubs.

Use REST + ADC, not Agent Studio.

Speech: `POST https://speech.googleapis.com/v1/speech:recognize` with base64 `HearClip.Bytes`, `languageCode` `en-US`. Empty results → `HearResult("", null)`. HTTP 5xx → `SpeechUnavailableException`.

Gemini: `POST https://us-central1-aiplatform.googleapis.com/v1/projects/get-ground-448ca/locations/us-central1/publishers/google/models/{VERTEX_MODEL}:generateContent` with `generationConfig.responseMimeType = application/json`. Non-JSON or 5xx → throw `InterpretException` or let `DayInterpreter` throw on parse; 5xx → `SpeechUnavailableException` is wrong; throw a new `ModelUnavailableException` mapped to 503 in the controller:

```csharp
public sealed class ModelUnavailableException : Exception;
```

Add one ClipTests fact that a model 503-style fake returns 503 — only if you add `FailingLanguageModel` that throws `ModelUnavailableException`.

Do not call live Google from xUnit.

- [ ] **Step 1: Failing test for model down → 503**

```csharp
[Fact]
public async Task Model_down_is_unavailable()
{
    using var factory = CreateFactory(
        new StubSpeechToText("hello"),
        new DownLanguageModel());
    // DownLanguageModel.CompleteJsonAsync throws ModelUnavailableException
    // POST /voice/clips → 503
}
```

- [ ] **Step 2: Watch it fail** (no mapping yet → 500)

- [ ] **Step 3: Catch `ModelUnavailableException` → 503.** Implement the two HTTP clients with ADC (`Google.Apis.Auth.OAuth2.GoogleCredential.GetApplicationDefaultAsync` or `HttpClient` default handler on Cloud Run). Register them in Infrastructure DI plus `MemoryAudioStore` as `IAudioStore` until an R2 adapter exists.

- [ ] **Step 4:** `dotnet test api/GetGrounded.Tests/GetGrounded.Tests.csproj` PASS.

- [ ] **Step 5: Commit only if William asked**

Message: `Call Speech-to-Text and Gemini from Cloud Run.`

---

### Task 8: Docs point at Vertex

**Files:**
- Modify: `docs/FEATURE-CATALOG.md`
- Modify: `docs/FEATURES.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-26-phase1-book-design.md` line for `conversation_id`

**Interfaces:** none.

- [ ] **Step 1:** `rg -n "ElevenLabs|OpenAI|Scribe" docs README.md` — matches today.

- [ ] **Step 2:** Confirm catalog still names ElevenLabs as the voice path.

- [ ] **Step 3:** Replace those product-path sentences with Vertex Speech + Gemini + `.NET` book. Keep historical “do not use ElevenLabs as the database” as a negative. `conversation_id` note: unused, null. Talk row in FEATURES: typed + `POST /voice/clips`, not mint a ticket.

- [ ] **Step 4:** `rg "ElevenLabs Quick Log|OpenAI" docs/FEATURE-CATALOG.md docs/FEATURES.md` — no matches.

- [ ] **Step 5: Commit only if William asked**

Message: `Document Vertex as the only AI path.`

---

## Out of this plan

- R2 upload adapter (MemoryAudioStore is enough to book; spec allows delayed delete)
- Mobile mic / `expo-av`
- Rate limit 20/hour
- Destroy ElevenLabs Secret Manager secret
- Chirp TTS, Gemini Live, midday, evening notify
- Agent Registry / Compute / Notebooks APIs
- `terraform apply` (token bug) and git commit/push

## Spec coverage

| Spec section | Task |
|---|---|
| Nuke ticket + files | 1, 2, 6 |
| `ISpeechToText` / `IDayInterpreter` | 3, 4 |
| Morning/evening JSON + MISSED leftovers | 3 |
| `POST /voice/clips` + statuses | 4, 5, 7 |
| ADC / no API key | 7 |
| Cloud Run env + 60s | 6 |
| Catalog copy | 8 |
| Phone never talks to Google | 2, 4 |
| R2 required key | 4 `IAudioStore` (memory key) |
| Mic UI | out (typed Talk first) |

## Type names (do not drift)

`HearClip`, `HearResult`, `ISpeechToText`, `ILanguageModel`, `IDayInterpreter`, `MorningDraft`, `EveningDraft`, `DayInterpreter`, `InterpretException`, `IAudioStore`, `ClipService`, `ClipTooLargeException`, `EmptySpeechException`, `SpeechUnavailableException`, `ModelUnavailableException`, `CommitmentRecord` (not `DeskCommitment`).
