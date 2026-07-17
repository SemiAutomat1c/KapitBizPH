# KapitBiz Relay Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible multi-area hackathon shell with a connected, offline-safe six-step KapitBiz Relay rescue app faithful to the Stitch mobile references and readable on a projector.

**Architecture:** `app/page.tsx` remains a Server Component and renders one client boundary, `KapitBizRelayApp`. Pure domain calculations and versioned persistence live in `lib/kapitbiz.ts`; focused screen components receive state and callbacks. Mapbox is optional presentation infrastructure with a bundled schematic fallback, while list view remains the complete decision path.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Tailwind CSS 4 plus a scoped CSS module, Vitest, Testing Library, Lucide React, Mapbox GL JS, QRCode, localStorage.

## Global Constraints

- The judge-facing route contains only KapitBiz Relay.
- The flow is `incident -> triage -> capacity -> reservation -> handoff -> complete`.
- No preparedness checklist, readiness score, disaster tips, or generic dashboard.
- Incidents, hosts, routes, availability, and transactions are labeled simulated demo data.
- No live directions, traffic, geocoding, utility, government, courier, insurer, lender, or assistance integration.
- List view is the default and the full rescue remains usable without Mapbox or internet access.
- Mobile follows the six Stitch references; desktop uses a two-column operational layout without a phone frame.
- Values remain consistent: PHP 21,800 at risk; 42 kg and PHP 16,500 selected; PHP 300 storage; PHP 150 transport; PHP 450 total.
- Geist is used for UI text and JetBrains Mono for currency, quantity, weight, time, and identifiers.
- Interactive targets are at least 44 px and all flows support keyboard focus and reduced motion.
- Do not store a Mapbox token in source, Markdown, Obsy, or generated artifacts.
- No Git metadata exists in the project root or `web`; each task ends with a test/build checkpoint instead of a commit.

---

## File Structure

### Create

- `web/components/kapitbiz/KapitBizRelayApp.tsx` — client flow orchestrator and responsive shell.
- `web/components/kapitbiz/KapitBizRelay.module.css` — scoped Stitch-derived layout and component styles.
- `web/components/kapitbiz/AppChrome.tsx` — header, bottom navigation, incident rail, and progress header.
- `web/components/kapitbiz/ActiveDisruptionScreen.tsx` — simulated incident start screen.
- `web/components/kapitbiz/InventoryTriageScreen.tsx` — inventory selection and quantity controls.
- `web/components/kapitbiz/CapacityMatchScreen.tsx` — list/map host selection.
- `web/components/kapitbiz/CapacityMap.tsx` — optional Mapbox renderer and offline schematic.
- `web/components/kapitbiz/ReservationScreen.tsx` — destination, transport sheet, and cost confirmation.
- `web/components/kapitbiz/HandoffScreen.tsx` — QR handoff, evidence preview, and receiver confirmation.
- `web/components/kapitbiz/RescueCompleteScreen.tsx` — protected-value result, timeline, share, and reset.
- `web/components/kapitbiz/DemoDataNotice.tsx` — consistent simulation disclosure.
- `web/tests/kapitbiz-domain.test.ts` — pure domain and persistence tests.
- `web/tests/kapitbiz-flow.test.tsx` — connected interaction test.
- `web/tests/setup.ts` — DOM matchers and storage cleanup.
- `web/vitest.config.ts` — test aliases and jsdom setup.

### Modify

- `web/app/page.tsx` — render only `KapitBizRelayApp`.
- `web/app/layout.tsx` — Geist/JetBrains Mono variables and KapitBiz metadata.
- `web/app/globals.css` — remove paper/gradient shell and retain minimal global resets and design tokens.
- `web/lib/kapitbiz.ts` — replace the item-by-item prototype model with the complete typed relay domain and hook.
- `web/package.json` and `web/package-lock.json` — Mapbox, Lucide, Vitest, and Testing Library dependencies/scripts.
- `web/README.md` — startup, optional Mapbox token, offline fallback, and demo script.

### Preserve but Remove From Visible Route

- `web/lib/core.ts`
- `web/lib/store.ts`
- `web/components/Dashboard.tsx`
- `web/components/IntakeForm.tsx`
- `web/components/PriceBoard.tsx`
- Existing prototype files under `web/components/kapitbiz/` until their replacements compile.

---

