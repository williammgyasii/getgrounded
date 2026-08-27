# Review follow-through Implementation Plan

**Goal:** Closed nights in the last 7 local days become one follow-through number on Review.

**Architecture:** `FollowThrough` scores `DayRecord`s. `GET /days/review` returns that. Phone paints.

## Tasks

1. Formula tests + `FollowThrough` (API).
2. `GET /days/review` + DaysTests.
3. Review tab + `useGetReviewQuery`.
