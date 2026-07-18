# KapitBiz Hazard Assist Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a demo-first Hazard Assist layer that turns a simulated brownout and flood-risk alert into one Safety Check, a transparent generator-versus-relay decision, nearby Good Samaritan capacity, the existing QR-backed Relay transaction, and a recovery packet preview.

**Architecture:** Keep Hazard Assist in a new versioned localStorage state and hook beside the existing demo-session and Relay states. `KapitBizDemoApp` remains the orchestrator: it opens focused Hazard Assist dialogs, records decision context, and enters the existing Relay reducer without duplicating reservation, rider, handoff, or protected-value data. Activity and completion surfaces consume the Hazard Assist state as optional audit context.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Lucide React, Vitest, Testing Library, browser localStorage, existing Mapbox/offline map and QRCode integrations.

## Global Constraints

- This is a frontend-only demo using seeded events, seeded fuel price, seeded responder capacity, and browser `localStorage`.
- Do not claim live PAGASA, PHIVOLCS, DOE, NGCP, Davao Light, routing, payment, SMS, push, AI model, KYC, SRP, escrow, backend, or government integration.
- Every hazard, fuel, route, availability, trust, and recovery-packet surface must say that it is simulated, seeded, a demo, or a preview.
- Keep the existing Relay reducer as the only owner of inventory, host selection, reservation, rider, QR handoff, receiver confirmation, and protected-value state.
- Do not add a preparedness checklist, generic safety instructions, a new bottom-navigation tab, a landing page, nested cards, decorative gradients, or a phone frame.
- Fuel copy must never advise stockpiling, hoarding, panic buying, or raising crisis prices.
- Good Samaritan capacity is voluntary seeded demo help and must not imply guaranteed rescue.
- Use `Verified demo partner` or `KYC preview`; never say a partner is legally verified.
- Use `Calamity Mode guardrail preview`; never imply official price enforcement.
- Use `Recovery packet preview`; never imply an approved claim, accepted government form, insurance approval, or loan approval.
- Reset demo remains the only full restart and must reset demo-session, Relay, and Hazard Assist state together.
- Preserve all existing onboarding, merchant navigation, host/rider preview, Mapbox fallback, QR handoff, completion, and refresh-resume behavior.
- New dialogs must trap focus, restore the trigger on close, close on Escape, and expose 44 by 44 pixel minimum controls.
- No horizontal overflow at 390 px, 768 px, or 1440 px widths.

## File Structure

- `web/lib/kapitbiz-hazard-assist.ts` - seeded hazard/responder fixtures, state, reducer, parser, calculations, recommendation selector, Relay context selector, and activity-event selector.
- `web/lib/use-hazard-assist.ts` - hydration-gated localStorage persistence and reset API.
- `web/components/kapitbiz/HazardAssistDialog.tsx` - shared accessible modal behavior for all focused Hazard Assist surfaces.
- `web/components/kapitbiz/HazardAlertStrip.tsx` - compact Home entry with simulated-data labels.
- `web/components/kapitbiz/SafetyCheckPanel.tsx` - one operational-safety question and three actions.
- `web/components/kapitbiz/ContinuityDecisionPanel.tsx` - generator versus Relay calculation and recommendation actions.
- `web/components/kapitbiz/CalamityModePreview.tsx` - inline future price-ceiling guardrail disclosure.
- `web/components/kapitbiz/GoodSamaritanPanel.tsx` - deterministic voluntary responder list and Relay selection actions.
- `web/components/kapitbiz/RecoveryPacketPreview.tsx` - post-handoff demo summary.
- `web/components/kapitbiz/KapitBizDemoApp.tsx` - integration orchestrator and the only bridge between Hazard Assist and Relay actions.
- `web/components/kapitbiz/HomeScreen.tsx` - replace the old generic incident panel with the compact Hazard Alert Strip.
- `web/components/kapitbiz/NetworkScreen.tsx` - add the Good Samaritan capacity affordance and preview trust labels.
- `web/components/kapitbiz/RequestsScreen.tsx` - show the Safety Check source label on the active request.
- `web/components/kapitbiz/KapitBizRelayApp.tsx` - show optional source, event, and decision context without owning Hazard Assist state.
- `web/components/kapitbiz/ActivityScreen.tsx` and `web/lib/kapitbiz-activity.ts` - merge Hazard Assist events into the existing custody timeline.
- `web/components/kapitbiz/RescueCompleteScreen.tsx` - expose the recovery packet preview after confirmed receipt.
- `web/components/kapitbiz/KapitBizRelay.module.css` - compact responsive work-surface and dialog styles.
- `web/tests/kapitbiz-hazard-assist.test.ts` - calculation, reducer, parser, persistence, and selector tests.
- `web/tests/kapitbiz-hazard-assist-ui.test.tsx` - focused flow, navigation integration, focus, reset, and preview tests.
- `web/tests/kapitbiz-activity.test.ts` and `web/tests/kapitbiz-navigation.test.tsx` - update existing signatures and regression assertions.
- `web/README.md` - updated judge path, data boundaries, and verification notes.
- `docs/qa/kapitbiz-hazard-assist/` - browser screenshots and concise QA record created during Task 6.

---

### Task 1: Hazard Assist Domain State and Persistence

**Files:**
- Create: `web/lib/kapitbiz-hazard-assist.ts`
- Create: `web/lib/use-hazard-assist.ts`
- Create: `web/tests/kapitbiz-hazard-assist.test.ts`

**Interfaces:**
- Consumes: browser `localStorage`; `RelayDemoState` and `calculateReservation(state)` from `web/lib/kapitbiz.ts`.
- Produces: `SafetyCheckAnswer`, `KapitBizHazardAssistState`, `HazardAssistAction`, `HazardAssistResponder`, `HazardRelayContext`, `HAZARD_ASSIST_STORAGE_KEY`, `SEEDED_HAZARD_EVENT`, `GOOD_SAMARITAN_RESPONDERS`, `createHazardAssistState()`, `hazardAssistReducer(state, action)`, `parseHazardAssistState(value)`, `calculateGeneratorEstimate(inputs)`, `selectContinuityRecommendation(state)`, `buildHazardRelayContext(state)`, and `useHazardAssist()`.

- [ ] **Step 1: Write the failing domain and hook tests**

Create `web/tests/kapitbiz-hazard-assist.test.ts` with these cases:

```ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  GOOD_SAMARITAN_RESPONDERS,
  HAZARD_ASSIST_STORAGE_KEY,
  buildHazardRelayContext,
  calculateGeneratorEstimate,
  createHazardAssistState,
  hazardAssistReducer,
  parseHazardAssistState,
  selectContinuityRecommendation,
} from "@/lib/kapitbiz-hazard-assist";
import { useHazardAssist } from "@/lib/use-hazard-assist";

beforeEach(() => localStorage.clear());

describe("KapitBiz Hazard Assist domain", () => {
  it("calculates the six-hour generator estimate", () => {
    expect(calculateGeneratorEstimate({
      durationHours: 6,
      burnRateLitersPerHour: 1.75,
      fuelPricePhpPerLiter: 68,
    })).toBe(714);
  });

  it("recommends Relay when the seeded Relay estimate is lower", () => {
    expect(selectContinuityRecommendation(createHazardAssistState())).toBe("relay");
  });

  it("records the Safety Check, voluntary responder, and Relay source", () => {
    let state = createHazardAssistState();
    state = hazardAssistReducer(state, { type: "answer-safety-check", answer: "stock-at-risk" });
    state = hazardAssistReducer(state, { type: "ask-good-samaritans", at: 1_000_000 });
    state = hazardAssistReducer(state, { type: "select-good-samaritan", partnerId: "northline" });
    state = hazardAssistReducer(state, { type: "start-relay" });

    expect(state).toMatchObject({
      alertAcknowledged: true,
      safetyCheckAnswer: "stock-at-risk",
      goodSamaritanAskedAt: 1_000_000,
      selectedGoodSamaritanPartnerId: "northline",
      relayStartedFromHazardAssist: true,
    });
    expect(buildHazardRelayContext(state)).toEqual({
      sourceLabel: "Started from Safety Check",
      eventLabel: "Simulated brownout + flood-risk alert",
      decisionNote: "Relay chosen over generator estimate: PHP714",
    });
  });

  it("rejects malformed or stale persisted state", () => {
    expect(parseHazardAssistState({ version: 2 })).toEqual(createHazardAssistState());
    expect(parseHazardAssistState({
      ...createHazardAssistState(),
      safetyCheckAnswer: "evacuate",
    })).toEqual(createHazardAssistState());
    expect(parseHazardAssistState({
      ...createHazardAssistState(),
      selectedGoodSamaritanPartnerId: "unknown-partner",
    })).toEqual(createHazardAssistState());
  });

  it("contains the three deterministic PRD v9 demo responders", () => {
    expect(GOOD_SAMARITAN_RESPONDERS.map((responder) => responder.partnerId)).toEqual([
      "northline",
      "tagum-north",
      "rider",
    ]);
    expect(GOOD_SAMARITAN_RESPONDERS.every((responder) => responder.demoOnly)).toBe(true);
  });

  it("hydrates and persists Hazard Assist independently", async () => {
    const stored = hazardAssistReducer(createHazardAssistState(), {
      type: "answer-safety-check",
      answer: "need-help",
    });
    localStorage.setItem(HAZARD_ASSIST_STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useHazardAssist());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.state.safetyCheckAnswer).toBe("need-help");

    act(() => result.current.dispatch({ type: "select-good-samaritan", partnerId: "northline" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(HAZARD_ASSIST_STORAGE_KEY) ?? "null"))
        .toMatchObject({ selectedGoodSamaritanPartnerId: "northline" });
    });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run from `web/`:

```bash
npm test -- tests/kapitbiz-hazard-assist.test.ts
```

Expected: FAIL because `@/lib/kapitbiz-hazard-assist` and `@/lib/use-hazard-assist` do not exist.

- [ ] **Step 3: Implement the pure domain module**

Create `web/lib/kapitbiz-hazard-assist.ts` with these exact public values and state transitions:

```ts
export const HAZARD_ASSIST_STORAGE_KEY = "kapitbiz-hazard-assist-v1";

export type SafetyCheckAnswer = "unknown" | "safe" | "need-help" | "stock-at-risk";
export type ContinuityRecommendation = "generator" | "relay";

export interface KapitBizHazardAssistState {
  version: 1;
  alertAcknowledged: boolean;
  safetyCheckAnswer: SafetyCheckAnswer;
  generatorEstimatePhp: number;
  relayEstimatePhp: number;
  calamityModePreviewOpen: boolean;
  goodSamaritanAskedAt: number | null;
  selectedGoodSamaritanPartnerId: string | null;
  relayStartedFromHazardAssist: boolean;
  recoveryPacketPreviewOpen: boolean;
}

export interface GeneratorEstimateInputs {
  durationHours: number;
  burnRateLitersPerHour: number;
  fuelPricePhpPerLiter: number;
}

export interface HazardAssistResponder {
  id: string;
  partnerId: "northline" | "tagum-north" | "rider";
  partnerName: string;
  kind: "storage" | "transport";
  offer: string;
  availability: string;
  trustLabel: "Verified demo partner" | "KYC preview";
  demoOnly: true;
}

export interface HazardRelayContext {
  sourceLabel: "Started from Safety Check";
  eventLabel: "Simulated brownout + flood-risk alert";
  decisionNote: "Relay chosen over generator estimate: PHP714";
}

export type HazardAssistAction =
  | { type: "acknowledge-alert" }
  | { type: "answer-safety-check"; answer: Exclude<SafetyCheckAnswer, "unknown"> }
  | { type: "set-calamity-mode-preview"; open: boolean }
  | { type: "ask-good-samaritans"; at: number }
  | { type: "select-good-samaritan"; partnerId: string }
  | { type: "start-relay" }
  | { type: "set-recovery-packet-preview"; open: boolean }
  | { type: "reset" };

export const SEEDED_HAZARD_EVENT = {
  id: "tagum-feeder-flood-demo",
  title: "Simulated brownout + flood-risk alert",
  detail: "Feeder outage expected for 6 hours. Low-lying routes may delay deliveries.",
  location: "Tagum central market area",
  atRiskInventoryPhp: 21_800,
  durationHours: 6,
  burnRateLitersPerHour: 1.75,
  fuelPricePhpPerLiter: 68,
} as const;

export const GOOD_SAMARITAN_RESPONDERS: HazardAssistResponder[] = [
  {
    id: "good-samaritan-northline",
    partnerId: "northline",
    partnerName: "Northline Cold Storage",
    kind: "storage",
    offer: "120 kg temporary freezer capacity",
    availability: "Available for the next 12 hours",
    trustLabel: "Verified demo partner",
    demoOnly: true,
  },
  {
    id: "good-samaritan-tagum-north",
    partnerId: "tagum-north",
    partnerName: "Tagum North Micro-Cold Room",
    kind: "storage",
    offer: "60 kg temporary freezer capacity",
    availability: "Available for the next 8 hours",
    trustLabel: "KYC preview",
    demoOnly: true,
  },
  {
    id: "good-samaritan-rider",
    partnerId: "rider",
    partnerName: "Rider - Logistics Pro",
    kind: "transport",
    offer: "Refrigerated pickup window",
    availability: "Estimated pickup in 30 minutes",
    trustLabel: "Verified demo partner",
    demoOnly: true,
  },
];

export function calculateGeneratorEstimate(inputs: GeneratorEstimateInputs): number {
  const estimate = inputs.durationHours * inputs.burnRateLitersPerHour * inputs.fuelPricePhpPerLiter;
  return Math.round(estimate * 100) / 100;
}

export function createHazardAssistState(): KapitBizHazardAssistState {
  return {
    version: 1,
    alertAcknowledged: false,
    safetyCheckAnswer: "unknown",
    generatorEstimatePhp: calculateGeneratorEstimate(SEEDED_HAZARD_EVENT),
    relayEstimatePhp: 450,
    calamityModePreviewOpen: false,
    goodSamaritanAskedAt: null,
    selectedGoodSamaritanPartnerId: null,
    relayStartedFromHazardAssist: false,
    recoveryPacketPreviewOpen: false,
  };
}

export function hazardAssistReducer(
  state: KapitBizHazardAssistState,
  action: HazardAssistAction,
): KapitBizHazardAssistState {
  switch (action.type) {
    case "acknowledge-alert":
      return { ...state, alertAcknowledged: true };
    case "answer-safety-check":
      return { ...state, alertAcknowledged: true, safetyCheckAnswer: action.answer };
    case "set-calamity-mode-preview":
      return { ...state, calamityModePreviewOpen: action.open };
    case "ask-good-samaritans":
      return {
        ...state,
        alertAcknowledged: true,
        goodSamaritanAskedAt: state.goodSamaritanAskedAt ?? action.at,
      };
    case "select-good-samaritan":
      return GOOD_SAMARITAN_RESPONDERS.some((responder) => responder.partnerId === action.partnerId)
        ? { ...state, selectedGoodSamaritanPartnerId: action.partnerId }
        : state;
    case "start-relay":
      return { ...state, relayStartedFromHazardAssist: true };
    case "set-recovery-packet-preview":
      return { ...state, recoveryPacketPreviewOpen: action.open };
    case "reset":
      return createHazardAssistState();
  }
}