### Task 1: Domain Model, Derived Values, and Persistence

**Files:**
- Modify: `web/lib/kapitbiz.ts`
- Create: `web/tests/kapitbiz-domain.test.ts`
- Create: `web/tests/setup.ts`
- Create: `web/vitest.config.ts`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`

**Interfaces:**
- Produces: `RelayStep`, `RelayDemoState`, `InventoryItem`, `CapacityHost`, `TransportOption`, `createSeedState(now)`, `deriveSelection(state)`, `eligibleHosts(state)`, `calculateReservation(state)`, `relayReducer(state, action)`, and `useKapitBiz()`.
- Storage key: `kapitbiz-relay-v2`.
- Consumers: every later screen and flow test.

- [ ] **Step 1: Install the runtime and test dependencies**

Run:

```bash
cd /Users/ryandeniega/repos/Repo/hackathontagum/web
npm install lucide-react mapbox-gl
npm install --save-dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: dependencies are added to `package.json` and lockfile with no audit-blocking install failure.

- [ ] **Step 2: Add test scripts and Vitest configuration**

Add these scripts to `web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Create `web/tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

afterEach(() => {
  window.localStorage.clear();
});
```

- [ ] **Step 3: Write failing domain tests**

Create `web/tests/kapitbiz-domain.test.ts` with tests that assert:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateReservation,
  createSeedState,
  deriveSelection,
  eligibleHosts,
  relayReducer,
} from "@/lib/kapitbiz";

describe("KapitBiz relay domain", () => {
  it("starts with the approved demo totals", () => {
    const state = createSeedState(1_000_000);
    expect(state.step).toBe("incident");
    expect(state.inventory.reduce((sum, item) => sum + item.totalValue, 0)).toBe(21_800);
    expect(deriveSelection(state)).toMatchObject({
      selectedGroups: 3,
      selectedWeightKg: 42,
      selectedValue: 16_500,
    });
  });

  it("clamps inventory quantity and recalculates value", () => {
    const state = createSeedState(1_000_000);
    const next = relayReducer(state, { type: "set-quantity", itemId: "ice-cream", quantity: 999 });
    expect(next.inventory.find((item) => item.id === "ice-cream")?.selectedQuantity).toBe(18);
    expect(deriveSelection(next).selectedValue).toBe(19_300);
  });

  it("rejects hosts without enough capacity", () => {
    const state = createSeedState(1_000_000);
    expect(eligibleHosts(state).map((host) => host.id)).toEqual(["northline", "tagum-north"]);
  });

  it("calculates the approved PHP 450 reservation", () => {
    const state = createSeedState(1_000_000);
    const withHost = relayReducer(state, { type: "select-host", hostId: "northline" });
    const withTransport = relayReducer(withHost, { type: "select-transport", transportId: "rider" });
    expect(calculateReservation(withTransport)).toEqual({ storageFee: 300, transportFee: 150, total: 450 });
  });

  it("guards invalid forward transitions", () => {
    const state = createSeedState(1_000_000);
    expect(relayReducer(state, { type: "go-to", step: "complete" }).step).toBe("incident");
  });
});
```

- [ ] **Step 4: Run tests and confirm they fail for missing exports**

Run: `cd web && npm test -- tests/kapitbiz-domain.test.ts`

Expected: FAIL because the new domain exports do not exist.

- [ ] **Step 5: Implement the typed reducer, calculations, persistence, and hook**

Use these exact public shapes in `web/lib/kapitbiz.ts`:

```ts
export type RelayStep = "incident" | "triage" | "capacity" | "reservation" | "handoff" | "complete";

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  availableQuantity: number;
  selectedQuantity: number;
  unitValue: number;
  unitWeightKg: number;
  totalValue: number;
  rescueWindowMinutes: number | null;
  selected: boolean;
}

export interface CapacityHost {
  id: string;
  name: string;
  locality: string;
  coordinates: [number, number];
  capacityKg: number;
  distanceKm: number;
  transferMinutes: number;
  windowHours: number;
  fee: number;
  outsideAffectedArea: boolean;
  reason: string;
}

export interface TransportOption {
  id: string;
  name: string;
  arrivalMinutes: number;
  fee: number;
  capacityKg: number;
}

export interface RelayDemoState {
  version: 2;
  step: RelayStep;
  scenarioStartedAt: number;
  inventory: InventoryItem[];
  hosts: CapacityHost[];
  transportOptions: TransportOption[];
  selectedHostId: string | null;
  selectedTransportId: string | null;
  reservationConfirmedAt: number | null;
  handoffId: string | null;
  receiverConfirmedAt: number | null;
}

export type RelayAction =
  | { type: "start-rescue" }
  | { type: "go-to"; step: RelayStep }
  | { type: "toggle-item"; itemId: string }
  | { type: "set-quantity"; itemId: string; quantity: number }
  | { type: "select-host"; hostId: string }
  | { type: "select-transport"; transportId: string }
  | { type: "confirm-reservation"; at: number }
  | { type: "confirm-receiver"; at: number }
  | { type: "reset"; at: number };
```

