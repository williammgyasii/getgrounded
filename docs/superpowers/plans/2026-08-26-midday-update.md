# Midday update Implementation Plan

**Goal:** Speak a midday, confirm it, append and patch that day.

**Architecture:** Hear/extract/save like evening. Kind `MIDDAY_UPDATE`. Write only on `POST /days/midday`.

## Tasks

1. Interpreter + book midday (API tests).
2. `POST /voice/extract` + `POST /days/midday`.
3. Phone wizard on Plan and the day sheet.