export function selectContinuityRecommendation(
  state: KapitBizHazardAssistState,
): ContinuityRecommendation {
  return state.relayEstimatePhp < state.generatorEstimatePhp ? "relay" : "generator";
}

export function buildHazardRelayContext(
  state: KapitBizHazardAssistState,
): HazardRelayContext | null {
  return state.relayStartedFromHazardAssist
    ? {
        sourceLabel: "Started from Safety Check",
        eventLabel: "Simulated brownout + flood-risk alert",
        decisionNote: "Relay chosen over generator estimate: PHP714",
      }
    : null;
}

export function parseHazardAssistState(value: unknown): KapitBizHazardAssistState {
  if (!isRecord(value) || value.version !== 1) return createHazardAssistState();
  if (typeof value.alertAcknowledged !== "boolean") return createHazardAssistState();
  if (!isSafetyCheckAnswer(value.safetyCheckAnswer)) return createHazardAssistState();
  if (!isFiniteNumber(value.generatorEstimatePhp) || !isFiniteNumber(value.relayEstimatePhp)) return createHazardAssistState();
  if (typeof value.calamityModePreviewOpen !== "boolean") return createHazardAssistState();
  if (!isNullableFiniteNumber(value.goodSamaritanAskedAt)) return createHazardAssistState();
  if (!isNullableResponderId(value.selectedGoodSamaritanPartnerId)) return createHazardAssistState();
  if (typeof value.relayStartedFromHazardAssist !== "boolean") return createHazardAssistState();
  if (typeof value.recoveryPacketPreviewOpen !== "boolean") return createHazardAssistState();
  return value as unknown as KapitBizHazardAssistState;
}

function isSafetyCheckAnswer(value: unknown): value is SafetyCheckAnswer {
  return value === "unknown" || value === "safe" || value === "need-help" || value === "stock-at-risk";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableResponderId(value: unknown): value is string | null {
  return value === null || (
    typeof value === "string"
    && GOOD_SAMARITAN_RESPONDERS.some((responder) => responder.partnerId === value)
  );
}
```

- [ ] **Step 4: Implement the hydration-gated hook**

Create `web/lib/use-hazard-assist.ts`:

```ts
"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  HAZARD_ASSIST_STORAGE_KEY,
  createHazardAssistState,
  hazardAssistReducer,
  parseHazardAssistState,
  type HazardAssistAction,
  type KapitBizHazardAssistState,
} from "@/lib/kapitbiz-hazard-assist";

type HydrateAction = { type: "hydrate"; state: KapitBizHazardAssistState };

function reducer(
  state: KapitBizHazardAssistState,
  action: HazardAssistAction | HydrateAction,
): KapitBizHazardAssistState {
  return action.type === "hydrate" ? action.state : hazardAssistReducer(state, action);
}

function loadHazardAssist(): KapitBizHazardAssistState {
  if (typeof window === "undefined") return createHazardAssistState();
  try {
    const serialized = window.localStorage.getItem(HAZARD_ASSIST_STORAGE_KEY);
    return serialized ? parseHazardAssistState(JSON.parse(serialized) as unknown) : createHazardAssistState();
  } catch {
    return createHazardAssistState();
  }
}

