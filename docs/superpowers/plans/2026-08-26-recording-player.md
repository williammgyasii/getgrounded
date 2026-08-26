# Recording player Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** New recordings play with a timed bar and word highlight; Continue shows sentence-case tasks.

**Architecture:** Scribe word times travel hear → phone → morning save → `voice_sessions.words`. Recordings reads `clips[].words` and maps `player.currentTime`. Titles are sentence-cased in extract and save.

**Tech Stack:** .NET hear/book, Expo Recordings sheet, existing RTK hear/save.

## File map

- `api/GetGrounded.Application/Book/Titles.cs` — sentence case
- `api/GetGrounded.Application/Voice/HearTypes.cs` — `SpokenWord`, `HearResult.Words`
- `api/GetGrounded.Application/Book/BookRecords.cs` — `ClipRecord.Words`
- `api/GetGrounded.Application/Book/IBookStore.cs`, `BookService.cs` — morning `words`
- `api/GetGrounded.Application/Voice/DayInterpreter.cs` — sentence case + prompt
- `api/GetGrounded.Infrastructure/Voice/ElevenLabsSpeechToText.cs` — parse words
- `api/GetGrounded.Infrastructure/Book/PostgresBookStore.cs`, `Data/BookSchema.cs`
- `api/GetGrounded.Api/Controllers/VoiceController.cs`, `DaysController.cs`
- `mobile/src/lib/spoken-words.ts`, `mobile/src/lib/api.ts`, `mobile/src/store/api.ts`
- `mobile/src/components/talk/day-words.tsx`, wizard + add-take + day screen

## Task 1: Sentence case

Failing: DayInterpreter + BookService lowercase titles become sentence case.

## Task 2: Hear returns words

Failing: stub words appear on `POST /voice/hear`. Scribe maps type=word.

## Task 3: Morning save + day load keep words

Failing: save with words → `clips[0].words`. Schema `words JSONB`.

## Task 4: Phone player

Hear keeps `clipWords`, save sends them. Recordings: bar, clock, collapse, highlight.
