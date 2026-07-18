# KapitBiz Relay — Flow Clarity Fixes

## Why

User testing flagged the app flow as confusing. Traced to three concrete, code-level causes (not vague UX feel) and fixed all three.

## What was actually wrong

1. **Same action, three different labels.** The "browse nearby volunteer capacity" action (`GoodSamaritanPanel`) is reachable from Home, the Decision panel, and the Network tab — but each button used different wording ("View neighbor capacity" / "Ask nearby hosts" / "Good Samaritan capacity"), so it wasn't obvious they led to the same place.
2. **Bottom nav showed the wrong active tab during a rescue.** `KapitBizRelayApp`'s `BottomNav` had `activeTab` hardcoded to `"home"` regardless of which tab the user actually started from — so starting a rescue from Network still highlighted Home.
3. **A real bug, not just a label issue:** on the Network tab, opening a host's details and tapping "Start rescue request" did *not* carry that host into the rescue — it just opened the generic flow from the incident screen, silently dropping the user's choice.

Explicitly ruled out during triage: merging `GoodSamaritanPanel` (temporary, alert-triggered volunteer capacity) with `NetworkScreen` (the standing vetted-partner directory). These are legitimately different data (`GOOD_SAMARITAN_RESPONDERS` vs `state.hosts`), not duplicates — merging them would have removed a real product distinction, not fixed one.

## What changed

- `HazardAlertStrip.tsx`, `ContinuityDecisionPanel.tsx`: relabeled to the single canonical phrase **"Good Samaritan capacity"** (matching `NetworkScreen`'s and the dialog's existing name).
- `KapitBizRelayApp.tsx`, `KapitBizDemoApp.tsx`: threaded `session.activeTab` through as a real prop instead of hardcoding `"home"`.
- `lib/kapitbiz-demo.ts`: `close-rescue` no longer force-resets `activeTab` to `"home"` — closing a rescue now returns you to whichever tab you actually started from.
- `NetworkScreen.tsx`, `KapitBizDemoApp.tsx`: `onStartRequest` now takes the reviewed `hostId` and pre-selects it (mirrors the existing Good Samaritan `startRelayFromHazardAssist` pattern: `start-rescue` → `go-to capacity` → `select-host` → `go-to reservation`), landing on Confirm Reservation with the correct host already set instead of the generic incident screen.
- `tests/kapitbiz-hazard-assist-ui.test.tsx`: updated 2 assertions for the new label.
- `tests/kapitbiz-navigation.test.tsx`: rewrote the test that asserted the *old, broken* behavior (landing on the generic incident heading) to assert the fixed behavior (lands on Confirm Reservation with the correct host name).

## Verification

- `npm test`: 104/104 pass (test suite now asserts the corrected behavior, not the bug)
- `npm run lint`: clean (1 pre-existing unrelated warning)
- `npm run build`: clean
- Manually driven live in-browser: Home label reads "Good Samaritan capacity"; Network → host details → "Start rescue request" lands on Confirm Reservation with the correct host (Northline Cold Storage) already shown; closing that rescue returns to the Network tab, not Home.

## Update: Safety Check + Decision merged (stretch goal, now done)

Answering "Stock at risk" used to close the Safety Check dialog and open a second dialog (`ContinuityDecisionPanel`) with a different `aria-label` ("Recommended continuity move") and stolen focus — a real screen transition for what is really one continuation of the same question.

Merged into a single component, `SafetyCheckDecisionPanel.tsx` (replaces both `SafetyCheckPanel.tsx` and `ContinuityDecisionPanel.tsx`, both deleted):

- The question and its three answer buttons stay visible the whole time.
- Choosing "Stock at risk" reveals the generator-vs-relay recommendation *inline, below the question*, in the same dialog (`aria-label` stays "Safety Check" throughout, no dialog remount).
- Focus is left alone — since nothing steals it, it naturally stays on the button the user just clicked (progressive disclosure, not a forced refocus).
- Removed the decision panel's separate "Mark safe for now" button — now redundant, since the top-level "Safe for now" answer button is already visible on the same screen.
- `hazardSurface` state simplified from `"closed" | "safety-check" | "decision" | "good-samaritan"` to `"closed" | "safety-check" | "good-samaritan"` — "decision" no longer exists as a separate surface.

Verified: 104/104 tests pass (one test rewritten to assert the new inline behavior instead of the old two-dialog behavior; one test updated to click "Safe for now" instead of the removed "Mark safe for now"), lint clean, build clean, manually driven live in-browser — confirmed the recommendation appears inline with no screen transition, and "Start relay" still correctly launches the rescue with hazard context intact.

## Deferred (not done today)

- Any further reduction of steps before the core rescue action beyond this merge.
