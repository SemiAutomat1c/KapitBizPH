# KapitBiz Hazard Assist Demo Design

## Purpose

Add a demo-first early-warning and decision layer to KapitBiz Relay without turning the product into a preparedness checklist. Hazard Assist should show that KapitBiz can detect an operating risk, ask one safety question, calculate the business decision, activate nearby help, and pass the user into the existing verified relay transaction.

The new judge story is:

`Brownout + flood-risk alert -> Safety Check -> generator cost vs relay cost -> Good Samaritan capacity opens -> existing Relay reservation -> QR handoff -> protected-value record`

## Product Boundary

- Frontend-only demo using seeded events, seeded fuel price, seeded responder capacity, and browser `localStorage`.
- No live PAGASA, PHIVOLCS, DOE, NGCP, Davao Light, routing, payment, SMS, push, AI model, or backend claim.
- All hazard data shown in-app must be clearly labeled as simulated demo data.
- The app must keep the current KapitBiz Relay transaction as the proof layer.
- The app must not add readiness checklists, generic safety instructions, or long preparedness tasks.
- Safety Check answers must lead to business-continuity actions, not generic advice.
- Fuel-related copy must never advise stockpiling, hoarding, panic buying, or raising crisis prices.
- Good Samaritan capacity is a voluntary demo response from vetted network members; it must not imply guaranteed rescue.
- Reset demo remains the only full restart.

## Demo Scenario

The seeded incident is a combined brownout and flood-risk event in Davao del Norte:

- **Event label:** Simulated Feeder Outage + Flood-Risk Route
- **Location:** Tagum central market area with nearby Davao del Norte capacity partners.
- **Business:** Maya's Frozen Goods.
- **Risk:** PHP21,800 frozen inventory exposed by a six-hour outage and possible route delays.
- **Fuel price:** PHP68 per liter diesel, simulated weekly reference.
- **Generator burn rate:** 1.75 liters per hour.
- **Generator duration:** 6 hours.
- **Generator estimate:** PHP714.
- **Relay estimate:** PHP450 total, from the existing storage plus rider reservation.
- **Recommendation:** Relay stock to nearby cold storage because it is cheaper and creates QR custody proof.

The numbers are intentionally simple and demoable. The product should show the calculation plainly enough for a judge to understand in seconds.

## Experience Map

### 1. Home Alert Strip

Home adds a compact alert strip above the current operating status:

- Title: `Simulated brownout + flood-risk alert`
- Detail: `Feeder outage expected for 6 hours. Low-lying routes may delay deliveries.`
- Status chips: `Demo feed`, `Fuel reference`, `Neighbor capacity`
- Primary action: `Run Safety Check`

The alert strip must feel operational and compact, not like a marketing hero.

### 2. Safety Check

Tapping `Run Safety Check` opens a focused Safety Check panel or screen. It asks one question:

`Is Maya's Frozen Goods safe to operate right now?`

Actions:

- `Safe for now`
- `Need help`
- `Stock at risk`

Behavior:

- `Safe for now` records a local status and returns to Home with a small acknowledgement.
- `Need help` creates a prefilled assistance request and shows the Good Samaritan response panel.
- `Stock at risk` opens the fuel-aware continuity decision panel.

This should be quick enough to demo in under 15 seconds.

### 3. Fuel-Aware Continuity Decision

The decision panel compares two options:

- `Run generator`: 6 hours x 1.75 L/hr x PHP68/L = PHP714 estimated fuel.
- `Relay to cold storage`: PHP450 existing seeded reservation estimate.

The recommendation card says:

`Recommended: Relay the frozen stock. It costs less than running the generator today and gives you a QR custody record.`

Actions:

- `Start relay`
- `Ask nearby hosts`
- `Mark safe for now`

Behavior:

- `Start relay` opens the existing rescue flow at the triage/incident entry point without creating a second rescue state model.
- `Ask nearby hosts` opens the Good Samaritan response panel.
- `Mark safe for now` records local status and returns to Home.

### 4. Good Samaritan Response Panel

The Good Samaritan panel shows nearby vetted network members responding to the simulated alert:

- Northline Cold Storage opens 120 kg temporary freezer capacity.
- Tagum North Micro-Cold Room opens 60 kg temporary freezer capacity.
- Rider - Logistics Pro confirms a 30-minute refrigerated pickup window.

Each response must show:

- Partner name.
- Help offered.
- Estimated availability.
- Trust label such as `Vetted demo partner`.
- Action: `Use in Relay` for eligible storage/transport rows.

Behavior:

- Selecting `Use in Relay` updates the visible recommendation context and opens the existing relay capacity/reservation path.
- The panel can be accessed from Home, the Safety Check result, and the Network screen.
- It remains seeded and deterministic; no real notifications are sent.

### 5. Existing Relay Transaction

The existing Relay flow remains the completion path:

`Incident -> Inventory triage -> Capacity -> Reservation -> Rider dispatch -> QR handoff -> Host confirmation -> Completion record`

Hazard Assist should pass context into this flow visually:

- Rescue source label: `Started from Safety Check`
- Event context: `Simulated brownout + flood-risk alert`
- Decision note: `Relay chosen over generator estimate: PHP714`

