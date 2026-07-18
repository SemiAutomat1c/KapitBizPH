# KapitBiz Relay Complete Demo Navigation Design

## Purpose

Turn the current rescue transaction prototype into a complete frontend-only product demo. Every visible navigation item must open a real screen, while the core story remains an inventory rescue transaction rather than a preparedness checklist.

The demo covers Maya's merchant journey from onboarding through rescue completion. Short host and rider confirmation views demonstrate the relay network without creating three separate applications.

## Product Boundary

- Frontend-only, using seeded scenario data and browser `localStorage`.
- No real authentication, backend, live capacity, utility feed, routing, payment, food-safety validation, or institutional approval claim.
- Merchant is the primary role.
- Host and rider are compact role previews tied to the active rescue.
- Existing approved Tagum-Panabo values and rescue rules remain unchanged.
- Only **Reset demo** starts a fresh incident and clears the demo session.

## Experience Map

### Entry

1. **Splash**
   - KapitBiz Relay identity and a short loading transition.
   - Automatically continues to onboarding or the last persisted screen.

2. **Onboarding: Protect what is at risk**
   - Explains that the product identifies perishable inventory exposed by a disruption.

3. **Onboarding: Relay to available capacity**
   - Explains storage matching, transport reservation, and the Tagum-Panabo relay.

4. **Onboarding: Verify the handoff**
   - Explains QR custody evidence and the protected-value record.

5. **Role selection**
   - Merchant is the recommended primary role.
   - Storage Host and Rider are available as preview roles.

6. **Business setup**
   - Seeded fields for Maya's Frozen Goods, Tagum City, frozen-goods category, and contact person.
   - Continue enters the merchant Home screen.

### Merchant Application

1. **Home**
   - Merchant identity and current operating status.
   - Active localized interruption with the PHP21,800 at-risk summary.
   - Primary Start or Resume Rescue action.
   - Compact cards for active request, network capacity, and protected value.

2. **Requests**
   - Segmented Active, Pending, and Completed views.
   - Active request opens the exact current rescue step.
   - Completed request opens the custody record.
   - Seeded historical rows make the product feel operational without implying a live backend.

3. **Network**
   - List and map presentation for vetted storage hosts and transport partners.
   - Northline, Tagum North, South Market, Davao Regional Hub, and rider data reuse the rescue domain fixtures.
   - Host cards expose capacity, transfer time, fee, availability state, and a View Details action.
   - Network details are explicitly labeled simulated or seeded.

4. **Activity**
   - Chronological transaction feed for request creation, inventory selection, host reservation, rider dispatch, arrival, handoff, and completion.
   - Completed record opens the same exact custody record used by the rescue completion screen.

5. **Menu**
   - Business profile.
   - Switch role preview.
   - Demo and offline status.
   - About this simulated pilot.
   - Reset demo action with confirmation.

### Rescue Transaction

The existing flow remains the primary demo journey:

`Incident -> Inventory triage -> Capacity -> Reservation -> Rider dispatch -> QR handoff -> Host confirmation -> Completion record`

- Entering Rescue hides the standard tab content and prioritizes the active transaction.
- Back returns to the previous rescue step.
- Close returns to Home without discarding progress.
- Refresh restores the active rescue screen directly.
- Completion returns the standard bottom navigation and exposes the record through Home, Requests, and Activity.

### Host and Rider Previews

- **Host preview** shows Northline's incoming reservation, reserved kilograms, arrival estimate, merchant, rider, and Confirm Received action.
- **Rider preview** shows the pickup, destination, payload, fee, vehicle ID, and Mark Arrived action.
- Preview actions update the same simulated custody timeline; they do not create a second independent state model.
- A clear Return to Merchant control returns to Maya's experience.

## Navigation Model

- Bottom navigation items are real buttons: Home, Requests, Network, and Activity.
- The header Menu icon opens the Menu screen.
- The active tab uses `aria-current="page"` and a visible selected state.
- Rescue CTAs enter the transaction surface; tab buttons are unavailable only during reservation and handoff, matching the focused transaction behavior already approved.
- No visible control is styled as interactive unless it performs an action.

