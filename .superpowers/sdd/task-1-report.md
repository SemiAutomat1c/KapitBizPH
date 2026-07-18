# Task 1: Hazard Assist Domain State and Persistence

## Status

DONE

## Implementation

- Added `web/lib/kapitbiz-hazard-assist.ts` with the versioned Hazard Assist state, seeded hazard event, deterministic Good Samaritan responders, generator estimate, continuity recommendation, reducer transitions, persisted-state validation, and Relay context builder.
- Added `web/lib/use-hazard-assist.ts` with hydration-gated browser `localStorage` loading/persistence, action dispatch, and reset behavior.
- Added `web/tests/kapitbiz-hazard-assist.test.ts` covering estimate calculation, Relay recommendation, reducer state transitions, malformed/stale persistence rejection, responder determinism, hydration, and persistence.
- Existing Relay state remains the owner of inventory, host, reservation, rider, and QR state. No existing Relay reducer or unrelated UI code was changed.

## TDD Evidence

1. RED: `npm test -- tests/kapitbiz-hazard-assist.test.ts` failed during import resolution because both new modules did not exist; Vitest reported 0 tests executed.
2. GREEN: focused suite passed with 6 tests in 1 file.
3. Focused lint passed with exit 0.
4. TypeScript compilation passed with `npx tsc --noEmit`.
5. Post-commit focused suite and focused lint were rerun and passed.
6. Cached diff check passed before commit.

## Commit

- `a5aef49 feat: add Hazard Assist demo state`

## Scope Check

- Commit includes only the three Task 1 files.
- Pre-existing `web/app/layout.tsx` modification remains unstaged and untouched.