The relay state, reservation, QR payload, and protected-value record remain governed by the current KapitBiz domain state.

### 6. Activity Evidence

Activity gains hazard-specific timeline rows when the user interacts with Hazard Assist:

- Simulated alert received.
- Safety Check answered.
- Fuel comparison generated.
- Good Samaritan capacity opened.
- Relay started from Safety Check.

These rows should merge into the existing custody and completion timeline. The result should feel like one audit trail.

## Navigation Model

- Home remains the primary entry point.
- `Run Safety Check` is the hero action for the new layer.
- Network gains a visible but compact `Good Samaritan capacity` affordance.
- Activity shows Hazard Assist events after the user triggers them.
- Requests can label the active rescue as `Started from Safety Check` after the new flow is used.
- No new bottom-nav tab is required for the first demo version.

## State and Persistence

Add a small versioned Hazard Assist state beside the existing demo session:

```ts
type SafetyCheckAnswer = "unknown" | "safe" | "need-help" | "stock-at-risk";

interface KapitBizHazardAssistState {
  version: 1;
  alertAcknowledged: boolean;
  safetyCheckAnswer: SafetyCheckAnswer;
  generatorEstimatePhp: number;
  relayEstimatePhp: number;
  goodSamaritanAskedAt: number | null;
  selectedGoodSamaritanPartnerId: string | null;
  relayStartedFromHazardAssist: boolean;
}
```

Persistence rules:

- Store under a new `kapitbiz-hazard-assist-v1` localStorage key.
- Validate parsed state before use; invalid data falls back to the default simulated alert.
- Reset demo clears this key along with the existing demo and relay keys.
- A browser refresh preserves the Safety Check answer, selected Good Samaritan partner, and whether the relay was started from Hazard Assist.

## Component Boundaries

- `hazardAssist.ts`: seeded hazard event, fuel inputs, Good Samaritan responder fixtures, default state, reducer, selectors, and calculation helpers.
- `useHazardAssist.ts`: hydration-gated localStorage hook for the Hazard Assist state.
- `HazardAlertStrip`: compact Home alert entry.
- `SafetyCheckPanel`: focused question and answer handling.
- `ContinuityDecisionPanel`: generator-vs-relay calculation and recommendation.
- `GoodSamaritanPanel`: seeded capacity/responder list and partner selection.
- Existing merchant screens: integrate the new components without changing the bottom-navigation model.
- Existing Relay flow: accepts optional source/event labels from the current merchant shell, but does not duplicate rescue state.

## Copy Rules

Use plain, judge-readable language:

- Say `simulated alert`, not `live alert`.
- Say `fuel reference`, not `DOE API`.
- Say `nearby partners opened capacity`, not `guaranteed rescue`.
- Say `schedule delivery earlier` or `review costs`, never `stock up`, `hoard`, or `raise prices before impact`.
- Say `recommended continuity move`, not `AI decision`.
- Use `PHP` in code and records; display may use `PHP` or the existing app convention consistently.

## Accessibility

- Safety Check and decision panels must have clear headings and labelled regions.
- Answer buttons must expose pressed/selected state after activation.
- Dynamic recommendation changes should use a polite live region.
- Focus should move to the Safety Check heading when opened and to the recommendation heading after selecting `Stock at risk`.
- Good Samaritan dialogs or panels must keep existing focus-trap and trigger-restoration standards when presented modally.
- All touch targets must stay at least 44 by 44 pixels.

## Responsive Behavior

- Mobile keeps the alert strip compact and stacks Safety Check, decision, and Good Samaritan panels vertically.
- Tablet may show the decision and Good Samaritan response side by side if space allows.
- Desktop can show alert, decision, and network response in a calm two-column work surface.
- No horizontal overflow at 390 px, 768 px, or 1440 px widths.
- The new layer must not add a phone frame, landing page, large hero, nested cards, or decorative gradients.

## Testing and QA

- Unit tests cover generator-cost calculation, recommendation selection, and Hazard Assist state parsing/fallback.
- Component tests cover Safety Check actions, Good Samaritan partner selection, and `Start relay` entering the existing rescue flow.
- Navigation tests verify Home, Network, Requests, and Activity reflect Hazard Assist state after the flow is used.
- Regression tests verify Reset demo clears Hazard Assist state.
- Existing Relay tests must remain green.
- Browser QA must capture mobile and desktop states for:
  - Home alert.
  - Safety Check.
  - Fuel-aware decision.
  - Good Samaritan response.
  - Relay screen with `Started from Safety Check`.
  - Activity timeline with Hazard Assist rows.

## Success Criteria

- A judge can understand the new value in under 30 seconds: KapitBiz notices risk, asks one question, computes the cheaper continuity move, activates nearby help, and proves the handoff.
- The product still feels like a business-continuity rescue exchange, not a preparedness checklist.
- All three ideas are present in one flow: Safety Check, fuel-aware decision, and Good Samaritan response.
- Every new visible control performs a real frontend action.
- All data is honest seeded demo data; no screen implies a live government, utility, or AI integration.
- The existing reservation, rider, QR handoff, completion, Requests, Network, Activity, and Menu flow stays intact.
