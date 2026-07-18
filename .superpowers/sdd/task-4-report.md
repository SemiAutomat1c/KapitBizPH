# Task 4 Report: Relay Context, Requests Label, and Unified Activity Evidence

## Status

Completed.

## Implementation

- Added `buildHazardActivityItems(state, scenarioStartedAt)` to derive deterministic, seeded/demo Hazard Assist evidence without changing Relay transaction state or QR payload.
- Updated `buildActivityFeed(state, session, hazardState)` to combine Hazard Assist evidence before existing Relay custody events.
- Passed `buildHazardRelayContext(hazardAssist.state)` into the embedded Relay workspace. The unframed context band renders between the app header and progress header; standalone Relay explicitly passes `null`.
- Added the conditional `Started from Safety Check` label to the active request and passed Hazard Assist state through Activity.
- Added focused activity ordering and Relay/Requests/Activity UI integration coverage.

## TDD Evidence

```sh
cd web && npm test -- tests/kapitbiz-activity.test.ts
```

RED: one test failed as expected because the existing feed returned only Relay custody events, omitting the five Hazard Assist decisions.

```sh
cd web && npm test -- tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
```

GREEN: 4 test files passed; 60 tests passed.

```sh
cd web && npm run lint -- lib/kapitbiz-hazard-assist.ts lib/kapitbiz-activity.ts components/kapitbiz/KapitBizRelayApp.tsx components/kapitbiz/RequestsScreen.tsx components/kapitbiz/ActivityScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx
```

Result: ESLint exited 0 with no output.

## Self-Review

- Relay remains the sole owner of transaction data; no Hazard Assist fields were added to `RelayDemoState` or the QR payload.
- All new Hazard-derived copy is labeled simulated, seeded, demo, or preview where the context describes a source/effect.
- Existing standalone Relay behavior is preserved with `hazardContext={null}`.
- `web/app/layout.tsx` and the pre-existing Task 1 report edit were not touched or staged.

## Commit

- `d96832e feat: add Hazard Assist audit context`

## Review Fixes

### TDD Evidence

```sh
cd web && npm test -- tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx
```

RED: two focused regressions failed as expected: a stale persisted Good Samaritan timestamp appeared before the simulated alert, and the Relay context note did not disclose that the generator estimate was simulated. A subsequent focused activity assertion also failed before the audit detail was labeled simulated.

```sh
cd web && npm test -- tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
cd web && npm run lint -- lib/kapitbiz-hazard-assist.ts lib/kapitbiz-activity.ts components/kapitbiz/KapitBizRelayApp.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx
cd web && git diff --check
```

GREEN: 4 test files passed, 61 tests passed; scoped ESLint and `git diff --check` exited 0.

### Files Changed

- `web/lib/kapitbiz-hazard-assist.ts`: fixed Good Samaritan audit-slot ordering and labeled generator-comparison copy as simulated.
- `web/components/kapitbiz/KapitBizRelayApp.tsx`: made `hazardContext` optional with a `null` default.
- `web/tests/kapitbiz-activity.test.ts`: added stale-persisted-timestamp ordering and simulated-detail regressions.
- `web/tests/kapitbiz-hazard-assist-ui.test.tsx`: updated Relay-context disclosure coverage.
- `.superpowers/sdd/task-4-report.md`: appended this review-fix evidence.

### Commit

- `fix: harden Hazard Assist audit context`

## Re-Review Fix: Stale Task 1 Expectation

### Failure Reproduction

```sh
cd web && npm test -- tests/kapitbiz-hazard-assist.test.ts
```

RED: 1 of 6 tests failed because the stale expectation used `Relay chosen over generator estimate: PHP714`; implementation correctly returns `Relay chosen over simulated generator estimate: PHP714`.

### GREEN Verification

```sh
cd web && npm test -- tests/kapitbiz-hazard-assist.test.ts tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
cd web && npm run lint -- lib/kapitbiz-hazard-assist.ts tests/kapitbiz-hazard-assist.test.ts tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx
git diff --check
```

GREEN: 5 test files passed; 67 tests passed. Scoped ESLint and `git diff --check` exited 0.

### Changed Files

- `web/tests/kapitbiz-hazard-assist.test.ts`: updated the stale expected Relay context label.
- `.superpowers/sdd/task-4-report.md`: appended this re-review fix evidence.

### Commit

- `fix: update Hazard Assist context test`
