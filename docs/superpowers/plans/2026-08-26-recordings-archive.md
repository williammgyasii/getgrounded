# Recordings Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Keep each saved take in R2 and play it from ⋯ Recordings, with the transcript under the play button.

**Architecture:** Hear writes the m4a to R2 and returns `storageKey`. Morning save writes that key onto `voice_sessions`. The phone never talks to R2. `GET /voice/clips/{id}` streams the file with the same Bearer as the book. Tests use an in-memory store that actually keeps bytes.

**Tech Stack:** ASP.NET test host, `IAudioStore` (memory in tests, R2 via S3 API in prod), Postgres `voice_sessions.storage_key`, Expo `expo-audio` after a Bearer download.

## Global Constraints

- Files live in R2 on Cloud Run. Memory store is tests / local without keys only.
- Phone never holds R2 keys.
- Never log the transcript.
- Do not commit or push unless William asks.
- Old takes and typed saves stay words-only (`playable: false`).
- Evening recordings, global archive, signed URLs: out of scope.

---

### Task 1: Audio store that can put, get, and delete

**Files:**
- Modify: `api/GetGrounded.Application/Voice/IAudioStore.cs`
- Modify: `api/GetGrounded.Infrastructure/Voice/MemoryAudioStore.cs`
- Modify: `api/GetGrounded.Tests/Fakes/VoiceFakes.cs`
- Create: `api/GetGrounded.Tests/AudioStoreTests.cs`

**Interfaces:**
- Produces: `IAudioStore.PutAsync(Guid userId, string kind, HearClip clip, CancellationToken) → string`
- Produces: `IAudioStore.GetAsync(string key, CancellationToken) → StoredClip?`
- Produces: `IAudioStore.DeleteAsync(string key, CancellationToken) → Task`
- Produces: `StoredClip(byte[] Bytes, string ContentType)`

- [ ] **Step 1: Write the failing store test**

```csharp
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
```

- [ ] **Step 2: Run and watch fail**

Run: `dotnet test --filter AudioStore --nologo`

Expected: fail because `GetAsync` / `StoredClip` do not exist.

- [ ] **Step 3: Minimal store**

Add to `IAudioStore` / `HearTypes.cs`:

```csharp
public sealed record StoredClip(byte[] Bytes, string ContentType);

public interface IAudioStore
{
    Task<string> PutAsync(Guid userId, string kind, HearClip clip, CancellationToken cancellationToken);
    Task<StoredClip?> GetAsync(string key, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}
```

Both `MemoryAudioStore` classes (infra + test fake) keep a `ConcurrentDictionary<string, StoredClip>`. Key: `{userId}/{kind}/{guid:N}.m4a`.

- [ ] **Step 4: Tests green**

Run: `dotnet test --filter AudioStore --nologo`

Expected: PASS

---

### Task 2: Hear returns storageKey

**Files:**
- Modify: `api/GetGrounded.Application/Voice/HearTypes.cs` (`HearResult`)
- Modify: `api/GetGrounded.Application/Voice/ClipService.cs`
- Modify: `api/GetGrounded.Api/Controllers/VoiceController.cs`
- Modify: `api/GetGrounded.Tests/ClipTests.cs` (`HearBody`)
- Modify: `api/GetGrounded.Tests/Fakes/VoiceFakes.cs` (`StubSpeechToText` still returns `HearResult(transcript, 0.9f)` — add `StorageKey: null` or keep record extra field optional)

**Interfaces:**
- Consumes: `IAudioStore.PutAsync`
- Produces: `HearResult(string Transcript, float? Confidence, string? StorageKey = null)`
- Produces: `POST /voice/hear` → `{ transcript, storageKey }`

- [ ] **Step 1: Failing test**

In `ClipTests.Hear_returns_transcript_and_does_not_book`, after hear:

```csharp
Assert.False(string.IsNullOrWhiteSpace(body.StorageKey));
var store = factory.Services.GetRequiredService<IAudioStore>();
var saved = await store.GetAsync(body.StorageKey, CancellationToken.None);
Assert.NotNull(saved);
```

Change `HearBody` to `HearBody(string Transcript, string? StorageKey)`.

- [ ] **Step 2: Run and watch fail**

Run: `dotnet test --filter Hear_returns_transcript --nologo`

Expected: `StorageKey` null or missing.

- [ ] **Step 3: Wire hear**

`ClipService.HearAsync`: `var key = await audio.PutAsync(...)` then `return heard with { StorageKey = key }`.

