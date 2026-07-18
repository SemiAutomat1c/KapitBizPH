# KapitBiz Relay Complete Demo Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete frontend-only KapitBiz Relay demo from onboarding through rescue completion, with real Home, Requests, Network, Activity, Menu, Host, and Rider screens and no dead visible controls.

**Architecture:** Add a versioned demo-session reducer and persistence hook alongside the existing rescue-domain hook. A new `KapitBizDemoApp` orchestrates onboarding, merchant tabs, role previews, and the existing rescue transaction without duplicating rescue data. All new surfaces reuse the current CSS module, seeded domain fixtures, offline map, and custody record.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, Lucide React, Mapbox GL JS with offline fallback, QRCode, and browser localStorage.

## Global Constraints

- Frontend-only; do not add authentication, a backend, payments, live capacity, live utility feeds, or institutional approval claims.
- Merchant is the primary role; Host and Rider are compact previews tied to the same rescue state.
- Keep the approved PHP21,800 at-risk value, 42 kg/PHP16,500 selection, PHP300 storage fee, PHP150 rider fee, and PHP450 total.
- Refresh restores onboarding progress, selected role, tab, rider status, active rescue step, and custody state.
- Only **Reset demo** clears both session and rescue state and starts a newly timed incident.
- Every visible control must perform an action; remove any unavailable-menu, unavailable-notification, or unavailable-tab placeholders.
- Keep the existing teal utility palette, typography, compact operational density, 8-pixel-or-less radii, Lucide icons, and offline map fallback.
- Do not add preparedness checklists, marketing pages, phone frames, nested cards, or a second rescue state model.

---

### Task 1: Demo Session Domain and Persistence

**Files:**
- Create: `web/lib/kapitbiz-demo.ts`
- Create: `web/tests/kapitbiz-demo.test.ts`

**Interfaces:**
- Consumes: browser `localStorage`; existing `RelayDemoState` and `RelayAction` remain unchanged.
- Produces: `DemoRole`, `MerchantTab`, `OnboardingStep`, `KapitBizDemoSession`, `DemoSessionAction`, `createDemoSession()`, `demoSessionReducer()`, `useKapitBizDemoSession()`, and `DEMO_SESSION_STORAGE_KEY`.

- [ ] **Step 1: Write failing reducer and persistence tests**

```ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createDemoSession,
  demoSessionReducer,
  DEMO_SESSION_STORAGE_KEY,
  useKapitBizDemoSession,
} from "@/lib/kapitbiz-demo";

describe("KapitBiz demo session", () => {
  it("starts at the first onboarding screen", () => {
    expect(createDemoSession()).toMatchObject({
      version: 1,
      onboardingStep: "protect",
      onboardingComplete: false,
      role: "merchant",
      activeTab: "home",
      rescueOpen: false,
      riderArrivedAt: null,
    });
  });

  it("persists onboarding, tab, and rescue surface changes", async () => {
    const { result } = renderHook(() => useKapitBizDemoSession());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.dispatch({ type: "complete-onboarding" }));
    act(() => result.current.dispatch({ type: "select-tab", tab: "network" }));
    act(() => result.current.dispatch({ type: "open-rescue" }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEMO_SESSION_STORAGE_KEY) ?? "null")).toMatchObject({
        onboardingComplete: true,
        activeTab: "network",
        rescueOpen: true,
      });
    });
  });

  it("rejects corrupt persisted session data", async () => {
    localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ version: 1, activeTab: "fake" }));
    const { result } = renderHook(() => useKapitBizDemoSession());
    await waitFor(() => expect(result.current.session.activeTab).toBe("home"));
  });

  it("records rider arrival once", () => {
    const initial = createDemoSession();
    const arrived = demoSessionReducer(initial, { type: "mark-rider-arrived", at: 1_500_000 });
    expect(demoSessionReducer(arrived, { type: "mark-rider-arrived", at: 1_600_000 }).riderArrivedAt).toBe(1_500_000);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-demo.test.ts`

Expected: FAIL because `@/lib/kapitbiz-demo` does not exist.

- [ ] **Step 3: Implement the versioned session model**