Implement `createSeedState` with these exact quantities so all visible totals reconcile:

```ts
[
  { id: "ice-cream", availableQuantity: 18, selectedQuantity: 11, unit: "tubs", unitValue: 400, unitWeightKg: 5 / 11, totalValue: 7_200, selected: true },
  { id: "frozen-chicken", availableQuantity: 30, selectedQuantity: 25, unit: "kg", unitValue: 280, unitWeightKg: 1, totalValue: 8_400, selected: true },
  { id: "processed-meat", availableQuantity: 12, selectedQuantity: 12, unit: "kg", unitValue: 425, unitWeightKg: 1, totalValue: 5_100, selected: true },
  { id: "canned-goods", availableQuantity: 40, selectedQuantity: 0, unit: "units", unitValue: 27.5, unitWeightKg: 0.4, totalValue: 1_100, selected: false },
]
```

Available inventory totals PHP 21,800. Selected inventory totals 42 kg and PHP 16,500. Implement transition guards so each forward step requires its preceding data. `useKapitBiz` hydrates from `kapitbiz-relay-v2`, catches JSON/shape failures, persists after hydration, and exposes `{ state, dispatch, selection, reservation, eligibleHosts, resetDemo }`.

- [ ] **Step 6: Run domain tests**

Run: `cd web && npm test -- tests/kapitbiz-domain.test.ts`

Expected: all domain tests PASS.

- [ ] **Step 7: Checkpoint the domain layer**

Run: `cd web && npm run lint -- lib/kapitbiz.ts tests/kapitbiz-domain.test.ts`

Expected: exit code 0.

---

### Task 2: KapitBiz-Only Shell and Active Incident Screen

**Files:**
- Create: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Create: `web/components/kapitbiz/KapitBizRelay.module.css`
- Create: `web/components/kapitbiz/AppChrome.tsx`
- Create: `web/components/kapitbiz/ActiveDisruptionScreen.tsx`
- Create: `web/components/kapitbiz/DemoDataNotice.tsx`
- Modify: `web/app/page.tsx`
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`

**Interfaces:**
- Consumes: `useKapitBiz()` and `RelayStep` from Task 1.
- Produces: `KapitBizRelayApp`, shared `AppHeader`, `IncidentRail`, `ProgressHeader`, and `BottomNav`.

- [ ] **Step 1: Write a failing shell test**

Create `web/tests/kapitbiz-flow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";

