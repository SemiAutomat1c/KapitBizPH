# Task 3: Good Samaritan Capacity and Existing Relay Entry

## Status

DONE

## Implementation

- Added `GoodSamaritanPanel` inside the existing Hazard Assist dialog. It renders the three deterministic seeded responders, simulated availability, supported trust labels, selected-row state, the prefilled 42 kg request, and the voluntary/no-guarantee disclosure.
- Added Good Samaritan entry actions from Home and Network. Both record the existing `ask-good-samaritans` action and open the same panel.
- Replaced the Task 2 interim decision-panel branch for `good-samaritan` with the real responder panel.
- Routed responder selections through the existing Relay reducer. Storage partners select the matching existing host and enter reservation; the transport responder remains on the normal guarded Relay flow.
- Preserved Network map, offline fallback, and host-dialog focus behavior. Storage rows now carry `KYC preview`; the existing host dialog continues to disclose simulated seeded partner data.

## TDD Evidence

1. RED: appended the three required UI tests before implementation. `npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx` failed with the intended missing Good Samaritan dialog and missing Network/Home actions (3 failed, 3 passed).
2. GREEN: after implementation, the focused Hazard Assist UI suite passed (6/6).

## Verification

- `npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx` passed: 55/55 tests across 3 files.
- `npm run lint -- components/kapitbiz/GoodSamaritanPanel.tsx components/kapitbiz/NetworkScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-hazard-assist-ui.test.tsx` passed with exit 0.
- `git diff --check` passed before staging; the staged diff contained only Task 3 implementation and UI-test files.

## Commit

- `eb07329 feat: connect Good Samaritan capacity to Relay`

## Scope Check

- No notifications, backend calls, or separate capacity state model were added.
- Pre-existing dirty `web/app/layout.tsx` and `.superpowers/sdd/task-1-report.md` were left unstaged and untouched.

## Review Fix: Good Samaritan Dialog Touch Target

### RED/GREEN Evidence

1. RED: added a focused regression that opens Good Samaritan capacity and checks all three responder actions for the dedicated 44px touch-target class. Before the fix, the test failed because the actions used the shared `.inlineAction` class and jsdom exposed no matching responder style contract.
2. GREEN: changed responder actions to the scoped `.responderAction` class with `min-height: 44px`; the focused regression passed.

### Verification

- `npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx` passed: 7/7.
- `npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx` passed: 56/56 across 3 files.
- `npm run lint -- components/kapitbiz/GoodSamaritanPanel.tsx components/kapitbiz/KapitBizRelay.module.css tests/kapitbiz-hazard-assist-ui.test.tsx` exited 0 with one existing configuration warning for the ignored CSS module and no errors.
- `git diff --check` passed.

### Files Changed

- `web/components/kapitbiz/GoodSamaritanPanel.tsx`
- `web/components/kapitbiz/KapitBizRelay.module.css`
- `web/tests/kapitbiz-hazard-assist-ui.test.tsx`

### Commit

- `fix: enlarge Good Samaritan dialog actions`
