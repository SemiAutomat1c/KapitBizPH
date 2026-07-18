# Task 7 Report: KapitBiz Full Demo Browser QA and Documentation

## Status

Completed pending final commit. The in-app browser QA left the demo at fresh onboarding after a confirmed Reset demo.

## Static Baseline Before Browser QA

Executed from `web/` before implementation edits:

```bash
npm test
npm run lint
npm run build
```

- `npm test`: 7 files passed, 74 tests passed.
- `npm run lint`: exit 0; one pre-existing warning: `web/components/IntakeForm.tsx:116:16`, `@next/next/no-img-element`.
- `npm run build`: exit 0; Next.js 16.2.10 production build and TypeScript completed successfully.

The QA server was restarted on `http://localhost:3017` as `npm run start -- --port 3017` after the development toolbar covered the mobile Home control. This kept browser interaction on the requested endpoint while removing framework-only chrome from visible-control testing.

## Browser Coverage

The in-app browser used normal visible controls only.

- Mobile 390 x 844: onboarding Next/Back, Merchant role and setup, all header and bottom-navigation controls, all Request status filters, Network Storage/Transport and List/Map filters, offline route schematic, partner detail dialog, close/resume, reservation and transport dialog, Rider and Host previews, QR handoff, receiver confirmation, completion, Activity and Requests records, exact handoff-record view, and confirmed Reset demo.
- Persistence: browser reload resumed the business setup onboarding state, the Network tab, the reservation screen, and the complete custody record. Reset demo returned to onboarding and was used again to leave the browser clean.
- Tablet 768 x 1024: compact merchant navigation, readable Network map, partner dialog inside the viewport, no desktop rail.
- Desktop 1440 x 900: no merchant rail or phone frame; rescue used a 320 px rail with a constrained 920 px workspace; offline Network map rendered nonblank.
- Sharing: the native Web Share request had no browser-visible settled result in the in-app browser. The normal `View handoff record` fallback displayed the exact recovery record; existing focused tests cover unavailable, rejected, and clipboard-denied share paths.

## Measurements

See `docs/qa/kapitbiz-complete-demo/viewport-results.json`.

- Mobile document width: 390 / 390 px; horizontal overflow false; 0 measured clipped buttons.
- Mobile partner dialog: 358 x 451.81 px at x=16, y=376.19; fully inside 390 x 844.
- Tablet offline map: 688 x 451.3 px; partner dialog: 520 x 428.61 px, fully inside 768 x 1024.
- Desktop rescue rail: 320 px; workspace: 920 px; desktop offline map: 688 x 451.3 px and nonblank.

## QA Fix

The Completed filter displayed `RE-4817-V`, a seeded historical completion, and incorrectly also showed “No completed rescue requests yet.”

- Added the regression expectation in `web/tests/kapitbiz-navigation.test.tsx`.
- RED: focused navigation suite failed exactly because the empty copy was present.
- GREEN: removed the unreachable empty-state branch in `web/components/kapitbiz/RequestsScreen.tsx`; focused navigation suite passed 23/23 and focused ESLint passed.

## Reference Comparison

Read the supplied Stitch design system and the active-disruption, triage, capacity, reservation, QR, and completion reference assets under `/Users/ryandeniega/Downloads/stitch_kapitbiz_relay_mobile_app`. The prototype screenshots preserve the specified operational hierarchy, teal utility palette, compact density, squared controls, and offline-map presentation. The in-app browser blocks direct `file://` navigation to the supplied local reference `code.html`, so a browser-to-browser pixel overlay was not possible; this limitation did not affect the visible prototype journey.

## Evidence

New committed evidence directory: `docs/qa/kapitbiz-complete-demo/`.

- 13 required mobile state captures: onboarding, Home, Requests, Network, Activity, Menu, Rider, Host, reservation, transport dialog, QR handoff, completion, and capacity fallback.
- 2 tablet captures: Network map and partner dialog.
- 3 desktop captures: merchant Home, rescue completion, and Network map.
- `viewport-results.json` records configured viewports, overflow, active navigation coverage, dialogs, rail/workspace, map dimensions, refresh checks, and screenshot names.

## Final Verification

Executed after the QA fix and documentation/evidence updates:

```bash
cd web
npm test
npm run lint
npm run build
cd ..
git diff --check
```

- `npm test`: 7 files passed, 74 tests passed.
- `npm run lint`: exit 0; 0 errors and the same one pre-existing `IntakeForm.tsx:116` image warning.
- `npm run build`: exit 0; compiled, TypeScript, and static-page generation completed.
- `git diff --check`: exit 0.
- Dead-control scan: no unavailable or checklist placeholders were rendered in the tested journey. Remaining source matches are legitimate fallback/error strings or unreachable missing-data role-preview defaults, not visible unavailable controls in the seeded flow.

## Concerns

- The one existing lint warning in `web/components/IntakeForm.tsx:116` is outside the KapitBiz QA scope.
- Native Web Share did not resolve to a browser-visible result in the in-app browser; the manual exact-record fallback and automated fallback coverage remain available.
- Direct local Stitch reference-page navigation is blocked by the in-app browser URL policy; the QA comparison is documented as visual-system and hierarchy alignment rather than pixel-overlay evidence.

## Task 7 Visual Evidence QA Fix

### Scope

- Merchant tab changes now move programmatic focus to the active screen's `h2` rather than the full `.merchantWorkspace` region, so the global focus-visible rule produces a compact heading outline instead of a surface-sized frame.
- The QR handoff identifier now has a nonshrinking flex box and `white-space: nowrap`; its sibling title may wrap first.
- Added regression coverage for real tab-change focus and for the rendered handoff ID plus its parsed module-rule declaration. The no-wrap test is not a regex-only source assertion.

### RED/GREEN Commands

```bash
cd web
npm test -- --run tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
npx eslint components/kapitbiz/MerchantShell.tsx components/kapitbiz/HandoffScreen.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
npx tsc --noEmit
git diff --check
```

- RED: the new merchant test showed focus on `section[aria-label="Rescue requests"]`; the no-wrap regression failed before the CSS declaration was added.
- GREEN: focused navigation and flow suites passed `49/49`; focused ESLint, TypeScript, and diff check exited 0.

### In-App Browser Evidence (2026-07-18)

- `1440 x 900`, `docs/qa/kapitbiz-complete-demo/desktop-home.png`: after visible Requests -> Home navigation, `document.activeElement` was the `H2` `Good morning, Maya` with `tabindex="-1"`; the merchant workspace was not focused. Document dimensions were `1440 / 1440`, so horizontal overflow was false. The compact heading focus outline is visible in the recaptured image.
- `390 x 844`, `docs/qa/kapitbiz-complete-demo/mobile-qr-handoff.png`: the visible QR handoff rendered `RE-4892-X` with computed `white-space: nowrap`, one line box, no element overflow, and fully within the viewport. Document dimensions were `390 / 390`, so horizontal overflow was false.
- Browser server command: `cd web && npm run dev -- --port 3017`. The two replacement captures were produced only with the in-app Browser at `http://localhost:3017`.

### Final Gates

```bash
cd web
npm test
npm run lint
npm run build
cd ..
git diff --check
```

- `npm test`: 7 files passed, 76 tests passed.
- `npm run lint`: exit 0; 0 errors and the pre-existing `web/components/IntakeForm.tsx:116` `@next/next/no-img-element` warning.
- `npm run build`: exit 0; production compilation, TypeScript, and static-page generation completed.