describe("KapitBiz Relay flow", () => {
  it("opens directly to the simulated incident", () => {
    render(<KapitBizRelayApp />);
    expect(screen.getByRole("heading", { name: "KapitBiz Relay" })).toBeInTheDocument();
    expect(screen.getByText("₱21,800")).toBeInTheDocument();
    expect(screen.queryByText("KiloKita")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the shell test and verify failure**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx`

Expected: FAIL because `KapitBizRelayApp` does not exist.

- [ ] **Step 3: Implement the server/client boundary and fonts**

Make `web/app/page.tsx` a Server Component:

```tsx
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";

export default function Page() {
  return <KapitBizRelayApp />;
}
```

In `web/app/layout.tsx`, configure `Geist` and `JetBrains_Mono` from `next/font/google` as CSS variables and set metadata title to `KapitBiz Relay` and description to `Regional operating-capacity rescue for Davao MSMEs`.

- [ ] **Step 4: Implement app chrome and the incident screen**

Create the client entry with this orchestration shape:

```tsx
"use client";

const stepOrder: RelayStep[] = ["incident", "triage", "capacity", "reservation", "handoff", "complete"];

function previousStep(step: RelayStep): RelayStep {
  return stepOrder[Math.max(0, stepOrder.indexOf(step) - 1)];
}

export default function KapitBizRelayApp() {
  const relay = useKapitBiz();
  return (
    <main className={styles.appShell}>
      <IncidentRail state={relay.state} selection={relay.selection} />
      <section className={styles.workspace}>
        <AppHeader step={relay.state.step} onBack={() => relay.dispatch({ type: "go-to", step: previousStep(relay.state.step) })} />
        {relay.state.step === "incident" && (
          <ActiveDisruptionScreen
            state={relay.state}
            onStart={() => relay.dispatch({ type: "start-rescue" })}
          />
        )}
      </section>
    </main>
  );
}
```

The incident screen renders the Stitch values, countdown, merchant, one `Start inventory rescue` button, and `Simulated demo event` disclosure. `BottomNav` contains Home, Requests, Network, and Activity but only Home is active at this stage.

- [ ] **Step 5: Replace the old paper/gradient visual shell**

Reduce `web/app/globals.css` to Tailwind import, reset, font variables, color tokens, focus-visible rules, and body background `#f7fafa`. Put component layout in `KapitBizRelay.module.css`, including:

```css
.appShell { min-height: 100dvh; background: #f7fafa; color: #181c1d; }
.workspace { min-width: 0; }
.primaryButton { min-height: 48px; border-radius: 6px; background: #006d77; color: #fff; }
@media (min-width: 960px) {
  .appShell { display: grid; grid-template-columns: 320px minmax(0, 1fr); }
  .workspace { max-width: 920px; width: 100%; margin: 0 auto; }
}
@media (prefers-reduced-motion: reduce) {
  .appShell *, .appShell *::before, .appShell *::after { scroll-behavior: auto; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 6: Run shell test, lint, and build**

Run:

```bash
cd web
npm test -- tests/kapitbiz-flow.test.tsx
npm run lint
npm run build
```

Expected: shell test passes, lint exits 0, production build exits 0.

---

### Task 3: Interactive Inventory Triage

**Files:**
- Create: `web/components/kapitbiz/InventoryTriageScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-flow.test.tsx`

**Interfaces:**
- Consumes: `state.inventory`, `selection`, and `dispatch` from `useKapitBiz`.
- Produces: selected item groups, weight, and value used by capacity matching.

- [ ] **Step 1: Extend the flow test with triage behavior**

Add a test that starts rescue, verifies `42 kg | ₱16,500`, deselects Ice cream, verifies the totals change, reselects it, and reduces quantity with the labeled decrement button. Verify `Find rescue capacity` is enabled when inventory is selected and disabled when every group is deselected.

Use accessible names:

```tsx
await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
expect(screen.queryByText("₱16,500")).not.toBeInTheDocument();
await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
expect(screen.getByRole("button", { name: /find rescue capacity/i })).toBeEnabled();
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx`

Expected: FAIL because the triage screen is not rendered.

- [ ] **Step 3: Implement the inventory list and sticky action area**

Render one semantic list row per inventory group with checkbox, rescue-window badge, right-aligned value/quantity, decrement/increment controls, and safe-stock state. Use `aria-live="polite"` for selected totals. Disable `Find rescue capacity` when `selectedGroups === 0` and render `Select at least one inventory group to continue.`

The mobile action summary is sticky above bottom navigation; desktop keeps it in normal document flow. No card is nested inside another card.

- [ ] **Step 4: Run the triage test and domain tests**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx tests/kapitbiz-domain.test.ts`

Expected: all tests PASS.

---

### Task 4: Capacity Matches, Real Mapbox View, and Offline Schematic

**Files:**
- Create: `web/components/kapitbiz/CapacityMatchScreen.tsx`
- Create: `web/components/kapitbiz/CapacityMap.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-flow.test.tsx`

**Interfaces:**
- Consumes: selected weight/value, `eligibleHosts`, all seeded hosts, `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Produces: `selectedHostId` and transition to reservation.

- [ ] **Step 1: Add failing list/map parity tests**

Add tests that assert:

```tsx
expect(screen.getByText("Northline Cold Storage")).toBeInTheDocument();
expect(screen.getByText("28 km away")).toBeInTheDocument();
expect(screen.getByText("38 min transfer")).toBeInTheDocument();
expect(screen.getByText("Only 20 kg free")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Map" }));
expect(screen.getByText(/offline route schematic/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /select northline cold storage/i })).toBeEnabled();
```

The test environment has no Mapbox token, so it must exercise the fallback.

- [ ] **Step 2: Run the capacity test and verify failure**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx`

Expected: FAIL because capacity matching and map components do not exist.

- [ ] **Step 3: Implement ranked list view**

Render Northline as recommended with capacity, distance, transfer time, window, fee, simulated network verification, and outside-affected-area explanation. Render alternatives as rows with explicit `Capacity gap` or `Long route` reasons. Only eligible hosts expose a select/reserve action.

- [ ] **Step 4: Implement Mapbox with guarded initialization**

`CapacityMap` accepts:

```ts
interface CapacityMapProps {
  origin: [number, number];
  hosts: CapacityHost[];
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
}
```

Import `mapbox-gl/dist/mapbox-gl.css` from `CapacityMap.tsx`. In a client effect, read `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` directly. When present, dynamically import `mapbox-gl`, create the map, add origin/host markers, and add one GeoJSON route source/layer after `load`. Clean up with `map.remove()` on unmount. On missing token, initialization error, or map `error`, render the local schematic instead.

The schematic uses normal HTML/CSS markers and a route line, includes `Offline route schematic`, and exposes the same host-selection buttons. It must not rely on external images or tiles.

- [ ] **Step 5: Run capacity tests without a token**

Run: `cd web && env -u NEXT_PUBLIC_MAPBOX_TOKEN npm test -- tests/kapitbiz-flow.test.tsx`

Expected: fallback test PASS and host selection advances to reservation.

- [ ] **Step 6: Run production build without a token**

Run: `cd web && env -u NEXT_PUBLIC_MAPBOX_TOKEN npm run build`

Expected: build exits 0; no token is required at build time.

---

### Task 5: Reservation, Transport Sheet, and Cost Summary

**Files:**
- Create: `web/components/kapitbiz/ReservationScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-flow.test.tsx`

**Interfaces:**
- Consumes: selected host, inventory, transport options, and `calculateReservation`.
- Produces: selected transport, reservation timestamp, handoff ID, and transition to handoff.

- [ ] **Step 1: Add a failing reservation test**

Advance through capacity, then assert:

```tsx
expect(screen.getByText("₱300.00")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /choose transport/i }));
expect(screen.getByRole("dialog", { name: "Transport Selection" })).toBeInTheDocument();
await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
await user.click(screen.getByRole("button", { name: /use selected transport/i }));
expect(screen.getByText("₱450.00")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /confirm rescue reservation/i })).toBeEnabled();
```

- [ ] **Step 2: Run the reservation test and verify failure**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx`

Expected: FAIL because reservation content and dialog do not exist.

- [ ] **Step 3: Implement reservation details and accessible transport sheet**

Render the selected host, 42 kg, 12 hours, PHP 300, selected items, custody summary, and pickup deadline. `TransportSheet` uses `role="dialog"`, `aria-modal="true"`, a labeled heading, radio controls, Escape close, focus trap, and focus restoration. Confirmation remains disabled until a transport option is selected.

- [ ] **Step 4: Implement cost calculation and confirmation**

Display storage and transport as separate rows and PHP 450 as the total. Confirming dispatches `{ type: "confirm-reservation", at: Date.now() }`, creates the deterministic demo handoff ID in the reducer, and advances to handoff.

- [ ] **Step 5: Run reservation and domain tests**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx tests/kapitbiz-domain.test.ts`

Expected: all tests PASS.

---

### Task 6: QR Handoff, Evidence, Completion, and Sharing

**Files:**
- Create: `web/components/kapitbiz/HandoffScreen.tsx`
- Create: `web/components/kapitbiz/RescueCompleteScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-flow.test.tsx`

**Interfaces:**
- Consumes: confirmed reservation, handoff ID, selected inventory, selected host, and QRCode package.
- Produces: receiver confirmation, final audit timeline, share summary, and reset.

- [ ] **Step 1: Add a failing completion test**

Complete the preceding steps, then assert:

```tsx
expect(screen.getByText(/waiting for receiver confirmation/i)).toBeInTheDocument();
expect(screen.getByAltText("KapitBiz handoff QR code")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: /confirm inventory received/i }));
expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
expect(screen.getByText("Chain of custody verified")).toBeInTheDocument();
expect(screen.getByText("₱450 rescue cost")).toBeInTheDocument();
```

- [ ] **Step 2: Run the completion test and verify failure**

Run: `cd web && npm test -- tests/kapitbiz-flow.test.tsx`

Expected: FAIL because handoff/completion screens do not exist.

- [ ] **Step 3: Implement real client-side QR rendering with fallback**

Use the existing `qrcode` dependency:

```ts
const payload = JSON.stringify({
  id: state.handoffId,
  sender: "Maya's Frozen Goods",
  receiver: selectedHost.name,
  value: selection.selectedValue,
  weightKg: selection.selectedWeightKg,
});

QRCode.toDataURL(payload, { width: 320, margin: 2, color: { dark: "#00535b", light: "#ffffff" } })
  .then(setQrDataUrl)
  .catch(() => setQrDataUrl(null));
```

If generation fails, show the handoff ID and manual receiver-confirmation action. Never block the flow on QR rendering.

- [ ] **Step 4: Implement temporary evidence preview**

Provide a labeled file input accepting images. Create an object URL for the selected file, revoke the previous URL on replacement/unmount, and state `Evidence preview stays on this device and is not uploaded.` Include a bundled neutral evidence tile when no photo is selected.

- [ ] **Step 5: Implement completion, audit timeline, sharing, and reset**

Render PHP 16,500 protected, 42 kg, 12 hours, PHP 450 rescue cost, selected host, pickup deadline, and timestamps for rescue initiated, arrival, and transfer confirmed. Share text is:

```text
KapitBiz Relay demo record RE-4892-X: PHP 16,500 of inventory, 42 kg, transferred from Maya's Frozen Goods to Northline Cold Storage. Simulated demo transaction.
```

Use `navigator.share` when available; otherwise use `navigator.clipboard.writeText`. Render inline success/error text. Reset dispatches `{ type: "reset", at: Date.now() }` and returns to incident.

- [ ] **Step 6: Run the complete test suite**

Run: `cd web && npm test`

Expected: all domain and flow tests PASS.

---

### Task 7: Documentation, Responsive QA, and Final Verification

**Files:**
- Modify: `web/README.md`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: implementation files only where QA exposes defects.

**Interfaces:**
- Consumes: the completed app.
- Produces: a reproducible demo command, optional Mapbox setup, screenshots, and verified mobile/desktop behavior.

- [ ] **Step 1: Document local and Mapbox startup**

Add exact commands to `web/README.md`:

```bash
npm install
npm run dev
```

Document optional `web/.env.local`:

```text
NEXT_PUBLIC_MAPBOX_TOKEN=your_public_scoped_token
```

State that the app defaults to list view and uses an offline schematic when the token or tiles are unavailable. Do not include a real token.

- [ ] **Step 2: Run all static and automated verification**

Run:

```bash
cd web
npm test
npm run lint
npm run build
```

Expected: every command exits 0.

- [ ] **Step 3: Start a dedicated development server**

Run: `cd web && npm run dev -- --port 3017`

Expected: Next.js reports a local URL at `http://localhost:3017` and remains running for browser QA.

- [ ] **Step 4: Verify the full flow at mobile size**

At 390 x 844, complete all six steps. Capture screenshots for incident, triage, capacity list, capacity fallback map, reservation sheet, QR handoff, and completion. Verify fixed action areas do not cover content, every list can scroll to its final item, text fits, and bottom navigation respects safe-area padding.

- [ ] **Step 5: Verify tablet and desktop layouts**

At 768 x 1024, confirm the compact progress header replaces the desktop rail. At 1440 x 900, confirm the incident/progress rail and active workspace are both visible, headings remain compact, the map is nonblank or visibly in fallback mode, and no phone frame or marketing shell appears.

- [ ] **Step 6: Verify offline behavior**

Disable browser network access, reload the app, and complete the rescue from list view. Open Map and confirm the local route schematic appears. Refresh during triage and reservation to confirm versioned localStorage restores valid progress without contradictory totals.

- [ ] **Step 7: Final completion gate**

Run again after any QA fixes:

```bash
cd web
npm test && npm run lint && npm run build
```

Expected: exit code 0, PHP 16,500 final value, PHP 450 rescue cost, and no checklist/readiness UI anywhere in the visible app.
