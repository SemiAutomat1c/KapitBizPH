# KapitBiz Relay Web App Design

**Date:** 2026-07-17  
**Status:** Approved for implementation planning  
**Visual source:** `/Users/ryandeniega/Downloads/stitch_kapitbiz_relay_mobile_app`

## Objective

Turn the existing hackathon web app into a focused, mobile-first KapitBiz Relay demo. The judge-facing app must complete one believable business-continuity transaction: a Tagum frozen-goods merchant responds to a simulated localized power interruption, prioritizes perishable inventory, reserves unaffected cold-storage capacity, arranges transport, confirms custody, and sees the inventory value protected.

The product must feel like an operational rescue tool, not a preparedness checklist, readiness dashboard, disaster-information portal, or collection of unrelated hackathon concepts.

## Product Scope

The MVP contains one connected six-step flow:

1. Active disruption
2. Inventory triage
3. Available capacity
4. Reservation and transport
5. QR inventory handoff
6. Rescue completed

The app opens directly to KapitBiz Relay. Previous focus-area implementations remain in the repository but are removed from visible navigation and the judge-facing route.

### Included Interactions

- Start the rescue from a simulated incident.
- Select or deselect inventory and adjust quantities.
- Recalculate selected weight, item count, and protected value.
- Toggle capacity results between a list and an interactive Mapbox presentation.
- Compare a recommended host with less suitable alternatives.
- Reserve the selected host.
- Choose a transport option in a bottom sheet.
- Calculate storage, transport, and total cost.
- Confirm the reservation.
- Render a real client-side QR code containing the handoff identifier and summary.
- Simulate receiver confirmation without claiming a live external scanner.
- Add an optional evidence-photo preview for the current browser session.
- Complete the custody handoff and display an audit timeline.
- Share the recovery record through the Web Share API, with clipboard fallback.
- Reset the complete scenario to its seeded state.

## Explicit Non-Goals

- No preparedness checklist, readiness score, safety tips, or business-continuity-plan generator.
- No live Davao Light, PAGASA, LGU, routing, geocoding, traffic, courier, insurer, lender, or SB Corp integration.
- No claim that listed hosts, routes, fees, verification, approvals, or availability are real.
- No authentication, payments, remote database, multi-user synchronization, or host onboarding in the hackathon MVP.
- No general marketplace covering every operating-capacity category.
- No production-grade custody, food-safety, insurance, or liability workflow.

Every seeded incident, provider, route, and transaction is visibly labeled as simulated demo data.

## Demo Scenario

**Merchant:** Maya's Frozen Goods, Tagum City  
**Incident:** Simulated localized six-hour power interruption beginning at 2:10 PM  
**Total inventory at risk:** PHP 21,800  
**Selected for rescue:** 42 kg across three inventory groups, worth PHP 16,500  
**Selected quantities:** 11 of 18 ice-cream tubs (5 kg, PHP 4,400), 25 of 30 kg frozen chicken (PHP 7,000), and 12 kg processed meat (PHP 5,100)  
**Recommended host:** Northline Cold Storage, Panabo City, approximately 28 km away  
**Capacity:** 42 kg for 12 hours  
**Estimated transfer time:** 38 minutes after rider pickup  
**Storage fee:** PHP 300  
**Transport:** Logistics Pro rider, PHP 150, 12-minute arrival  
**Total rescue cost:** PHP 450  
**Outcome:** PHP 16,500 inventory protected and a completed custody record

The exact figures remain consistent across all screens.

## Information Architecture

### Mobile

Mobile follows the six Stitch references closely. Each screen has one dominant task and one primary action. A four-item bottom navigation appears on overview screens:

- Home
- Requests
- Network
- Activity

The navigation is hidden during reservation and QR handoff so the user stays inside the transaction. In the MVP, non-flow destinations display compact, purposeful demo states rather than branching into additional products.

### Desktop and Projector

At desktop widths, the app becomes an operational two-column workspace instead of placing a fake phone frame in the center:

- A fixed-width left rail shows the active incident, rescue-window countdown, merchant, current totals, and six-step progress.
- The right workspace renders the active step at a readable maximum width.
- The completion screen may use the full content width for the protected-value result and audit timeline.

At tablet widths, the rail collapses into a compact progress header. Below 768 px, the app uses the full-width mobile layout from Stitch.

## Visual System

The Stitch design system is the source of truth:

