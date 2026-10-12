# GetGrounded — product brief for team & contractors

**Audience:** Executive assistant, social media manager, content creators, and anyone representing the product before they touch the repo.

**Owner:** William Gyasi. When messaging conflicts with this doc, ask William before posting publicly.

**Last updated:** October 2026

---

## One sentence

**GetGrounded is a voice-first app that books your day from how you actually talk — morning plan, honest evening reflection, no checkbox guilt.**

Tagline: **Stop tracking. Start talking.**

---

## The problem we solve

Most habit and productivity apps assume people want to **tap tasks, chase streaks, and feel bad when life gets messy**. Many people already think out loud — voice notes, talking through the day — but that speech disappears. Nothing turns it into a plan you can follow or a honest record of what happened.

GetGrounded is for people who are tired of **lists that don’t match real life** and want software that **listens, books, and remembers** without punishing them.

---

## What the app does (product story)

1. **Morning — Plan the day**  
   The user speaks what they intend to do (work, gym, reading, errands — natural language, not forms). AI extracts structured commitments. The app shows a clear plan; the user confirms or fixes it. It saves to *their* book.

2. **During the day — Update when life moves** (building / rolling out)  
   “Finished the workout, move reading to the bus.” Voice updates complete, reschedule, cancel, or add wins — without reopening a task manager.

3. **Evening — Tell the truth** (building / rolling out)  
   “How did today actually go?” The user speaks honestly. The app reconciles against the morning plan: done, partial, missed, unplanned wins. A terrible day you still **show up and reflect on** counts differently from ghosting the app.

4. **Today — Live the desk**  
   Greeting, what’s left today, showing-up streak, yesterday’s honest score. Primary action: open Plan (mic) to plan or reflect.

5. **Work — The ledger**  
   Past days: what was said vs what was done. Promise history, not gamified XP.

6. **Review — Follow-through over time**  
   Gradual score (e.g. 84% follow-through), not “you broke a streak → zero.” Facts come from the server; AI can explain patterns later.

7. **You — The person**  
   Account, settings, coach style, quiet hours (more over time). Not another task list.

**Core loop to remember:**

```text
Speak the morning → live the day → tell the truth at night → the book stays honest
```

---

## Five tabs (names matter in copy)

```text
Today    Work    [ Plan ]    Review    You
 desk     ledger   (mic)      week     account
```

- **Plan** is the raised center tab (forest green mic). It is the voice entry point — not a separate “Talk app.”
- We do **not** add a sixth tab for every new idea. New features live inside these five.

---

## Philosophy (non‑negotiable in brand)

| We are | We are not |
|--------|------------|
| Calm, mature, honest | Loud hustle culture |
| Voice as the main interface | A to-do app with a mic bolted on |
| Showing up + telling the truth | Perfect completion or shame |
| Follow-through as a gradual score | Streak resets to zero |
| Unplanned wins count | “Failed day” if the list wasn’t perfect |
| Recovery: “Welcome back” | “You lost your streak” |
| The software keeps the book | The user manually maintaining lists |

**Wrong message:** “Crush your goals with AI.”  
**Right message:** “You say the day. The software keeps the book.”

---

## Who we’re talking to (three doors — same product)

Use **one** door per piece of content; don’t blend them in a single post.

| Door | Who | Hook |
|------|-----|------|
| **A — Taps failed me** | Burned by habit apps, streak guilt | “You don’t tap a list. You talk.” |
| **B — I already talk** | Voice notes, journalers, thinkers out loud | “Your voice note could become your day.” |
| **C — I went quiet** | Came back after falling off | “Welcome back. No reset to zero.” |

---

## Visual identity (social + film)

| Token | Hex | Use |
|-------|-----|-----|
| Stone | `#F3EFE8` | Background / floor |
| Ink | `#1C1915` | Words, titles |
| Forest | `#2F4A3C` | Primary action, mic, CTA |
| Cream | `#FAF7F1` | Cards, surfaces |
| Moss | `#DCE6DF` | Soft accents |

**Typography (app):** Inter for UI type.

**Film / Reels look:** Kinetic type + short life scenes (kitchen, walk, desk, night window). Stone and forest. **Spoken word** leads; captions burned in (sound-off friendly). Few words on screen — one sentence at a time. Not neon “AI SaaS” aesthetic.

---

## Public marketing (go wide) — what to ship now

**Goal:** Anticipation and early-access list — **not** a cold App Store drop.

| Do | Don’t |
|----|--------|
| 15–30s vertical films (Reels, TikTok, Shorts) | Show the real app UI, simulators, or fake phone chrome |
| End card: GetGrounded + sentence + **get-grounded.app** + Early access | Streak flames, XP, gems, “don’t break the chain” |
| One URL: **https://get-grounded.app** | TestFlight / download button in films (yet) |
| Waitlist = beta line: “Get early access” | Feature grid or screenshot wall on landing |
| Same sentence everywhere | Influencer faces we “hired” as the brand |