```ts
"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

export const DEMO_SESSION_STORAGE_KEY = "kapitbiz-demo-session-v1";
export type DemoRole = "merchant" | "host" | "rider";
export type MerchantTab = "home" | "requests" | "network" | "activity" | "menu";
export type OnboardingStep = "protect" | "relay" | "verify" | "role" | "business";

export interface KapitBizDemoSession {
  version: 1;
  onboardingStep: OnboardingStep;
  onboardingComplete: boolean;
  businessSetupComplete: boolean;
  role: DemoRole;
  activeTab: MerchantTab;
  rescueOpen: boolean;
  riderArrivedAt: number | null;
}

export type DemoSessionAction =
  | { type: "set-onboarding-step"; step: OnboardingStep }
  | { type: "select-role"; role: DemoRole }
  | { type: "complete-onboarding" }
  | { type: "select-tab"; tab: MerchantTab }
  | { type: "open-rescue" }
  | { type: "close-rescue" }
  | { type: "mark-rider-arrived"; at: number }
  | { type: "reset" };

export function createDemoSession(): KapitBizDemoSession {
  return {
    version: 1,
    onboardingStep: "protect",
    onboardingComplete: false,
    businessSetupComplete: false,
    role: "merchant",
    activeTab: "home",
    rescueOpen: false,
    riderArrivedAt: null,
  };
}

export function demoSessionReducer(
  state: KapitBizDemoSession,
  action: DemoSessionAction,
): KapitBizDemoSession {
  switch (action.type) {
    case "set-onboarding-step": return { ...state, onboardingStep: action.step };
    case "select-role": return { ...state, role: action.role };
    case "complete-onboarding": return { ...state, onboardingComplete: true, businessSetupComplete: state.role === "merchant", activeTab: "home" };
    case "select-tab": return { ...state, activeTab: action.tab, rescueOpen: false };
    case "open-rescue": return { ...state, rescueOpen: true, role: "merchant" };
    case "close-rescue": return { ...state, rescueOpen: false, activeTab: "home" };
    case "mark-rider-arrived": return state.riderArrivedAt === null ? { ...state, riderArrivedAt: action.at } : state;
    case "reset": return createDemoSession();
  }
}
```

Implement shape validation for every enum and primitive before hydrating. `useKapitBizDemoSession()` must expose `{ session, hydrated, dispatch, resetSession }`, gate persistence until hydration, and follow the one-time restoration pattern already used by `useKapitBiz()`.

- [ ] **Step 4: Run focused tests and lint**

Run: `cd web && npm test -- --run tests/kapitbiz-demo.test.ts && npx eslint lib/kapitbiz-demo.ts tests/kapitbiz-demo.test.ts`

Expected: all demo-session tests pass; ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add web/lib/kapitbiz-demo.ts web/tests/kapitbiz-demo.test.ts
git commit -m "feat: add persisted KapitBiz demo session"
```

---

### Task 2: Onboarding and Business Setup

**Files:**
- Create: `web/components/kapitbiz/OnboardingFlow.tsx`
- Create: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Create: `web/tests/kapitbiz-navigation.test.tsx`
- Create: `web/tests/kapitbiz-test-helpers.ts`
- Modify: `web/app/page.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

**Interfaces:**
- Consumes: `useKapitBizDemoSession()` and `DemoSessionAction` from Task 1.
- Produces: `OnboardingFlow({ session, dispatch })`, top-level `KapitBizDemoApp`, and shared test helpers `seedCompletedOnboarding()`, `seedRescueAtCapacity()`, `seedRescueAtHandoff()`, and `createCompleteStateForTest()`.

- [ ] **Step 1: Write failing onboarding tests**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";

describe("KapitBiz complete demo navigation", () => {
  it("completes onboarding and opens Maya's merchant home", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await screen.findByRole("heading", { name: "Protect what is at risk" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Relay to available capacity" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Choose a role" }));
    await user.click(screen.getByRole("button", { name: "Continue as Merchant" }));
    await user.click(screen.getByRole("button", { name: "Enter KapitBiz Relay" }));

    expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
    expect(screen.getByText("Maya's Frozen Goods")).toBeInTheDocument();
  });

  it("resumes the saved onboarding step after remount", async () => {
    localStorage.setItem("kapitbiz-demo-session-v1", JSON.stringify({
      version: 1,
      onboardingStep: "role",
      onboardingComplete: false,
      businessSetupComplete: false,
      role: "merchant",
      activeTab: "home",
      rescueOpen: false,
      riderArrivedAt: null,
    }));
    render(<KapitBizDemoApp />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Choose your demo role" })).toBeInTheDocument());
  });
});
```

Create deterministic shared helpers for later tests:

```ts
import { createDemoSession, DEMO_SESSION_STORAGE_KEY, type KapitBizDemoSession } from "@/lib/kapitbiz-demo";
import { createSeedState, relayReducer, type RelayDemoState } from "@/lib/kapitbiz";