`VoiceController.Hear`: `return Ok(new { transcript = heard.Transcript, storageKey = heard.StorageKey });`

- [ ] **Step 4: `dotnet test --filter Clip` green**

---

### Task 3: Morning save writes storage_key and playable

**Files:**
- Modify: `api/GetGrounded.Application/Book/BookRecords.cs` (`ClipRecord` + `Playable`)
- Modify: `api/GetGrounded.Application/Book/BookService.cs` `PlanMorningAsync` — add `string? storageKey = null`
- Modify: `api/GetGrounded.Application/Book/IBookStore.cs` `SaveMorningAsync` — add `string? storageKey = null`
- Modify: `api/GetGrounded.Infrastructure/Book/PostgresBookStore.cs` `InsertSessionAsync` + `LoadDayAsync`
- Modify: `api/GetGrounded.Tests/Fakes/MemoryBookStore.cs`
- Modify: `api/GetGrounded.Api/Controllers/DaysController.cs` `MorningRequest`
- Modify: `api/GetGrounded.Tests/DaysTests.cs`, `BookTests.cs`

**Interfaces:**
- Consumes: hear `storageKey`
- Produces: `ClipRecord(..., bool Playable = false)`
- Produces: `POST /days/morning` body `{ ..., storageKey?: string }`
- Produces: day JSON `clips[].playable`

- [ ] **Step 1: Failing tests**

```csharp
[Fact]
public async Task Morning_with_storage_key_is_playable()
{
    var day = await book.PlanMorningAsync(
        Person, "UTC", "Gym.", [new PlannedItem("Gym")], "Gym day", "user/morning/clip.m4a");
    Assert.True(day.Clips[0].Playable);
}

[Fact]
public async Task Morning_without_storage_key_is_not_playable()
{
    var day = await book.PlanMorningAsync(Person, "UTC", "Gym.", [new PlannedItem("Gym")]);
    Assert.False(day.Clips[0].Playable);
}
```

HTTP: post morning with `storageKey`, read `clips[0].playable == true`.

- [ ] **Step 2: Run and watch fail**

Run: `dotnet test --filter playable --nologo`

- [ ] **Step 3: Persist the key**

`InsertSessionAsync` adds column `storage_key`:

```sql
INSERT INTO voice_sessions (id, user_id, day_id, kind, transcript, processing_status, storage_key)
VALUES ($1, $2, $3, $4, $5, 'RECEIVED', $6)
```

`$6` is key or `DBNull`.

`LoadDayAsync`:

```sql
SELECT id, kind, transcript, created_at, storage_key IS NOT NULL
FROM voice_sessions
WHERE user_id = $1 AND day_id = $2
ORDER BY created_at
```

Do not return the raw key on `DayRecord`.

- [ ] **Step 4: `dotnet test --filter "Book|Days"` green**

---

### Task 4: GET /voice/clips/{id} streams this user’s file

**Files:**
- Modify: `api/GetGrounded.Application/Book/IBookStore.cs` — add `GetClipAsync`
- Modify: `PostgresBookStore`, `MemoryBookStore`
- Modify: `ClipService` — `PlayAsync(userId, clipId)`
- Modify: `VoiceController` — `[HttpGet("clips/{clipId:guid}")]`
- Modify: `api/GetGrounded.Tests/ClipTests.cs`

**Interfaces:**
- Produces: `ClipPointer(Guid Id, string? StorageKey)`
- Produces: `IBookStore.GetClipAsync(Guid userId, Guid clipId, CancellationToken) → ClipPointer?`
- Produces: `GET /voice/clips/{id}` → 200 `audio/mp4` bytes, or 404

- [ ] **Step 1: Failing HTTP test**

Hear → morning with that `storageKey` → `GET /voice/clips/{clipId}` with the same token → 200, body equals uploaded bytes.

Wrong user / missing key / unknown id → 404.

No token → 401.

- [ ] **Step 2: Run and watch fail**

Run: `dotnet test --filter clips --nologo`

- [ ] **Step 3: Implement play**

```csharp
public async Task<StoredClip?> PlayAsync(Guid userId, Guid clipId, CancellationToken cancellationToken)
{
    var row = await book.GetClipAsync(userId, clipId, cancellationToken);
    if (row?.StorageKey is null)
    {
        return null;
    }
    return await audio.GetAsync(row.StorageKey, cancellationToken);
}
```

Controller: `File(clip.Bytes, clip.ContentType)` or 404.

- [ ] **Step 4: `dotnet test --filter Clip` green**

---

### Task 5: Delete day also deletes the R2 (or memory) object

