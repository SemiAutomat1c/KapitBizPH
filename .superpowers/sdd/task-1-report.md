# Task 1 Report: KapitBiz Relay Domain Model

## Status

Task 1 is mechanically closed out. The existing implementation was reviewed, the required focused checks were run, no clear Task 1 compliance defect was found, and the existing Task 1 changes were committed.

## Compliance Review

- `web/lib/kapitbiz.ts` exposes the required relay types, seed factory, derived selection, host eligibility, reservation calculation, reducer, and `useKapitBiz` hook.
- The storage key is `kapitbiz-relay-v2`.
- Seed inventory reconciles to PHP 21,800 available, with the approved selected totals of 42 kg and PHP 16,500.
- Quantity updates clamp to available inventory and recalculate derived totals.
- Host and transport selection enforce capacity and rescue-window constraints.
- Forward transitions require the preceding step data; invalid forward transitions remain unchanged.
- Hydration catches malformed JSON and invalid persisted shapes, then persists a valid seed state.
- No Task 2 UI files were touched in this closeout.

## Verification

Commands run from `web/`:

```text
npm test -- tests/kapitbiz-domain.test.ts
```

Result: 1 test file passed, 10 tests passed.

```text
npm run lint -- lib/kapitbiz.ts tests/kapitbiz-domain.test.ts
```

Result: exit code 0 with no lint output.

`git diff --check` also completed with no whitespace errors.

## Evidence Note

The full implementation and test coverage were already present and uncommitted when this closeout began. The earlier RED phase for missing exports was not personally observed, so this report does not claim RED evidence. No implementation fix was necessary during the compliance review.

## Review Fix: Rescue Transport Window

An Important review finding identified that transport validation checked capacity but did not require `arrivalMinutes + selectedHost.transferMinutes` to fit within the shortest selected rescue window.

Two focused regression assertions were added: selection must reject a capable but late transport, and reservation confirmation must reject an already-selected late transport. The fixture uses a 60-minute rider arrival plus Northline's 38-minute transfer against the selected inventory's 90-minute shortest rescue window.

### RED Evidence

Command run from `web/`:

```text
npm test -- tests/kapitbiz-domain.test.ts
```

Observed result before the implementation change: exit code 1; 2 failed and 10 passed. Selection returned `"rider"` instead of `null`, and confirmation advanced from `reservation` to `handoff` instead of returning the unchanged state.

### Implementation

Added a shared transport eligibility guard used by both `select-transport` and `confirm-reservation`. It requires the selected host to exist, verifies transport capacity, and verifies that transport arrival plus host transfer time does not exceed the shortest selected rescue window.

### GREEN Evidence

Commands run from `web/` after the implementation change:

```text
npm test -- tests/kapitbiz-domain.test.ts
```

Result: exit code 0; 1 test file passed, 12 tests passed.

```text
npm run lint -- lib/kapitbiz.ts tests/kapitbiz-domain.test.ts
```

Result: exit code 0 with no lint output.

## Re-review Fix: Clear Stale Rescue Transport

The re-review found that inventory updates preserved `selectedTransportId` using capacity alone. Selecting inventory with a shorter rescue window could therefore leave a transport selected even when its arrival time plus the selected host's transfer time had become too late.

### RED Evidence

A focused regression starts with ice cream deselected, giving a 120-minute shortest rescue window. A rider with a 60-minute arrival is valid with Northline's 38-minute transfer. Reselecting ice cream shortens the rescue window to 90 minutes and must clear that rider.

Command run from `web/`:

```text
npm test -- tests/kapitbiz-domain.test.ts
```

Observed result before the implementation change: exit code 1; 1 failed and 12 passed. The test `clears a selected transport when inventory shortens the rescue window` received `"rider"` instead of `null`.

### Implementation

The inventory-update path now evaluates the selected transport with the existing `isTransportEligible(nextState, option)` guard instead of a capacity-only comparison.

### GREEN Evidence

Commands run from `web/` after the implementation change:

```text
npm test -- tests/kapitbiz-domain.test.ts
```

Result: exit code 0; 1 test file passed, 13 tests passed.

```text
npm run lint -- lib/kapitbiz.ts tests/kapitbiz-domain.test.ts
```

Result: exit code 0 with no lint output.