export function seedCompletedOnboarding(overrides: Partial<KapitBizDemoSession> = {}) {
  localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({
    ...createDemoSession(),
    onboardingStep: "business",
    onboardingComplete: true,
    businessSetupComplete: true,
    ...overrides,
  }));
}

export function seedRescueAtCapacity(): RelayDemoState {
  const triage = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
  const capacity = relayReducer(triage, { type: "go-to", step: "capacity" });
  localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(capacity));
  return capacity;
}

export function seedRescueAtHandoff(): RelayDemoState {
  let state = seedRescueAtCapacity();
  state = relayReducer(state, { type: "select-host", hostId: "northline" });
  state = relayReducer(state, { type: "go-to", step: "reservation" });
  state = relayReducer(state, { type: "select-transport", transportId: "rider" });
  state = relayReducer(state, { type: "confirm-reservation", at: 1_000_100 });
  localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(state));
  return state;
}

export function createCompleteStateForTest(): RelayDemoState {
  return relayReducer(seedRescueAtHandoff(), { type: "confirm-receiver", at: 4_300_100 });
}
```

- [ ] **Step 2: Run test and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx`

Expected: FAIL because `KapitBizDemoApp` and `OnboardingFlow` do not exist.

- [ ] **Step 3: Implement the onboarding state machine UI**

`OnboardingFlow.tsx` must render one labeled screen region at a time. Use `ShieldCheck`, `Warehouse`, `QrCode`, `Store`, `Truck`, and `Snowflake` Lucide icons. The button sequence must be:

```ts
const nextStep: Record<OnboardingStep, OnboardingStep | null> = {
  protect: "relay",
  relay: "verify",
  verify: "role",
  role: "business",
  business: null,
};
```

Role selection must expose three real buttons. Merchant advances to business setup; Host and Rider open their preview only after onboarding is complete in Task 6. Business setup renders seeded editable-looking fields with values `Maya's Frozen Goods`, `Tagum City`, `Frozen goods`, and `Maya Dela Cruz`; the only submission side effect is `dispatch({ type: "complete-onboarding" })`.

Each introduction screen includes Back, Next, and Skip. Skip advances to `role`, never directly into the merchant application. Business fields are real labeled inputs backed by local component state so typing works in the demo; submitting them does not call a network service. Selecting Host or Rider dispatches `select-role` followed by `complete-onboarding`, then Task 6 renders the corresponding preview.

- [ ] **Step 4: Wire the top-level page**

```tsx
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";

export default function Page() {
  return <KapitBizDemoApp />;
}
```

`KapitBizDemoApp` must show a neutral `Restoring KapitBiz Relay...` status until the demo session hydrates, then render `OnboardingFlow` until `onboardingComplete` is true.

- [ ] **Step 5: Add responsive onboarding styles**

Add CSS classes for a full-width onboarding surface, constrained 520-pixel content, three stable visual panels, 48-pixel primary actions, compact progress dots, role buttons, and business fields. Use only current palette values: `#006d77`, `#00535b`, `#f7fafa`, `#ffffff`, `#181c1d`, `#bec8ca`, and `#f1f4f4`.

- [ ] **Step 6: Verify tests, lint, and mobile layout**

Run: `cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx && npx eslint components/kapitbiz/OnboardingFlow.tsx components/kapitbiz/KapitBizDemoApp.tsx app/page.tsx`

Expected: onboarding tests pass; ESLint exits 0.

- [ ] **Step 7: Commit**

```bash
git add web/app/page.tsx web/components/kapitbiz/OnboardingFlow.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-navigation.test.tsx web/tests/kapitbiz-test-helpers.ts
git commit -m "feat: add complete KapitBiz onboarding"
```

---

### Task 3: Functional Merchant Shell, Home, and Menu

**Files:**
- Create: `web/components/kapitbiz/MerchantShell.tsx`
- Create: `web/components/kapitbiz/HomeScreen.tsx`
- Create: `web/components/kapitbiz/MenuScreen.tsx`
- Modify: `web/components/kapitbiz/AppChrome.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-navigation.test.tsx`