- Geist for prose and interface labels.
- JetBrains Mono for currency, quantity, weight, duration, identifiers, and timestamps.
- Off-white `#f7fafa` application background.
- White content surfaces.
- Charcoal `#181c1d` primary text.
- Deep teal `#006d77` for primary actions and active state.
- Muted red only for actual risk or error state.
- Amber only for watch or pending state.
- Four-to-eight-pixel corner radii.
- Hairline borders and tonal layers instead of decorative shadows.
- Lucide icons with labels for unfamiliar actions.
- Minimum 44 px interactive targets.
- No gradients, glassmorphism, oversized headings, nested cards, decorative illustrations, or marketing-style hero content.

Motion is restrained: screen transitions, bottom-sheet entry, button feedback, countdown updates, and handoff confirmation. All motion respects `prefers-reduced-motion`.

## Application Architecture

### Top-Level Flow

`app/page.tsx` renders one client-side `KapitBizRelayApp`. The application owns a single explicit flow state:

```text
incident -> triage -> capacity -> reservation -> handoff -> complete
```

Back actions move to the preceding valid state. On a first visit with no valid persisted state, the app starts at `incident`. A refresh restores the persisted current rescue step and transaction state instead of forcing the incident screen. The explicit `Reset demo` command creates fresh seeded data, returns to `incident`, and persists that reset state.

### Component Boundaries

- `KapitBizRelayApp`: flow orchestration, responsive shell, and route-level state.
- `AppHeader`: product identity, simulated-data indicator, and contextual back action.
- `IncidentRail`: desktop incident context and progress.
- `BottomNav`: mobile persistent destinations outside focused transaction steps.
- `ActiveDisruptionScreen`: incident summary and rescue start.
- `InventoryTriageScreen`: inventory selection and quantity editing.
- `CapacityMatchScreen`: host ranking and list/map presentation.
- `CapacityMap`: optional Mapbox basemap, seeded markers and route overlay, and local schematic fallback.
- `ReservationScreen`: destination, selected inventory, transport sheet, and cost summary.
- `HandoffScreen`: QR payload, custody parties, evidence preview, and receiver confirmation.
- `RescueCompleteScreen`: result, storage deadline, audit timeline, record, share, and reset.
- `TransportSheet`: accessible modal sheet for transport selection.
- `DemoDataNotice`: reusable disclosure for simulated incidents and providers.

Each screen receives typed state and callbacks. It does not read or mutate browser storage directly.

### Mapbox and Offline Fallback

The capacity screen uses Mapbox GL when `NEXT_PUBLIC_MAPBOX_TOKEN` is configured and map tiles load successfully. The map displays seeded coordinates for Maya's Frozen Goods, Northline Cold Storage, and alternative hosts. A GeoJSON line connects the selected origin and host to visualize the regional relay corridor.

Mapbox is presentation infrastructure only. Host availability, affected-area status, route shape, distance, and travel time remain seeded demo data and are labeled accordingly. The MVP does not call Mapbox Directions, Geocoding, Traffic, or Optimization APIs.

The critical rescue flow never depends on the map. List view is the default and contains every decision needed to reserve capacity. If the token is absent, tiles fail, the browser is offline, or map initialization errors, the map tab renders a locally bundled route schematic with the same markers and labels. The fallback includes a visible offline-demo notice without blocking host selection.

The public Mapbox token is read only from the environment and is never committed to the repository or written to Obsy. Deployment guidance requires a least-privilege public token restricted to the deployed origin where supported.

### State and Persistence

`lib/kapitbiz.ts` becomes the typed domain and persistence layer. It defines:

- `RelayStep`
- `Incident`
- `InventoryItem`
- `CapacityHost`
- `TransportOption`
- `Reservation`
- `HandoffRecord`
- `RelayDemoState`

The `useKapitBiz` hook owns transitions and derived values. State persists to a versioned localStorage key so the demo survives refreshes and venue connectivity problems. With no valid stored state, initialization creates a clean seeded state at `incident`; with valid stored state, hydration restores its exact current `RelayStep`. Refresh never resets an in-progress rescue. Invalid or old cached data falls back to the clean seeded incident state. The `Reset demo` command is the only normal interaction that deliberately replaces the current rescue with fresh seeded data and returns the flow to `incident`.

Derived totals are calculated from selected quantities rather than stored independently. This prevents the values displayed on different screens from drifting apart.