**Files:**
- Modify: `BookService.RemoveDayAsync` — load keys, delete rows, then `audio.DeleteAsync` each key (best-effort, swallow store errors)
- Modify: `IBookStore` — `ListClipKeysAsync(userId, dayId)` or return keys from `RemoveDayAsync` before delete
- Test: `BookTests.cs`

- [ ] **Step 1: Failing test** — save with key, remove day, `GetAsync(key)` is null.

- [ ] **Step 2: Implement** — read keys, delete sessions/day, then delete objects.

- [ ] **Step 3: Tests green**

---

### Task 6: R2 store (production files)

**Files:**
- Create: `api/GetGrounded.Infrastructure/Voice/R2AudioStore.cs`
- Modify: `api/GetGrounded.Infrastructure/GetGrounded.Infrastructure.csproj` — `AWSSDK.S3` if not present
- Modify: `api/GetGrounded.Infrastructure/DependencyInjection.cs`
- Create: `api/GetGrounded.Tests/R2AudioStoreTests.cs` (constructor / key shape only; no live R2)

**Interfaces:**
- Consumes: env `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Produces: S3-compatible client at `https://{account}.r2.cloudflarestorage.com`, bucket `R2_BUCKET`
- Key: `{userId:N}/{kind}/{guid:N}.m4a`

- [ ] **Step 1: Register R2 when all four env vars are set; otherwise memory**

```csharp
if (R2AudioStore.IsConfigured(configuration))
{
    services.AddSingleton<IAudioStore, R2AudioStore>();
}
else
{
    services.AddSingleton<IAudioStore, MemoryAudioStore>();
}
```

- [ ] **Step 2: Implement Put/Get/Delete with `PutObject` / `GetObject` / `DeleteObject`. Content-Type from the clip. Get returns null on 404.**

- [ ] **Step 3: Cloud Run (direct, Actions still down)**

Set secrets if missing, then:

```bash
gcloud run services update getgrounded-dev-api \
  --project=get-ground-448ca \
  --region=us-central1 \
  --update-secrets=R2_ACCESS_KEY_ID=r2-access-key:latest,R2_SECRET_ACCESS_KEY=r2-secret-key:latest \
  --update-env-vars=R2_ACCOUNT_ID=<account>,R2_BUCKET=getgrounded-dev-audio
```

Use the real account id and bucket from `infra/terraform/environments/dev/outputs.tf` / Cloudflare. Do not put keys in git.

- [ ] **Step 4: Redeploy API source after code lands so R2 store is in the image.**

---

### Task 7: Phone keeps the key and plays from the book

**Files:**
- Modify: `mobile/src/lib/api.ts` — `ClipRecord.playable?: boolean`
- Modify: `mobile/src/store/api.ts` — hear returns `storageKey`; `planMorning` sends it; add `getClip` query (`responseHandler` blob / arrayBuffer)
- Modify: `mobile/src/components/talk/morning-wizard.tsx` — hold `storageKey` from hear; send on save; clear after save
- Modify: `mobile/src/components/talk/add-take-sheet.tsx` — same
- Modify: `mobile/src/components/talk/day-words.tsx` → rename UI to Recordings: back chevron, no X, play/pause when `playable`
- Modify: `mobile/src/app/(app)/day/[id].tsx` — ⋯ label **Recordings**; pass `playable` from `day.clips`

**Play path:** `GET {apiUrl}/voice/clips/{id}` with `Authorization: Bearer`. Write bytes to a cache file (`expo-file-system`). `createAudioPlayer({ uri: fileUri })`. One player at a time. Do not pass the R2 URL to the player.

- [ ] **Step 1:** Hear type includes `storageKey`. Wizard state `clipKey`. Save sends `storageKey: clipKey`.
- [ ] **Step 2:** Recordings sheet: back chevron, title Recordings, empty copy “No recordings on this day yet.”
- [ ] **Step 3:** Playable row: play icon → download → play; tap again pauses. Transcript under it.
- [ ] **Step 4:** Words-only row: no play icon.

---

## Spec coverage

| Spec | Task |
|---|---|
| Hear returns storageKey, writes R2 | 2, 6 |
| Morning writes `storage_key` | 3 |
| `playable` on day reads, no raw key | 3 |
| GET clip streams, 404 if not yours / no file | 4 |
| Delete day deletes object | 5 |
| R2 in production | 6 |
| ⋯ Recordings, back, play + words | 7 |
| Old / typed takes words-only | 3, 7 |

Do not commit unless William asks.