**Interfaces:**
- Consumes: `MerchantTab`, `DemoRole`, `KapitBizDemoSession`, `DemoSessionAction`, `RelayDemoState`, and `RelaySelection`.
- Produces: `MerchantShell`, a controlled `BottomNav({ activeTab, onSelect })`, `MerchantHeader({ title, onMenu, onNotifications })`, `HomeScreen`, and `MenuScreen`.

- [ ] **Step 1: Write failing functional-navigation tests**

```tsx
it("makes every primary navigation item a working control", async () => {
  seedCompletedOnboarding();
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  for (const [buttonName, heading] of [
    ["Home", "Good morning, Maya"],
    ["Requests", "Rescue requests"],
    ["Network", "Relay network"],
    ["Activity", "Business activity"],
  ] as const) {
    await user.click(await screen.findByRole("button", { name: buttonName }));
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  }
});

it("opens Menu and resumes the active rescue from Home", async () => {
  seedCompletedOnboarding();
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);
  await user.click(await screen.findByRole("button", { name: "Open menu" }));
  expect(screen.getByRole("heading", { name: "Business menu" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Home" }));
  await user.click(screen.getByRole("button", { name: "Start inventory rescue" }));
  expect(screen.getByRole("heading", { name: "Localized power interruption alert" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the navigation test and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx -t "primary navigation|opens Menu"`

Expected: FAIL because the current bottom navigation contains unavailable spans and Menu is static.

- [ ] **Step 3: Replace dead chrome with controlled buttons**

```tsx
export function BottomNav({
  activeTab,
  onSelect,
}: {
  activeTab: Exclude<MerchantTab, "menu">;
  onSelect: (tab: Exclude<MerchantTab, "menu">) => void;
}) {
  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={styles.navItem}
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
```

Delete `Link`, `navItemUnavailable`, and unavailable accessibility copy. `MerchantHeader` uses real icon buttons for Menu and Notifications; Notifications selects Activity.

- [ ] **Step 4: Implement MerchantShell, Home, and Menu**

`MerchantShell` owns no state. It receives `activeTab`, `onSelectTab`, `onOpenMenu`, and a screen child, focuses the labeled tab region after tab changes, and renders BottomNav. Until Tasks 4 and 5 add operational content, Requests, Network, and Activity must render honest seeded empty states with their final headings and a short explanation; they must not render blank regions or unavailable labels.

`HomeScreen` must show:
- `Good morning, Maya`
- Maya's Frozen Goods
- active localized interruption
- PHP21,800 at risk
- Start or Resume Rescue based on `state.step`
- active request, two eligible hosts, and protected-value summary
- View Custody Record after `receiverConfirmedAt` exists

`MenuScreen` must expose real controls for Business profile, Preview Storage Host, Preview Rider, Demo and offline status, About this pilot, and Reset demo. Business profile, Demo status, and About each open a labeled detail dialog or expanded section. Reset opens a confirmation dialog; confirmation invokes a top-level callback that resets both stores.

- [ ] **Step 5: Wire controlled navigation in KapitBizDemoApp**

Use `session.activeTab` as the single tab source of truth. Menu and Notifications dispatch `select-tab`. Home rescue CTA dispatches `open-rescue`; do not mutate rescue state until the user clicks Start Inventory Rescue inside the transaction.

- [ ] **Step 6: Run tests and lint**

Run: `cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx && npx eslint components/kapitbiz/AppChrome.tsx components/kapitbiz/MerchantShell.tsx components/kapitbiz/HomeScreen.tsx components/kapitbiz/MenuScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx`

Expected: functional navigation and Menu tests pass; ESLint exits 0.

- [ ] **Step 7: Commit**

```bash
git add web/components/kapitbiz/AppChrome.tsx web/components/kapitbiz/MerchantShell.tsx web/components/kapitbiz/HomeScreen.tsx web/components/kapitbiz/MenuScreen.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-navigation.test.tsx
git commit -m "feat: make KapitBiz merchant navigation functional"
```

---

### Task 4: Requests and Activity Screens