## State and Persistence

Add a versioned demo-session state separate from the existing rescue domain state:

```ts
type DemoRole = "merchant" | "host" | "rider";
type MerchantTab = "home" | "requests" | "network" | "activity" | "menu";

interface KapitBizDemoSession {
  version: 1;
  onboardingComplete: boolean;
  businessSetupComplete: boolean;
  role: DemoRole;
  activeTab: MerchantTab;
  rescueOpen: boolean;
}
```

- Demo session uses a new localStorage key and validates stored values before use.
- Rescue state remains under the existing `kapitbiz-relay-v2` key.
- A refresh restores onboarding progress, selected role, current tab, and active rescue state.
- Reset clears both keys and returns to onboarding with a newly timed incident.
- Invalid or older session data falls back to onboarding without damaging the rescue fixture.

## Component Boundaries

- `KapitBizDemoApp`: top-level session and surface orchestrator.
- `OnboardingFlow`: splash, three onboarding slides, role selection, and business setup.
- `MerchantShell`: header, functional bottom navigation, and active tab region.
- `HomeScreen`, `RequestsScreen`, `NetworkScreen`, `ActivityScreen`, `MenuScreen`: focused merchant surfaces.
- `RolePreviewScreen`: host and rider variants driven by the same rescue state.
- `KapitBizRelayApp`: existing rescue transaction, adapted to accept close/navigation callbacks rather than owning unavailable navigation placeholders.

The implementation should reuse the current typography, teal utility palette, spacing, cards, icons, map fallback, and domain-formatting helpers. It must not introduce a marketing landing page, phone frame, nested cards, or a new visual language.

## Empty, Loading, and Error States

- Splash is the only loading surface during demo-session hydration.
- Requests provides explicit seeded empty states for filters with no rows.
- Network always falls back to the offline route schematic when Mapbox is unavailable.
- Missing QR generation retains the existing textual handoff fallback.
- Unsupported browser sharing retains the existing clipboard and exact-record fallback.
- Role-preview actions show local confirmation status and remain reversible through Reset demo.

## Accessibility

- Onboarding supports Back, Next, Skip, and keyboard focus management.
- Tabs expose selected state and move focus to the new screen region.
- Segmented controls expose pressed or selected state.
- Dialogs retain focus trapping, Escape handling, and trigger restoration.
- Every screen has one clear `h2` and a labeled region.
- Status changes use polite live regions where useful and avoid announcing decorative data.
- Touch targets remain at least 44 by 44 pixels.

## Responsive Behavior

- Mobile keeps the existing compact header and bottom navigation.
- Tablet shows the compact progress treatment and wider two-column content where useful.
- Desktop keeps the 320-pixel rescue rail only inside the transaction; merchant tabs use a quiet navigation rail or constrained workspace derived from the current shell.
- No phone frame, marketing hero, horizontal overflow, or action hidden beneath bottom navigation.

## Testing and QA

- Unit tests validate demo-session parsing, persistence, reset, and resume behavior.
- Component tests prove every visible navigation control changes to a real screen.
- Flow tests cover onboarding through Home, entering Rescue, closing and resuming it, host/rider preview actions, and completion record access from three tabs.
- Existing rescue-domain and custody tests remain green.
- Browser QA runs at 390 x 844, 768 x 1024, and 1440 x 900.
- Browser QA verifies every visible button in the primary journey, refresh during onboarding and reservation, offline Network map, focus movement, no horizontal overflow, and no dead controls.

## Success Criteria

- A judge can begin at onboarding and complete the entire merchant rescue without encountering a dead control.
- Home, Requests, Network, Activity, and Menu each provide a meaningful working screen.
- Host and rider previews make the relay model understandable without requiring a backend.
- Refresh resumes the correct demo and rescue progress.
- Reset demo is the only full restart.
- The visible product never becomes a preparedness checklist.