function persistHazardAssist(state: KapitBizHazardAssistState): void {
  try {
    window.localStorage.setItem(HAZARD_ASSIST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be unavailable in constrained or private webviews.
  }
}

export function useHazardAssist() {
  const [state, dispatchInternal] = useReducer(reducer, undefined, createHazardAssistState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatchInternal({ type: "hydrate", state: loadHazardAssist() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistHazardAssist(state);
  }, [hydrated, state]);

  const dispatch = useCallback((action: HazardAssistAction) => dispatchInternal(action), []);
  const resetHazardAssist = useCallback(() => {
    const next = createHazardAssistState();
    dispatchInternal({ type: "hydrate", state: next });
    persistHazardAssist(next);
  }, []);

  return { state, hydrated, dispatch, resetHazardAssist };
}
```

- [ ] **Step 5: Run the focused test and type-aware lint**

Run from `web/`:

```bash
npm test -- tests/kapitbiz-hazard-assist.test.ts
npm run lint -- lib/kapitbiz-hazard-assist.ts lib/use-hazard-assist.ts tests/kapitbiz-hazard-assist.test.ts
```

Expected: all Hazard Assist tests PASS and ESLint reports no errors.

- [ ] **Step 6: Commit the domain slice**

```bash
git add web/lib/kapitbiz-hazard-assist.ts web/lib/use-hazard-assist.ts web/tests/kapitbiz-hazard-assist.test.ts
git commit -m "feat: add Hazard Assist demo state"
```

---

### Task 2: Home Alert, Safety Check, and Fuel-Aware Decision

**Files:**
- Create: `web/components/kapitbiz/HazardAssistDialog.tsx`
- Create: `web/components/kapitbiz/HazardAlertStrip.tsx`
- Create: `web/components/kapitbiz/SafetyCheckPanel.tsx`
- Create: `web/components/kapitbiz/ContinuityDecisionPanel.tsx`
- Create: `web/components/kapitbiz/CalamityModePreview.tsx`
- Create: `web/tests/kapitbiz-hazard-assist-ui.test.tsx`
- Modify: `web/components/kapitbiz/HomeScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`

**Interfaces:**
- Consumes: `useHazardAssist()`, `KapitBizHazardAssistState`, `HazardAssistAction`, `SEEDED_HAZARD_EVENT`, and `selectContinuityRecommendation(state)` from Task 1.
- Produces: `HazardAssistSurface = "closed" | "safety-check" | "decision" | "good-samaritan"`; accessible dialog behavior; Home entry action; Safety Check routing; decision actions used by Task 3.

- [ ] **Step 1: Write failing interaction and accessibility tests**

Start `web/tests/kapitbiz-hazard-assist-ui.test.tsx` with:

```tsx
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import { seedCompletedOnboarding } from "./kapitbiz-test-helpers";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  seedCompletedOnboarding();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("KapitBiz Hazard Assist UI", () => {
  it("turns the compact simulated alert into one Safety Check", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByText("Simulated brownout + flood-risk alert")).toBeInTheDocument();
    expect(screen.getByText("Demo feed")).toBeInTheDocument();
    expect(screen.getByText("Fuel reference")).toBeInTheDocument();
    expect(screen.getByText("Neighbor capacity")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Run Safety Check" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Safety Check" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Is Maya's Frozen Goods safe to operate right now?" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("shows the exact generator and Relay comparison for stock at risk", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await user.click(screen.getByRole("button", { name: "Stock at risk" }));

    expect(screen.getByRole("dialog", { name: "Recommended continuity move" })).toBeInTheDocument();
    expect(screen.getByText("6 hours x 1.75 L/hr x PHP68/L")).toBeInTheDocument();
    expect(screen.getByText("PHP714")).toBeInTheDocument();
    expect(screen.getByText("PHP450")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended: Relay the frozen stock" })).toHaveFocus();
  });

  it("shows the honest Calamity Mode preview and marks the business safe", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await user.click(screen.getByRole("button", { name: "Stock at risk" }));
    await user.click(screen.getByRole("button", { name: "View Calamity Mode" }));
    expect(screen.getByText("Calamity Mode guardrail preview")).toBeInTheDocument();
    expect(screen.getByText(/Future live offers would be checked against official price ceilings/)).toBeInTheDocument();
    expect(screen.getByText("Demo data only.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark safe for now" }));
    expect(screen.queryByRole("dialog", { name: "Recommended continuity move" })).not.toBeInTheDocument();
    expect(screen.getByText("Safety Check recorded: safe for now.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused UI test and confirm it fails**

Run from `web/`:

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx
```

Expected: FAIL because the new alert and panels are not rendered.

- [ ] **Step 3: Build the reusable dialog behavior**

Create `HazardAssistDialog.tsx` with the complete shared focus behavior:

```tsx
"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./KapitBizRelay.module.css";

interface HazardAssistDialogProps {
  label: string;
  focusKey: string;
  onClose: () => void;
  children: ReactNode;
}

export default function HazardAssistDialog({ label, focusKey, onClose, children }: HazardAssistDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef.current;
    return () => {
      window.requestAnimationFrame(() => trigger?.focus());
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-hazard-initial-focus]")?.focus();
  }, [focusKey]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={styles.dialogBackdrop}>
      <section
        ref={dialogRef}
        className={styles.hazardDialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {children}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Build the compact Home alert and focused Safety Check**

`HazardAlertStrip.tsx` must render:

```tsx
<section className={styles.hazardAlertStrip} aria-labelledby="hazard-alert-heading">
  <TriangleAlert aria-hidden="true" />
  <div className={styles.hazardAlertCopy}>
    <p className={styles.eyebrow}>Simulated demo event</p>
    <h3 id="hazard-alert-heading">Simulated brownout + flood-risk alert</h3>
    <p>Feeder outage expected for 6 hours. Low-lying routes may delay deliveries.</p>
    <ul className={styles.hazardChips} aria-label="Hazard Assist demo inputs">
      <li>Demo feed</li><li>Fuel reference</li><li>Neighbor capacity</li>
    </ul>
  </div>
  <button className={styles.hazardAlertAction} type="button" onClick={onRunSafetyCheck}>
    Run Safety Check <ArrowRight aria-hidden="true" />
  </button>
</section>
```

`SafetyCheckPanel.tsx` must render dialog content with a close icon callback and this exact question and actions. The orchestrator owns the single `HazardAssistDialog` wrapper so focus is not restored while the content advances from Safety Check to Decision:

```tsx
<h2 data-hazard-initial-focus tabIndex={-1}>
  Is Maya&apos;s Frozen Goods safe to operate right now?
</h2>
<p>One operational check routes the business to the next continuity action.</p>
<div className={styles.safetyChoices} role="group" aria-label="Safety Check answer">
  <button type="button" aria-pressed={answer === "safe"} onClick={() => onAnswer("safe")}>Safe for now</button>
  <button type="button" aria-pressed={answer === "need-help"} onClick={() => onAnswer("need-help")}>Need help</button>
  <button type="button" aria-pressed={answer === "stock-at-risk"} onClick={() => onAnswer("stock-at-risk")}>Stock at risk</button>
</div>
```

- [ ] **Step 5: Build the decision and Calamity Mode preview**

`ContinuityDecisionPanel.tsx` receives `{ state, onStartRelay, onAskNearbyHosts, onMarkSafe, onClose, onSetCalamityPreview }`. Render a polite live region containing:

```tsx
<h2 data-hazard-initial-focus tabIndex={-1}>Recommended: Relay the frozen stock</h2>
<p>It costs less than running the generator today and gives you a QR custody record.</p>
<div className={styles.continuityOptions} aria-label="Continuity cost comparison">
  <section>
    <span>Run generator</span>
    <strong>PHP714</strong>
    <small>6 hours x 1.75 L/hr x PHP68/L</small>
  </section>
  <section data-recommended="true">
    <span>Relay to cold storage</span>
    <strong>PHP450</strong>
    <small>Seeded storage plus rider reservation</small>
  </section>
</div>
```

Add four working controls: `Start relay`, `Ask nearby hosts`, `View Calamity Mode`, and `Mark safe for now`. `CalamityModePreview.tsx` renders only when `state.calamityModePreviewOpen` and must contain:

```tsx
<aside className={styles.calamityPreview} aria-label="Calamity Mode guardrail preview">
  <strong>Calamity Mode guardrail preview</strong>
  <p>Future live offers would be checked against official price ceilings during declared calamities.</p>
  <small>Demo data only. No official SRP feed or enforcement is connected.</small>
</aside>
```

- [ ] **Step 6: Integrate the Home flow in the orchestrator**

In `KapitBizDemoApp.tsx`:

```tsx
type HazardAssistSurface = "closed" | "safety-check" | "decision" | "good-samaritan";

const hazardAssist = useHazardAssist();
const [hazardSurface, setHazardSurface] = useState<HazardAssistSurface>("closed");
```

Add `hazardAssist.hydrated` to the restore guard. Replace `HomeScreen`'s old localized-interruption panel with `HazardAlertStrip`. Wire actions exactly as follows:

```tsx
const openSafetyCheck = () => {
  hazardAssist.dispatch({ type: "acknowledge-alert" });
  setHazardSurface("safety-check");
};

const answerSafetyCheck = (answer: Exclude<SafetyCheckAnswer, "unknown">) => {
  hazardAssist.dispatch({ type: "answer-safety-check", answer });
  if (answer === "safe") setHazardSurface("closed");
  if (answer === "need-help") {
    hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
    setHazardSurface("good-samaritan");
  }
  if (answer === "stock-at-risk") setHazardSurface("decision");
};
```

When `hazardSurface` is not `closed`, render one stable `HazardAssistDialog` with the matching panel as its child:

```tsx
{hazardSurface !== "closed" ? (
  <HazardAssistDialog
    label={hazardSurface === "safety-check" ? "Safety Check" : "Recommended continuity move"}
    focusKey={hazardSurface}
    onClose={() => setHazardSurface("closed")}
  >
    {hazardSurface === "safety-check" ? (
      <SafetyCheckPanel
        answer={hazardAssist.state.safetyCheckAnswer}
        onAnswer={answerSafetyCheck}
        onClose={() => setHazardSurface("closed")}
      />
    ) : (
      <ContinuityDecisionPanel
        state={hazardAssist.state}
        onStartRelay={() => startRelayFromHazardAssist()}
        onAskNearbyHosts={() => {
          hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
          setHazardSurface("good-samaritan");
        }}
        onMarkSafe={() => answerSafetyCheck("safe")}
        onClose={() => setHazardSurface("closed")}
        onSetCalamityPreview={(open) => hazardAssist.dispatch({ type: "set-calamity-mode-preview", open })}
      />
    )}
  </HazardAssistDialog>
) : null}
```

For Task 2, define the no-partner Relay entry as a complete working callback:

```tsx
const startRelayFromHazardAssist = () => {
  hazardAssist.dispatch({ type: "start-relay" });
  relay.dispatch({ type: "start-rescue" });
  setHazardSurface("closed");
  dispatch({ type: "open-rescue" });
};
```

Task 3 extends this callback with the optional responder parameter while preserving the no-partner path. `HomeScreen` receives the Hazard Assist state and shows `Safety Check recorded: safe for now.` only when the answer is `safe`.

- [ ] **Step 7: Add compact responsive styles**

Add CSS module classes for `hazardAlertStrip`, `hazardAlertCopy`, `hazardAlertAction`, `hazardChips`, `hazardDialog`, `hazardDialogHeader`, `hazardDialogBody`, `safetyChoices`, `continuityOptions`, and `calamityPreview`. Use the existing teal, green, amber, red, white, and neutral tokens already present in the file. Required layout rules:

```css
.hazardAlertStrip { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; }
.hazardAlertAction { min-width: 44px; min-height: 44px; }
.hazardChips { display: flex; flex-wrap: wrap; gap: 6px; }
.hazardDialog { width: min(100%, 640px); max-height: calc(100dvh - 32px); overflow-y: auto; }
.safetyChoices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.continuityOptions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

@media (max-width: 620px) {
  .hazardAlertStrip { grid-template-columns: auto minmax(0, 1fr); }
  .hazardAlertAction { grid-column: 1 / -1; width: 100%; }
  .safetyChoices, .continuityOptions { grid-template-columns: 1fr; }
}
```

- [ ] **Step 8: Run focused tests and commit**

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx
npm run lint -- components/kapitbiz/HazardAssistDialog.tsx components/kapitbiz/HazardAlertStrip.tsx components/kapitbiz/SafetyCheckPanel.tsx components/kapitbiz/ContinuityDecisionPanel.tsx components/kapitbiz/CalamityModePreview.tsx components/kapitbiz/HomeScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-hazard-assist-ui.test.tsx
git add web/components/kapitbiz web/tests/kapitbiz-hazard-assist-ui.test.tsx
git commit -m "feat: add Hazard Assist safety decision flow"
```

Expected: focused tests PASS, lint reports no errors, and the commit includes no unrelated `web/app/layout.tsx` change.

---

### Task 3: Good Samaritan Capacity and Existing Relay Entry

**Files:**
- Create: `web/components/kapitbiz/GoodSamaritanPanel.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/NetworkScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-hazard-assist-ui.test.tsx`
- Modify: `web/tests/kapitbiz-navigation.test.tsx`

**Interfaces:**
- Consumes: `GOOD_SAMARITAN_RESPONDERS`, `HazardAssistResponder`, existing `relay.dispatch`, existing `session.dispatch`, and `HazardAssistSurface` from Task 2.
- Produces: `GoodSamaritanPanel({ selectedPartnerId, onUsePartner, onClose })`; `startRelayFromHazardAssist(partnerId?)`; Network's `onOpenGoodSamaritan` callback.

- [ ] **Step 1: Add failing Good Samaritan and Relay-entry tests**

Append to `web/tests/kapitbiz-hazard-assist-ui.test.tsx`:

```tsx
it("opens voluntary Good Samaritan capacity and enters the existing reservation", async () => {
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
  await user.click(screen.getByRole("button", { name: "Need help" }));

  expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
  expect(screen.getByText("120 kg temporary freezer capacity")).toBeInTheDocument();
  expect(screen.getByText("60 kg temporary freezer capacity")).toBeInTheDocument();
  expect(screen.getByText("Refrigerated pickup window")).toBeInTheDocument();
  expect(screen.getAllByText(/Verified demo partner|KYC preview/)).toHaveLength(3);
  expect(screen.getByText(/Voluntary seeded responses/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Use Northline Cold Storage in Relay" }));
  expect(screen.getByRole("heading", { name: "Confirm reservation" })).toBeInTheDocument();
});

it("opens Good Samaritan capacity from Network", async () => {
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "Network" }));
  await user.click(screen.getByRole("button", { name: "Good Samaritan capacity" }));
  expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
});

it("opens Good Samaritan capacity directly from Home", async () => {
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "View neighbor capacity" }));
  expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
  expect(screen.getByText("Prefilled help request: temporary cold storage for the selected 42 kg frozen-stock relay.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx
```

Expected: FAIL because the responder panel and Network affordance do not exist.

- [ ] **Step 3: Implement the deterministic responder panel**

`GoodSamaritanPanel.tsx` renders content inside the orchestrator's existing `HazardAssistDialog` and maps `GOOD_SAMARITAN_RESPONDERS` into rows. Each row must include `partnerName`, `offer`, `availability`, `trustLabel`, `Simulated availability`, and a button labelled `Use {partnerName} in Relay`. Add this request context and disclosure above the rows:

```tsx
<p className={styles.goodSamaritanRequest}>Prefilled help request: temporary cold storage for the selected 42 kg frozen-stock relay.</p>
<p className={styles.goodSamaritanDisclosure}>
  Voluntary seeded responses from demo network members. Availability is simulated and rescue is not guaranteed.
</p>
```

The `selectedPartnerId` row receives `data-selected="true"`. Do not send notifications or create a second capacity list.

- [ ] **Step 4: Bridge responder selection into the existing Relay reducer**

Add this orchestrator function in `KapitBizDemoApp.tsx`:

```tsx
const startRelayFromHazardAssist = (partnerId?: string) => {
  if (partnerId) {
    hazardAssist.dispatch({ type: "select-good-samaritan", partnerId });
  }
  hazardAssist.dispatch({ type: "start-relay" });
  relay.dispatch({ type: "start-rescue" });

  if (partnerId === "northline" || partnerId === "tagum-north") {
    relay.dispatch({ type: "go-to", step: "capacity" });
    relay.dispatch({ type: "select-host", hostId: partnerId });
    relay.dispatch({ type: "go-to", step: "reservation" });
  }

  setHazardSurface("closed");
  dispatch({ type: "open-rescue" });
};
```

Wire Decision `Start relay` to this function without a partner, Decision `Ask nearby hosts` to record `ask-good-samaritans` and open the panel, and every responder action to pass its `partnerId`. A transport responder enters the existing Relay flow at triage because host selection must remain guarded by the Relay reducer.

Extend the stable dialog branch from Task 2 so `hazardSurface === "good-samaritan"` sets `label="Good Samaritan capacity"` and renders:

```tsx
<GoodSamaritanPanel
  selectedPartnerId={hazardAssist.state.selectedGoodSamaritanPartnerId}
  onUsePartner={startRelayFromHazardAssist}
  onClose={() => setHazardSurface("closed")}
/>
```

- [ ] **Step 5: Add the Network affordance and preview trust copy**

Extend `NetworkScreen` props with `onOpenGoodSamaritan: () => void`. Below the intro, render:

```tsx
<button className={styles.networkAssistAction} type="button" onClick={onOpenGoodSamaritan}>
  <HeartHandshake aria-hidden="true" />
  <span><strong>Good Samaritan capacity</strong><small>View voluntary seeded responses to the simulated alert.</small></span>
  <ArrowRight aria-hidden="true" />
</button>
```

Add `KYC preview` beside the existing eligibility label in storage rows and `Simulated seeded partner data` in the host dialog. Keep list and offline map behavior unchanged.

Also extend `HazardAlertStrip` and `HomeScreen` with `onOpenGoodSamaritan`. Add a secondary `View neighbor capacity` text action beside or below `Run Safety Check`; it records `ask-good-samaritans` and opens the same panel. This satisfies the Home, Safety Check, and Network entry requirements.

- [ ] **Step 6: Add responder and Network styles**

Add `networkAssistAction`, `goodSamaritanDisclosure`, `responderList`, `responderRow`, `responderTrust`, and selected-state classes. Rows remain unframed list items divided by borders; do not put cards inside the dialog. On mobile, place the action below the row copy. On tablet and desktop, keep offer and action scannable on one row.

- [ ] **Step 7: Run tests and commit**

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
npm run lint -- components/kapitbiz/GoodSamaritanPanel.tsx components/kapitbiz/NetworkScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx tests/kapitbiz-hazard-assist-ui.test.tsx
git add web/components/kapitbiz/GoodSamaritanPanel.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/NetworkScreen.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-hazard-assist-ui.test.tsx web/tests/kapitbiz-navigation.test.tsx
git commit -m "feat: connect Good Samaritan capacity to Relay"
```

Expected: all focused tests PASS and existing Relay flow tests remain green.

---

### Task 4: Relay Context, Requests Label, and Unified Activity Evidence

**Files:**
- Modify: `web/lib/kapitbiz-hazard-assist.ts`
- Modify: `web/lib/kapitbiz-activity.ts`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/RequestsScreen.tsx`
- Modify: `web/components/kapitbiz/ActivityScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-activity.test.ts`
- Modify: `web/tests/kapitbiz-hazard-assist-ui.test.tsx`

**Interfaces:**
- Consumes: `buildHazardRelayContext(hazardState)`, `KapitBizHazardAssistState`, existing `RelayDemoState`, and existing `ActivityItem`.
- Produces: `buildHazardActivityItems(hazardState, scenarioStartedAt)` and `buildActivityFeed(relayState, session, hazardState)`; optional `hazardContext` prop on `KapitBizRelayApp`; optional `startedFromHazardAssist` prop on `RequestsScreen`.

- [ ] **Step 1: Write the failing unified-audit test**

Replace the existing `buildActivityFeed` call in `web/tests/kapitbiz-activity.test.ts` and add the Hazard Assist assertions:

```ts
import {
  createHazardAssistState,
  hazardAssistReducer,
} from "@/lib/kapitbiz-hazard-assist";

it("merges Hazard Assist decisions before custody events", () => {
  const complete = createCompleteStateForTest();
  const session = {
    ...createDemoSession(),
    onboardingComplete: true,
    riderArrivedAt: 4_200_000,
  };
  let hazard = createHazardAssistState();
  hazard = hazardAssistReducer(hazard, { type: "acknowledge-alert" });
  hazard = hazardAssistReducer(hazard, { type: "answer-safety-check", answer: "stock-at-risk" });
  hazard = hazardAssistReducer(hazard, { type: "ask-good-samaritans", at: 1_000_020 });
  hazard = hazardAssistReducer(hazard, { type: "start-relay" });

  const feed = buildActivityFeed(complete, session, hazard);

  expect(feed.map((item) => item.label)).toEqual([
    "Simulated alert received",
    "Safety Check answered",
    "Fuel comparison generated",
    "Good Samaritan capacity opened",
    "Relay started from Safety Check",
    "Rescue initiated",
    "Northline reserved",
    "Rider dispatched",
    "Rider arrived",
    "Arrival at facility",
    "Transfer confirmed",
  ]);
});
```

Update the original chronological test to pass `createHazardAssistState()` as the third argument and keep its original six expected labels.

- [ ] **Step 2: Run the activity test and confirm the signature failure**

```bash
npm test -- tests/kapitbiz-activity.test.ts
```

Expected: FAIL because `buildActivityFeed` does not accept Hazard Assist state or produce hazard events.

- [ ] **Step 3: Build deterministic Hazard Assist audit items**

Add `buildHazardActivityItems` to `web/lib/kapitbiz-hazard-assist.ts`. It must derive stable times from `scenarioStartedAt` for boolean state and use `goodSamaritanAskedAt` when available:

```ts
export interface HazardActivityItem {
  id: string;
  label: string;
  detail: string;
  at: number;
}

export function buildHazardActivityItems(
  state: KapitBizHazardAssistState,
  scenarioStartedAt: number,
): HazardActivityItem[] {
  const items: HazardActivityItem[] = [];
  if (state.alertAcknowledged) items.push({
    id: "hazard-alert-received",
    label: "Simulated alert received",
    detail: "Seeded feeder outage and flood-risk route context recorded. Demo data only.",
    at: scenarioStartedAt - 50_000,
  });
  if (state.safetyCheckAnswer !== "unknown") items.push({
    id: "safety-check-answered",
    label: "Safety Check answered",
    detail: `Operational status recorded: ${state.safetyCheckAnswer.replaceAll("-", " ")}.`,
    at: scenarioStartedAt - 40_000,
  });
  if (state.safetyCheckAnswer === "stock-at-risk") items.push({
    id: "fuel-comparison-generated",
    label: "Fuel comparison generated",
    detail: "PHP714 generator estimate compared with the PHP450 seeded Relay estimate.",
    at: scenarioStartedAt - 30_000,
  });
  if (state.goodSamaritanAskedAt !== null) items.push({
    id: "good-samaritan-opened",
    label: "Good Samaritan capacity opened",
    detail: "Voluntary seeded partner capacity was shown; no live notification was sent.",
    at: Math.min(state.goodSamaritanAskedAt, scenarioStartedAt - 20_000),
  });
  if (state.relayStartedFromHazardAssist) items.push({
    id: "relay-started-from-safety-check",
    label: "Relay started from Safety Check",
    detail: "Relay chosen over the PHP714 generator estimate.",
    at: scenarioStartedAt - 10_000,
  });
  return items;
}
```

The negative offsets keep Hazard Assist decisions before the Relay reducer's existing `Rescue initiated` event while preserving deterministic refresh behavior.

- [ ] **Step 4: Merge Hazard Assist and custody events**

Change the public signature in `kapitbiz-activity.ts`:

```ts
export function buildActivityFeed(
  state: RelayDemoState,
  session: KapitBizDemoSession,
  hazardState: KapitBizHazardAssistState,
): ActivityItem[] {
  const hazardItems = buildHazardActivityItems(hazardState, state.scenarioStartedAt)
    .map((item) => ({ ...item, status: "complete" as const }));
  const feed = [...hazardItems, ...candidateEvents(state, session)]
    .filter((item): item is ActivityItem => item !== null)
    .sort((left, right) => left.at - right.at);

  if (state.receiverConfirmedAt === null && feed.length > 0) {
    feed[feed.length - 1] = { ...feed[feed.length - 1], status: "current" };
  }
  return feed;
}
```

Pass `hazardState` from `ActivityScreen` to this function.

- [ ] **Step 5: Show Relay source context without changing Relay state**

Extend `KapitBizRelayAppProps` with `hazardContext: HazardRelayContext | null`. In `KapitBizRelayWorkspace`, render this unframed context band between `AppHeader` and `ProgressHeader` when non-null:

```tsx
<aside className={styles.relayContextBand} aria-label="Hazard Assist rescue context">
  <span>{hazardContext.sourceLabel}</span>
  <strong>{hazardContext.eventLabel}</strong>
  <small>{hazardContext.decisionNote}</small>
</aside>
```

Standalone `KapitBizRelayApp` passes `hazardContext={null}`. `KapitBizDemoApp` passes `buildHazardRelayContext(hazardAssist.state)`. Do not add these fields to `RelayDemoState` or the QR payload.

- [ ] **Step 6: Add Requests and Activity integration tests**

Import `seedRescueAtCapacity` from `kapitbiz-test-helpers`, then append to `web/tests/kapitbiz-hazard-assist-ui.test.tsx`:

```tsx
it("shows all three Hazard Assist context labels inside the existing Relay flow", async () => {
  seedCompletedOnboarding({ rescueOpen: true });
  seedRescueAtCapacity();
  localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
    version: 1,
    alertAcknowledged: true,
    safetyCheckAnswer: "stock-at-risk",
    generatorEstimatePhp: 714,
    relayEstimatePhp: 450,
    calamityModePreviewOpen: false,
    goodSamaritanAskedAt: 900_000,
    selectedGoodSamaritanPartnerId: "northline",
    relayStartedFromHazardAssist: true,
    recoveryPacketPreviewOpen: false,
  }));
  render(<KapitBizDemoApp />);

  expect(await screen.findByText("Started from Safety Check")).toBeInTheDocument();
  expect(screen.getByText("Simulated brownout + flood-risk alert")).toBeInTheDocument();
  expect(screen.getByText("Relay chosen over generator estimate: PHP714")).toBeInTheDocument();
});

it("shows Hazard Assist source in Requests and the unified Activity timeline", async () => {
  localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
    version: 1,
    alertAcknowledged: true,
    safetyCheckAnswer: "stock-at-risk",
    generatorEstimatePhp: 714,
    relayEstimatePhp: 450,
    calamityModePreviewOpen: false,
    goodSamaritanAskedAt: 900_000,
    selectedGoodSamaritanPartnerId: "northline",
    relayStartedFromHazardAssist: true,
    recoveryPacketPreviewOpen: false,
  }));
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "Requests" }));
  expect(screen.getByText("Started from Safety Check")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Activity" }));
  expect(screen.getByText("Simulated alert received")).toBeInTheDocument();
  expect(screen.getByText("Fuel comparison generated")).toBeInTheDocument();
  expect(screen.getByText("Good Samaritan capacity opened")).toBeInTheDocument();
  expect(screen.getByText("Relay started from Safety Check")).toBeInTheDocument();
});
```

Extend `RequestsScreen` with `startedFromHazardAssist: boolean` and render the source in `ActiveRequest` only when true:

```tsx
{startedFromHazardAssist ? <small className={styles.requestSource}>Started from Safety Check</small> : null}
```

- [ ] **Step 7: Run tests and commit**

```bash
npm test -- tests/kapitbiz-activity.test.ts tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx
npm run lint -- lib/kapitbiz-hazard-assist.ts lib/kapitbiz-activity.ts components/kapitbiz/KapitBizRelayApp.tsx components/kapitbiz/RequestsScreen.tsx components/kapitbiz/ActivityScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx
git add web/lib/kapitbiz-hazard-assist.ts web/lib/kapitbiz-activity.ts web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelayApp.tsx web/components/kapitbiz/RequestsScreen.tsx web/components/kapitbiz/ActivityScreen.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-activity.test.ts web/tests/kapitbiz-hazard-assist-ui.test.tsx
git commit -m "feat: add Hazard Assist audit context"
```

Expected: activity ordering, Requests source, Relay context, and the existing QR flow all PASS.

---

### Task 5: Recovery Packet Preview and Three-State Reset

**Files:**
- Create: `web/components/kapitbiz/RecoveryPacketPreview.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelayApp.tsx`
- Modify: `web/components/kapitbiz/RescueCompleteScreen.tsx`
- Modify: `web/components/kapitbiz/ActivityScreen.tsx`
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Modify: `web/tests/kapitbiz-hazard-assist-ui.test.tsx`
- Modify: `web/tests/kapitbiz-navigation.test.tsx`

**Interfaces:**
- Consumes: completed `RelayDemoState`, `RelaySelection`, `KapitBizHazardAssistState`, `set-recovery-packet-preview`, and `resetHazardAssist()`.
- Produces: `RecoveryPacketPreview({ state, selection, hazardState, onClose })`; completion and Activity preview triggers; Reset demo clearing all three stores.

- [ ] **Step 1: Add failing recovery-packet and reset tests**

Append to `web/tests/kapitbiz-hazard-assist-ui.test.tsx`:

```tsx
it("opens an honest recovery packet preview after confirmed handoff", async () => {
  createCompleteStateForTest();
  localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
    version: 1,
    alertAcknowledged: true,
    safetyCheckAnswer: "stock-at-risk",
    generatorEstimatePhp: 714,
    relayEstimatePhp: 450,
    calamityModePreviewOpen: false,
    goodSamaritanAskedAt: 900_000,
    selectedGoodSamaritanPartnerId: "northline",
    relayStartedFromHazardAssist: true,
    recoveryPacketPreviewOpen: false,
  }));
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "Activity" }));
  await user.click(screen.getByRole("button", { name: "Recovery packet preview" }));

  expect(screen.getByRole("dialog", { name: "Recovery packet preview" })).toBeInTheDocument();
  expect(screen.getByText("Maya's Frozen Goods")).toBeInTheDocument();
  expect(screen.getByText("PHP21,800 at-risk inventory baseline")).toBeInTheDocument();
  expect(screen.getByText("Relay chosen over PHP714 generator estimate")).toBeInTheDocument();
  expect(screen.getByText(/QR custody record RE-4892-X/)).toBeInTheDocument();
  expect(screen.getByText(/not an accepted government form or guaranteed claim document/i)).toBeInTheDocument();
});

