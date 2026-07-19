# Task 6 Report: Offer board - view sorted blind offers

## Status

DONE

## What I implemented

- Added `SagipOfferBoard`, which derives displayable offers with `visibleOffers(allOffers, request.id, now)`, then sorts them through `sortOffers` and renders each price with `data-testid="sagip-offer-price"`.
- Made posted request and surplus titles open the board through the existing one-dialog `SagipSurface` state machine.
- Kept the screen-owned 1-second `now` timer and used the current `accept-offer` action shape: `{ type: "accept-offer", offerId }`.
- Updated the UI assertion to wait up to six seconds for the first real blind offer to arrive.

## TDD Evidence

### RED

Command:

```bash
cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx
```

Output: `1 failed | 2 passed (3)`.

The new test failed at `findByRole("dialog", { name: "Dry ice, 40kg" })`, exactly because request list titles are not yet buttons and no offer-board dialog exists.

### GREEN

Command:

```bash
cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx
```

Output: `3 passed (3)` in 5.04 seconds. The board opens, waits through the screen-owned 1-second timer for the first generated offer, and verifies the visible prices are ascending for a need request.

## Verification Commands and Results

- `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx` - passed: 3 tests.
- `cd web && npm test` - passed: 128 tests across 11 files.
- `cd web && npm run lint` - passed with 0 errors and the known pre-existing `IntakeForm.tsx:116` `@next/next/no-img-element` warning.
- `cd web && npm run build` - passed: production build and TypeScript compilation completed successfully.
- `git diff --check -- web/components/kapitbiz/SagipOfferBoard.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx` - passed.
- Repository-wide `git diff --check` remains nonzero only because pre-existing dirty Task 1 and Task 3 report files contain trailing whitespace; they were not changed or staged.

## Files Changed

- `web/components/kapitbiz/SagipOfferBoard.tsx` - new blind-offer board dialog content.
- `web/components/kapitbiz/SagipCenterScreen.tsx` - board surface, request selection, reducer actions, and remaining-quantity labels.
- `web/tests/kapitbiz-sagip-ui.test.tsx` - board-flow and sorted visible-price regression test.

## Self-review Findings

- Confirmed `accept-offer` dispatch includes no stale `at` field.
- Confirmed the board uses `visibleOffers` before `sortOffers`, so pre-arrival offers remain hidden.
- Confirmed the board uses the existing `HazardAssistDialog` and no additional dialog state.
- Confirmed scoped whitespace validation passes; no Task 6 implementation concerns found.

## Issues or Concerns

- No Task 6 concerns. The only lint output is the known pre-existing image warning noted above.

## Review Fix

- Added the exported `SagipOfferBoardProps` contract with the Task 7-9 `onNegotiate` callback signature.
- Passed a no-op `onNegotiate` callback from `SagipCenterScreen`; Task 6 still renders no negotiate UI and retains one-dialog behavior.
- Verification: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx` passed 3 tests; `cd web && npm run lint` passed with 0 errors and the known pre-existing `IntakeForm.tsx:116` image warning.