**Files:**
- Create: `web/components/kapitbiz/RequestsScreen.tsx`
- Create: `web/components/kapitbiz/ActivityScreen.tsx`
- Create: `web/lib/kapitbiz-activity.ts`
- Create: `web/tests/kapitbiz-activity.test.ts`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-navigation.test.tsx`

**Interfaces:**
- Consumes: `RelayDemoState`, `KapitBizDemoSession`, existing time/currency data, and `onOpenRescue`/`onOpenRecord` callbacks.
- Produces: `ActivityItem`, `buildActivityFeed(state, session)`, `RequestsScreen`, and `ActivityScreen`.

- [ ] **Step 1: Write failing activity derivation tests**

```ts
it("builds chronological merchant, rider, and custody events", () => {
  const complete = createCompleteStateForTest();
  const session = { ...createDemoSession(), onboardingComplete: true, riderArrivedAt: 4_200_000 };
  const feed = buildActivityFeed(complete, session);

  expect(feed.map((item) => item.label)).toEqual([
    "Rescue initiated",
    "Northline reserved",
    "Rider dispatched",
    "Rider arrived",
    "Arrival at facility",
    "Transfer confirmed",
  ]);
  expect(feed.every((item, index) => index === 0 || item.at >= feed[index - 1].at)).toBe(true);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-activity.test.ts`

Expected: FAIL because `buildActivityFeed` does not exist.

- [ ] **Step 3: Implement deterministic feed derivation**

```ts
export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  at: number;
  status: "complete" | "current";
}

export function buildActivityFeed(
  state: RelayDemoState,
  session: KapitBizDemoSession,
): ActivityItem[] {
  return candidateEvents(state, session)
    .filter((item): item is ActivityItem => item !== null)
    .sort((left, right) => left.at - right.at);
}
```

Use existing reservation, expected-arrival, and receiver timestamps. Do not generate a new `Date.now()` while deriving the feed.

- [ ] **Step 4: Build Requests and Activity screens**

Requests uses an accessible segmented control for Active, Pending, and Completed. Active shows the current `RE-4892-X` rescue with Resume action. Pending shows one seeded host-confirmation request. Completed shows one seeded historical request plus the active record after completion.

Activity renders the derived chronological feed and one seeded earlier business event. `View custody record` is present only when `receiverConfirmedAt` is non-null and calls the existing record-view callback.

- [ ] **Step 5: Add interaction tests**

Add tests that select all three Request filters, resume the active rescue, open Activity from the header notification button, and open the completed custody record from Activity.

- [ ] **Step 6: Verify tests and lint**

Run: `cd web && npm test -- --run tests/kapitbiz-activity.test.ts tests/kapitbiz-navigation.test.tsx && npx eslint lib/kapitbiz-activity.ts components/kapitbiz/RequestsScreen.tsx components/kapitbiz/ActivityScreen.tsx`

Expected: all focused tests pass; ESLint exits 0.

- [ ] **Step 7: Commit**

```bash
git add web/lib/kapitbiz-activity.ts web/components/kapitbiz/RequestsScreen.tsx web/components/kapitbiz/ActivityScreen.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-activity.test.ts web/tests/kapitbiz-navigation.test.tsx
git commit -m "feat: add rescue requests and activity screens"
```

---

### Task 5: Network Directory and Map

**Files:**
- Create: `web/components/kapitbiz/NetworkScreen.tsx`
- Modify: `web/components/kapitbiz/CapacityMap.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-navigation.test.tsx`

**Interfaces:**
- Consumes: `RelayDemoState.hosts`, `RelayDemoState.transportOptions`, `eligibleHosts(state)`, and the existing `CapacityMap` offline/Mapbox behavior.
- Produces: `NetworkScreen({ state, onStartRequest })` with list, map, details dialog, and partner type filter.

- [ ] **Step 1: Write failing Network tests**

```tsx
it("shows every seeded partner and opens host details", async () => {
  seedCompletedOnboarding({ activeTab: "network" });
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  expect(await screen.findByRole("heading", { name: "Relay network" })).toBeInTheDocument();
  expect(screen.getByText("Northline Cold Storage")).toBeInTheDocument();
  expect(screen.getByText("Tagum North Cold Chain")).toBeInTheDocument();
  expect(screen.getByText("South Market Freezer")).toBeInTheDocument();
  expect(screen.getByText("Davao Regional Hub")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "View Northline Cold Storage details" }));
  expect(screen.getByRole("dialog", { name: "Northline Cold Storage" })).toBeInTheDocument();
});