**Landing page (in order):**

1. *You don’t tap a list. You say the day.*
2. *Speak the morning. Live the day. Tell the truth at night.*
3. Email + **Get early access**
4. *You’re on the list. We open the beta in waves.*
5. Optional: hero film muted with captions

**End card copy (every film):**

```text
GetGrounded
You say the day.
get-grounded.app
Early access
```

**First ten film themes** (one feature as a *life*, not a screen): checkbox graveyard, morning plan, night truth, messy day still counts, midday update, welcome back, follow-through not streak, voice note → day, unplanned win, join the list. Details: `docs/superpowers/specs/2026-08-26-go-wide-design.md`.

---

## What is live vs in progress (be honest externally)

Use this table so contractors don’t over-promise.

| Area | Status | Notes for copy |
|------|--------|----------------|
| Brand, waitlist, short films | **Active focus** | Safe to promote list + sentence |
| Sign-in (Firebase) | **In app** | Beta waves, not mass consumer launch |
| Morning voice plan | **Core MVP** | Lead demos here when app is shown privately |
| Today / Work / Review / You shells | **In app** | Some screens still “empty until you show up” |
| Evening reflection & midday | **Specified / building** | Say “coming” or show in film as *life*, not as UI |
| Weekly AI coach, phone calls, partners | **Later** | Do not advertise |
| App Store wide release | **Not yet** | Early access only |

When unsure: **“We’re in early access — join the list”** is always safe.

---

## Future direction (not public promise yet)

**Snap** (internal concept): Share a link from Instagram/TikTok/YouTube → app turns it into actionable steps you can book into your day (“I saw this — I want to try it”). Architecture is designed; **not shipped**. Do not post Snap as a live feature until William says so.

---

## Role guide (starter — customize with William)

### Social media / content

- Script and produce 15–30s films per go-wide spec  
- Post to TikTok, Instagram Reels, YouTube Shorts (same master, recut aspect ratios if needed)  
- Keep bio/link to **get-grounded.app**  
- Reply to comments in brand voice (calm, no debate bait)  
- Track which “door” (A/B/C) each post uses  
- Weekly: what posted, links, rough reach, learnings  

### Executive / operations assistant

- Calendar, inbox, contractor coordination  
- Waitlist tool admin (exports, bounce handling — tool TBD with William)  
- Asset library: films, scripts, brand colors, approved copy  
- Meeting notes when William reviews content  
- **Does not** commit code or change product copy in the app without William  

### Both

- Read this doc + `docs/FEATURES.md` before creating assets  
- Escalate: pricing, legal, partnership, anything about “AI hears your data,” health/finance claims  

---

## Words we use / avoid

| Use | Avoid |
|-----|--------|
| Plan, reflect, show up, follow-through, book, honest, welcome back | Streak lost, crush, grind, 10x, life hack |
| Speak, say the day, voice | Dictation, chatbot gimmick |
| Early access, beta waves | “Download now” (until launch) |
| Commitments, wins | Tasks, todos (only if explaining contrast with other apps) |

---

## Privacy & trust (short)

- User journal text and transcripts are **not** for marketing analytics or public posts.  
- Never share real user audio, screenshots with real names/emails, or DMs without written consent.  
- In demos, use William’s account or clearly fictional examples.

---

## Deeper reading (internal)

| Doc | Purpose |
|-----|---------|
| `docs/FEATURES.md` | Five tabs, colors, MVP map |
| `docs/FEATURE-CATALOG.md` | Full feature inventory by phase |
| `docs/superpowers/specs/2026-08-26-go-wide-design.md` | Films, landing, waitlist |
| `README.md` | Engineering layout (developers only) |

---

## Quick FAQ for DMs and comments

**“Is it out?”**  
Not fully — join early access at get-grounded.app; we invite in waves.

**“How is this different from Notion / Todoist / Habitica?”**  
You talk your day in and out; the app books and reconciles. No checkbox religion.

**“Is it AI therapy?”**  
No. It’s a consistency companion — plan, live, reflect. Calm coach tone, not clinical.

**“Android / iOS?”**  
Mobile app in development (Expo/React Native). Platform rollout follows beta waves.

**“Price?”**  
Not finalized. Free tier with core loop planned; deeper coach features may be paid later.

---

## Checklist before anything goes public

- [ ] One clear door (A, B, or C) — not a manifesto mixing all three  
- [ ] Sentence + URL on end card  
- [ ] No fake app UI or unshipped features (coach calls, Snap, partners)  
- [ ] Captions on, sound-off readable  
- [ ] William approved script or rapid async review for new angles  

---

*Questions or updates to this brief: William Gyasi.*