The rescue-window countdown is derived from a scenario start timestamp created when the demo is reset. It is not presented as a live utility estimate.

### QR and Evidence

The QR code is generated client-side from a compact payload containing the demo handoff ID, sender, receiver, selected inventory summary, and timestamp. The receiver scan remains a labeled simulation controlled by a confirmation action in the same app.

An uploaded evidence image is displayed using a temporary browser object URL. It is not saved to localStorage, uploaded, or represented as durable evidence after refresh. A seeded thumbnail remains available so the demo does not depend on camera permissions.

### Sharing

The completion screen creates a plain-text recovery summary. It uses `navigator.share` when available and otherwise copies the summary to the clipboard. Failure produces an inline message and never blocks viewing the handoff record.

## Data Flow

1. Reset creates the seeded incident and initial inventory.
2. Starting rescue advances to triage.
3. Inventory edits update selected quantities and all derived totals.
4. Capacity matching filters and ranks seeded hosts against required weight and disruption area.
5. List and map views read the same ranked host data; changing presentation cannot change eligibility or totals.
6. Selecting a host creates a draft reservation.
7. Selecting transport recalculates the reservation total.
8. Confirming the reservation assigns a handoff identifier and timestamp.
9. Receiver confirmation creates the custody record and completion timeline.
10. Completion persists the final demo state and exposes share/reset actions.

## Ranking Logic

Inventory priority is transparent and deterministic. It uses:

- remaining safe-storage window
- selected inventory value
- required cold-storage capacity
- ability to transfer within the rescue window

Host ranking uses:

- sufficient available capacity
- host outside the simulated affected area
- travel time
- availability duration
- service cost

The interface explains why a host is recommended. No generative AI makes food-safety or custody decisions in the MVP.

## Error and Edge States

- No inventory selected: disable capacity search and explain that at least one item is required.
- Requested quantity exceeds stock: clamp to available quantity.
- Insufficient host capacity: display the capacity gap and prevent reservation.
- Missing transport selection: keep confirmation disabled and focus the transport section.
- Corrupt localStorage: restore seeded state without crashing.
- Missing Mapbox token, offline tiles, or map initialization error: switch the map tab to the bundled route schematic while preserving the host list and reservation path.
- QR generation failure: show the handoff ID and allow manual confirmation.
- Evidence permission or upload failure: preserve the seeded evidence option and show an inline message.
- Share unavailable or rejected: copy to clipboard or display the record text.
- Countdown reaches zero: mark the scenario rescue window as expired while allowing reset; do not invent a new estimate.

## Accessibility

- Use semantic headings, buttons, lists, dialogs, and status regions.
- Maintain visible keyboard focus.
- Ensure status is communicated through text and icon, not color alone.
- Announce changed totals and handoff confirmation through polite live regions.
- Trap focus inside the transport sheet and restore focus when it closes.
- Support keyboard operation for every interaction.
- Meet WCAG AA contrast for text and controls.

## Verification

### Automated

- TypeScript and production build pass.
- ESLint passes for changed files.
- Unit tests cover derived inventory totals, host eligibility/ranking, transition guards, persistence fallback, and cost calculation.
- Browser interaction test completes the six-step rescue flow and verifies the final PHP 16,500 result.
- Map tests cover configured Mapbox rendering, absent-token fallback, and host selection parity between list and map views.

### Visual

Use browser screenshots at approximately:

- 390 x 844 mobile
- 768 x 1024 tablet
- 1440 x 900 desktop/projector

Compare mobile screens against all six Stitch references. Check text fit, fixed action areas, bottom navigation, bottom-sheet behavior, scroll reachability, and absence of overlap.

Verify the capacity screen once with Mapbox configured and once with the browser offline. Both cases must preserve readable markers, the selected host, and the ability to continue the rescue.

### Demo Acceptance Criteria

- The visible app contains only KapitBiz Relay branding and navigation.
- A first-time user can complete the full flow without explanation.
- All figures remain consistent from triage through completion.
- The primary demo works after refresh and without network access.
- No screen resembles a preparedness checklist or readiness dashboard.
- Simulated data is disclosed without dominating the interface.
- Mobile matches the Stitch visual language.
- Desktop is projector-readable and does not look like a phone screenshot embedded in a webpage.
- The completed flow visibly produces a custody record and PHP inventory protected.
