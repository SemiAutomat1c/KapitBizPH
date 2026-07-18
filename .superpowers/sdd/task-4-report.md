# Task 4 Report: Requests and Activity Screens

## Status

Completed.

## Commit

- `7a7a8fd feat: add rescue requests and activity screens`

## Files

- Added `web/lib/kapitbiz-activity.ts`
- Added `web/components/kapitbiz/RequestsScreen.tsx`
- Added `web/components/kapitbiz/ActivityScreen.tsx`
- Added `web/tests/kapitbiz-activity.test.ts`
- Modified `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modified `web/components/kapitbiz/KapitBizRelay.module.css`
- Modified `web/tests/kapitbiz-navigation.test.tsx`

## RED Evidence

```sh
cd web && npm test -- --run tests/kapitbiz-activity.test.ts
```

Result: 1 test file failed before collection because `@/lib/kapitbiz-activity` did not exist; 0 tests ran.

```sh
cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx -t "filters requests|opens the completed custody"
```

Result: 1 test file failed; 2 tests failed and 12 were skipped. Requests had no segmented controls and Activity was still the seeded placeholder.

## GREEN Evidence

```sh
cd web && npm test -- --run tests/kapitbiz-activity.test.ts tests/kapitbiz-navigation.test.tsx
```

Result: 2 test files passed; 15 tests passed.

```sh
cd web && npx eslint lib/kapitbiz-activity.ts components/kapitbiz/RequestsScreen.tsx components/kapitbiz/ActivityScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-activity.test.ts tests/kapitbiz-navigation.test.tsx
```

Result: ESLint exited 0 with no output.

```sh
cd web && npx tsc --noEmit && npm test
```

Result: TypeScript exited 0; the full Vitest suite passed 6 files and 61 tests.

```sh
git diff --check && git diff --cached --check
```

Result: both exited 0 with no output before commit.

## Self-Review

- Requests replaces its placeholder with an accessible Active/Pending/Completed radio segmented control. The active `RE-4892-X` path resumes the existing session rescue; the pending and historical requests are seeded display data only.
- Activity derives merchant, rider, arrival, and custody records only from rescue/session timestamps. It does not call `Date.now()` while building the feed, and its added seeded business event is derived from `scenarioStartedAt`.
- The completed Activity CTA dispatches the existing rescue-open action, which reopens the same completed custody state. Network remains its Task 5 placeholder.
- The approved PHP21,800, 42 kg/PHP16,500, PHP300/PHP150/PHP450 values remain visible and no second rescue model was introduced.

## Concerns

- The rider-arrival feed item is ready for the persisted `riderArrivedAt` value, but the merchant Task 4 UI does not produce that event; its operational trigger belongs with the later rider-preview work.

## CSS Regression Fix Evidence

### RED

```sh
cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx -t "keeps Capacity two-column"
```

Result: FAIL. The new regression assertion failed because `.requestFilters` did not exist; 1 test failed and 14 tests were skipped.

### GREEN

```sh
cd web && npm test -- --run tests/kapitbiz-activity.test.ts tests/kapitbiz-navigation.test.tsx
```

Result: 2 test files passed; 16 tests passed; exit code 0.

### Focused ESLint

```sh
cd web && npx eslint lib/kapitbiz-activity.ts components/kapitbiz/RequestsScreen.tsx components/kapitbiz/ActivityScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-activity.test.ts tests/kapitbiz-navigation.test.tsx
```

Result: exit code 0 with no output.

### Diff Check

```sh
git diff --check && git diff --cached --check
```

Result: both checks exited 0 with no output.

### Structural Audit

- `CapacityMatchScreen.tsx` remains on `styles.segmentedControl`.
- `RequestsScreen.tsx` now uses `styles.requestFilters`.
- `KapitBizRelay.module.css` retains `.segmentedControl { grid-template-columns: repeat(2, ...) }` and scopes the Requests rule as `.requestFilters { grid-template-columns: repeat(3, ...) }`.
