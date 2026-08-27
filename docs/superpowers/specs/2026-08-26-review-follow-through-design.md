# Phase 1.3 — Review follow-through

Facts from closed nights. SQL / .NET does the math. The phone only paints. No AI sentence.

## Done when

```text
GET /days/review?timezone=
  last 7 local days, ending today
  only days with EVENING_REFLECTION
  Done = 1, Partial = ½, Missed / Blocked / leftover Planned = 0
  Cancelled and Rescheduled leave the pile
  extras counted, not scored
  no closed night → followThrough null, not 0%
Review tab shows the number, the pile, and each closed night
empty: "Close a night and the week appears."
```

## HTTP

| Call | Writes book? |
|---|---|
| `GET /days/review?timezone=` | no — `{ from, to, closedNights, planned, done, partial, missed, extras, earned, followThrough, nights[] }` |

No new tables.

## Out of this slice

Calendar weeks, Home consistency rewrite, weekly AI chat, patterns, midday, push, coach.