it("Reset demo clears demo-session, Relay, and Hazard Assist progress", async () => {
  localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
    version: 1,
    alertAcknowledged: true,
    safetyCheckAnswer: "stock-at-risk",
    generatorEstimatePhp: 714,
    relayEstimatePhp: 450,
    calamityModePreviewOpen: true,
    goodSamaritanAskedAt: 900_000,
    selectedGoodSamaritanPartnerId: "northline",
    relayStartedFromHazardAssist: true,
    recoveryPacketPreviewOpen: true,
  }));
  const user = userEvent.setup();
  render(<KapitBizDemoApp />);

  await user.click(await screen.findByRole("button", { name: "Open menu" }));
  await user.click(screen.getByRole("button", { name: "Reset demo" }));
  await user.click(screen.getByRole("button", { name: "Confirm reset demo" }));

  expect(await screen.findByRole("heading", { name: "Protect what is at risk" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("kapitbiz-hazard-assist-v1") ?? "null")).toMatchObject({
    safetyCheckAnswer: "unknown",
    relayStartedFromHazardAssist: false,
    recoveryPacketPreviewOpen: false,
  });
});
```

Import `createCompleteStateForTest` from `kapitbiz-test-helpers` at the top of the test file.

- [ ] **Step 2: Run the focused tests and confirm they fail**

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx
```