it("uses the offline network schematic without a Mapbox token", async () => {
  seedCompletedOnboarding({ activeTab: "network" });
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);
  await user.click(await screen.findByRole("button", { name: "Map" }));
  expect(screen.getByRole("region", { name: "Offline route schematic" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run Network tests and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx -t "seeded partner|offline network"`

Expected: FAIL because NetworkScreen does not exist.

- [ ] **Step 3: Implement the directory and details dialog**

NetworkScreen must render:
- Storage and Transport segmented filters
- List and Map segmented presentation
- all four seeded hosts, including ineligible reason labels
- both seeded transport options with capacity, arrival, and fee
- Northline details dialog with simulated-data notice
- Start rescue request action that calls `onStartRequest`

Reuse `CapacityMap` by adding a presentation prop only when needed; do not duplicate Mapbox initialization or offline route markup.

- [ ] **Step 4: Verify list, map, dialog, and focus behavior**

Add tests for dialog initial focus, Escape close, trigger restoration, transport filter, and Start Rescue Request. Run:

`cd web && npm test -- --run tests/kapitbiz-navigation.test.tsx && npx eslint components/kapitbiz/NetworkScreen.tsx components/kapitbiz/CapacityMap.tsx`

Expected: focused tests pass; ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/NetworkScreen.tsx web/components/kapitbiz/CapacityMap.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-navigation.test.tsx
git commit -m "feat: add functional KapitBiz network directory"
```

---

### Task 6: Rescue Integration and Role Previews

**Files:**
- Create: `web/components/kapitbiz/RolePreviewScreen.tsx`
- Create: `web/tests/kapitbiz-role-preview.test.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/AppChrome.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/lib/kapitbiz.ts`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-flow.test.tsx`

**Interfaces:**
- Consumes: existing `useKapitBiz()` state/dispatch, demo-session role and rider arrival state, and the merchant tab callbacks.
- Produces: controlled rescue exit/navigation, `resetRescue()`, and `RolePreviewScreen({ role, state, selection, session, onMarkRiderArrived, onConfirmReceived, onReturn })`.

- [ ] **Step 1: Write failing controlled-rescue and role-preview tests**

```tsx
it("closes the rescue to Home without losing progress", async () => {
  seedCompletedOnboarding({ rescueOpen: true });
  seedRescueAtCapacity();
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);
  expect(await screen.findByRole("heading", { name: "2 matches found" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close rescue" }));
  expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Resume inventory rescue" }));
  expect(screen.getByRole("heading", { name: "2 matches found" })).toBeInTheDocument();
});

it("updates the shared timeline from Rider and Host previews", async () => {
  seedCompletedOnboarding({ role: "rider" });
  seedRescueAtHandoff();
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);
  await user.click(await screen.findByRole("button", { name: "Mark arrived" }));
  expect(screen.getByText("Arrival recorded")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Return to Merchant" }));
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  await user.click(screen.getByRole("button", { name: "Preview Storage Host" }));
  await user.click(screen.getByRole("button", { name: "Confirm inventory received" }));
  expect(screen.getByText("Custody transfer confirmed")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `cd web && npm test -- --run tests/kapitbiz-role-preview.test.tsx tests/kapitbiz-flow.test.tsx`

Expected: role preview tests fail because the preview and controlled rescue APIs do not exist.

- [ ] **Step 3: Expose explicit rescue reset without changing normal refresh behavior**

Extend `useKapitBiz()` with:

```ts
const resetRescue = useCallback(() => {
  const next = createSeedState(Date.now());
  setState(next);
  persistState(next);
}, []);
```

Return `resetRescue` from the hook. It may only be called by the confirmed Reset demo flow. Existing `resetDemo` compatibility may delegate to it.

- [ ] **Step 4: Make rescue chrome controlled and remove dead icons**

`KapitBizRelayApp` accepts:

```ts
interface KapitBizRelayAppProps {
  relay: ReturnType<typeof useKapitBiz>;
  onClose: () => void;
  onNavigate: (tab: Exclude<MerchantTab, "menu">) => void;
  onOpenMenu: () => void;
}
```

The header Menu button calls `onOpenMenu`; Close Rescue calls `onClose`; Notifications calls `onNavigate("activity")`. Bottom navigation, when visible, uses the controlled functional buttons. Preserve the current focused reservation/handoff navigation hiding.

- [ ] **Step 5: Implement host and rider role previews**

Rider preview shows Maya pickup, Northline destination, 42 kg/PHP16,500 payload, PHP150 fee, vehicle `KB-4922`, and Mark Arrived. Host preview shows reserved 42 kg, 12 hours, PHP300, rider ETA, record `RE-4892-X`, and Confirm Inventory Received.

Rider action dispatches `mark-rider-arrived`. Host action dispatches the existing `confirm-receiver` only when the rescue is at handoff; otherwise it displays `Waiting for QR handoff` and leaves state unchanged.

- [ ] **Step 6: Implement atomic Reset demo**

The Menu confirmation callback must call both `resetSession()` and `resetRescue()` in the same event handler, then render onboarding. Add a test proving both localStorage keys return to their initial states and no old completion record survives.

- [ ] **Step 7: Verify the complete automated suite**

Run: `cd web && npm test && npm run lint && npm run build`

Expected: all tests pass, lint has 0 errors, and the production build succeeds.

- [ ] **Step 8: Commit**

```bash
git add web/components/kapitbiz/RolePreviewScreen.tsx web/components/kapitbiz/KapitBizRelayApp.tsx web/components/kapitbiz/AppChrome.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/lib/kapitbiz.ts web/tests/kapitbiz-role-preview.test.tsx web/tests/kapitbiz-flow.test.tsx
git commit -m "feat: connect rescue flow to role previews"
```

---

### Task 7: Full Demo Browser QA and Documentation

**Files:**
- Modify: `web/README.md`
- Modify: `design-qa.md`
- Create: `docs/qa/kapitbiz-complete-demo/viewport-results.json`
- Create: browser-captured evidence under `docs/qa/kapitbiz-complete-demo/`
- Modify: implementation files only where QA exposes a tested defect.

**Interfaces:**
- Consumes: completed onboarding, merchant tabs, role previews, rescue transaction, and reset behavior.
- Produces: reproducible demo instructions and committed mobile/tablet/desktop evidence.

- [ ] **Step 1: Update the demo runbook**

Document the judge path exactly:

```text
Onboarding -> Merchant setup -> Home -> Start rescue -> Triage -> Network match
-> Reservation -> Rider preview -> QR handoff -> Host confirmation
-> Completion -> Requests/Activity record
```

State that the app is frontend-only, seeded, offline-capable, and resumable. Document `Reset demo` as the only full restart.

- [ ] **Step 2: Run static verification before browser QA**

Run: `cd web && npm test && npm run lint && npm run build`

Expected: every command exits 0. Record any unrelated existing warning precisely.

- [ ] **Step 3: Verify the complete mobile journey at 390 x 844**

Start: `cd web && npm run dev -- --port 3017`

Verify with normal controls:
- onboarding Back, Next, role selection, and business setup
- every header and bottom-navigation button
- all Request filters
- Network list, map fallback, partner filters, and details dialog
- rescue close/resume
- transport dialog, QR, host/rider previews, completion, record sharing fallback
- refresh during onboarding, Network, reservation, and completion
- Reset demo returns to onboarding
- no horizontal overflow, clipped text, dead controls, or content hidden by bottom navigation

- [ ] **Step 4: Verify tablet and desktop**

At 768 x 1024, verify compact navigation, readable two-column content where used, dialogs inside viewport, and no desktop rescue rail outside the rescue transaction.

At 1440 x 900, verify merchant navigation and constrained workspace, the 320-pixel rescue rail inside the transaction, nonblank offline map, and no marketing shell or phone frame.

- [ ] **Step 5: Commit QA evidence and measurements**

Save representative screenshots for onboarding, Home, Requests, Network, Activity, Menu, Rider, Host, reservation, QR handoff, and completion. Write measured viewport, overflow, active navigation, dialog geometry, rail, workspace, and map values to `viewport-results.json`.

- [ ] **Step 6: Re-run final gates after QA fixes**

Run:

```bash
cd web
npm test
npm run lint
npm run build
cd ..
git diff --check
```

Expected: tests pass, lint exits 0, build succeeds, diff check is clean, and the visible app contains no unavailable-control labels or preparedness-checklist UI.

- [ ] **Step 7: Commit**

```bash
git add web/README.md design-qa.md docs/qa/kapitbiz-complete-demo web
git commit -m "docs: complete KapitBiz end-to-end demo QA"
```