Expected: FAIL because the recovery packet control and Hazard Assist reset integration do not exist.

- [ ] **Step 3: Build the recovery packet preview**

`RecoveryPacketPreview.tsx` renders content inside the orchestrator's single `HazardAssistDialog`. Render the following exact evidence groups as an unframed definition list:

```tsx
<h2 data-hazard-initial-focus tabIndex={-1}>Recovery packet preview</h2>
<p>Demo summary compiled from the seeded Hazard Assist and completed Relay record.</p>
<dl className={styles.recoveryPacketList}>
  <div><dt>Business baseline</dt><dd>Maya&apos;s Frozen Goods · PHP21,800 at-risk inventory baseline</dd></div>
  <div><dt>Hazard context</dt><dd>Simulated brownout + flood-risk route</dd></div>
  <div><dt>Continuity decision</dt><dd>Relay chosen over PHP{hazardState.generatorEstimatePhp.toLocaleString("en-PH")} generator estimate</dd></div>
  <div><dt>Handoff evidence</dt><dd>QR custody record {state.handoffId ?? "RE-4892-X"} · PHP{selection.selectedValue.toLocaleString("en-PH")} protected</dd></div>
  <div><dt>Future product step</dt><dd>Exportable packet for recovery-loan or insurance documentation after backend and institutional validation.</dd></div>
</dl>
<aside className={styles.recoveryPacketDisclosure}>
  Preview only. This is not an accepted government form or guaranteed claim document.
</aside>
```

Include a close icon button and a `Close preview` text button; both call `onClose`.

- [ ] **Step 4: Expose the preview from completion and Activity**

Extend `RescueCompleteScreen` with `onOpenRecoveryPacket: () => void` and add a secondary action labelled `Recovery packet preview` below `Share recovery record`. Extend `ActivityScreen` with `hazardState` and `onOpenRecoveryPacket`; show the same action only when `state.receiverConfirmedAt !== null`.

At `KapitBizDemoApp` level, set the persisted open flag before rendering the modal:

```tsx
const openRecoveryPacket = () => {
  hazardAssist.dispatch({ type: "set-recovery-packet-preview", open: true });
};

const closeRecoveryPacket = () => {
  hazardAssist.dispatch({ type: "set-recovery-packet-preview", open: false });
};
```

Render `RecoveryPacketPreview` whenever `hazardAssist.state.recoveryPacketPreviewOpen` and `relay.state.receiverConfirmedAt !== null`, regardless of whether the trigger came from Activity or the completion screen. Reuse the one orchestrator-owned `HazardAssistDialog` with `label="Recovery packet preview"` and `focusKey="recovery-packet"`; do not nest a second dialog inside it.

- [ ] **Step 5: Clear all three state stores from the existing Reset demo action**

Change the existing `resetDemo` callback in `KapitBizDemoApp.tsx` to:

```tsx
const resetDemo = () => {
  setHazardSurface("closed");
  resetSession();
  relay.resetRescue();
  hazardAssist.resetHazardAssist();
};
```

Do not add reset buttons anywhere else.

- [ ] **Step 6: Add preview styles and run regressions**

Add `recoveryPacketList` and `recoveryPacketDisclosure` styles. Use divided rows, compact `dt` labels, readable `dd` text, and the existing amber preview tone. Stack labels and values below 460 px.

Run:

```bash
npm test -- tests/kapitbiz-hazard-assist-ui.test.tsx tests/kapitbiz-navigation.test.tsx tests/kapitbiz-flow.test.tsx tests/kapitbiz-demo.test.ts tests/kapitbiz-activity.test.ts
npm run lint -- components/kapitbiz/RecoveryPacketPreview.tsx components/kapitbiz/RescueCompleteScreen.tsx components/kapitbiz/ActivityScreen.tsx components/kapitbiz/KapitBizDemoApp.tsx
git add web/components/kapitbiz/RecoveryPacketPreview.tsx web/components/kapitbiz/RescueCompleteScreen.tsx web/components/kapitbiz/ActivityScreen.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/KapitBizRelayApp.tsx web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-hazard-assist-ui.test.tsx web/tests/kapitbiz-navigation.test.tsx
git commit -m "feat: add recovery packet preview"
```

Expected: preview and reset tests PASS; onboarding, navigation, QR, and demo-session regressions remain green.

---

### Task 6: Full Verification, Browser QA, and Judge Script

**Files:**
- Modify: `web/README.md`
- Create: `docs/qa/kapitbiz-hazard-assist/README.md`
- Create: `docs/qa/kapitbiz-hazard-assist/home-mobile.png`
- Create: `docs/qa/kapitbiz-hazard-assist/decision-mobile.png`
- Create: `docs/qa/kapitbiz-hazard-assist/good-samaritan-desktop.png`
- Create: `docs/qa/kapitbiz-hazard-assist/relay-context-desktop.png`
- Create: `docs/qa/kapitbiz-hazard-assist/activity-desktop.png`
- Create: `docs/qa/kapitbiz-hazard-assist/recovery-packet-mobile.png`

**Interfaces:**
- Consumes: completed Hazard Assist and Relay demo, existing local server workflow, and the in-app Browser QA skill.
- Produces: reproducible judge path, complete automated verification, mobile/desktop visual evidence, and final demo-boundary documentation.

- [ ] **Step 1: Update the README judge path and boundary statement**

Replace the judge path with:

```text
Onboarding -> Merchant Home -> Run Safety Check -> Stock at risk
-> generator PHP714 vs Relay PHP450 -> Ask nearby hosts
-> Use Northline Cold Storage in Relay -> Reservation -> Rider dispatch
-> QR handoff -> Host confirmation -> PHP protected record
-> Recovery packet preview -> Activity audit trail
```

Add this paragraph below it:

```text
Hazard Assist uses a simulated brownout and flood-risk event, a seeded PHP68/L fuel reference, and voluntary seeded partner responses. It does not connect to a utility, government hazard feed, official SRP source, KYC provider, payment gateway, notification service, insurer, lender, or AI model. Calamity Mode, KYC labels, and the recovery packet are explicitly marked previews.
```

- [ ] **Step 2: Run the complete automated verification suite**

Run from `web/`:

```bash
npm test
npm run lint
npm run build
```

Run from the worktree root:

```bash
git diff --check
git status --short
```

Expected: all tests PASS, lint reports no errors, the production build succeeds, `git diff --check` prints nothing, and `git status --short` shows only expected task files plus the pre-existing unrelated `web/app/layout.tsx` modification.

- [ ] **Step 3: Start the production build for browser QA**

From `web/`:

```bash
npm run start -- --port 3017
```

Expected: Next.js reports `http://localhost:3017` and the server remains running during QA. If 3017 is occupied by the same project, reuse it; if occupied by another process, use the next free port and record it in the QA README.

- [ ] **Step 4: Verify the complete judge flow in the in-app Browser**

Use `browser:control-in-app-browser`. Reset the demo once, complete onboarding as Merchant, and verify this sequence with every control performing an action:

1. Home alert displays all three input chips and `Run Safety Check`.
2. Safety Check opens, receives focus, traps Tab, closes on Escape, and restores focus.
3. `Stock at risk` opens the PHP714 versus PHP450 decision.
4. Calamity Mode expands with preview-only copy.
5. Good Samaritan capacity shows all three responders and voluntary/demo disclosures.
6. Northline selection enters existing `Confirm reservation` with all three Relay context labels.
7. Existing transport, QR handoff, host confirmation, and completion flow still works.
8. Recovery packet opens from completion and Activity and restores focus on close.
9. Requests displays `Started from Safety Check`.
10. Activity displays Hazard Assist rows before Relay custody rows.
11. Refresh preserves Safety Check answer, selected partner, Relay source, and transaction step.
12. Reset demo returns to onboarding and clears all three progress stores.

- [ ] **Step 5: Capture responsive screenshots and inspect layout**

Capture the six named screenshots at these viewports:

- `home-mobile.png`: 390 x 844.
- `decision-mobile.png`: 390 x 844.
- `good-samaritan-desktop.png`: 1440 x 900.
- `relay-context-desktop.png`: 1440 x 900.
- `activity-desktop.png`: 1440 x 900.
- `recovery-packet-mobile.png`: 390 x 844.

Also inspect, without requiring extra committed screenshots, the same flow at 768 x 1024. Confirm no horizontal overflow, clipped button labels, overlapping fixed navigation, nested-card appearance, blank Mapbox area, or dialog content beyond the viewport.

- [ ] **Step 6: Record QA evidence**

Create `docs/qa/kapitbiz-hazard-assist/README.md` with:

```markdown
# KapitBiz Hazard Assist Browser QA

- Build: production Next.js build
- URL: http://localhost:3017
- Viewports: 390x844, 768x1024, 1440x900
- Flow: Safety Check -> fuel decision -> Good Samaritan -> Relay -> QR -> recovery packet
- Result: all visible controls completed their frontend actions; refresh resumed progress; Reset demo cleared all three state stores.
- Data boundary: hazard, fuel, responders, trust labels, route context, Calamity Mode, and recovery packet are explicitly simulated demo data or previews.
- Screenshots: home-mobile.png, decision-mobile.png, good-samaritan-desktop.png, relay-context-desktop.png, activity-desktop.png, recovery-packet-mobile.png
```

- [ ] **Step 7: Commit documentation and QA evidence**

```bash
git add web/README.md docs/qa/kapitbiz-hazard-assist
git commit -m "docs: verify Hazard Assist demo flow"
```

- [ ] **Step 8: Request final code review and verify the branch**

Use `superpowers:requesting-code-review` against the approved spec and this plan. Address any verified blocker or regression using `superpowers:receiving-code-review`, then rerun:

```bash
cd web
npm test
npm run lint
npm run build
cd ..
git diff --check
git status --short
```

Expected: tests, lint, build, and diff check PASS. Only the pre-existing unrelated `web/app/layout.tsx` modification may remain unstaged after the planned commits.
