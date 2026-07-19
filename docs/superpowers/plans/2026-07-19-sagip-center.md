# Sagip Center + Nearby Tulong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Sagip Center blind-offer marketplace (and its Nearby Tulong inverse mode) to KapitBiz Relay, closing the PRD-vs-app gap on bidding, KYC status, and Calamity Mode price-ceiling enforcement, without introducing a backend.

**Architecture:** One new state module (`lib/kapitbiz-sagip.ts`) following the exact pattern already used by `lib/kapitbiz-hazard-assist.ts` (typed state + pure reducer + seed data + selectors + `parse*` validator), wrapped by a `use-sagip.ts` hook that mirrors `use-hazard-assist.ts` (localStorage persistence, hydrate-on-mount). A new 5th bottom-nav tab ("Sagip Center") renders `SagipCenterScreen`, which reuses the app's existing single-dialog-at-a-time pattern (`HazardAssistDialog`) for posting requests, viewing the offer board, and previewing the supplier-side form. Simulated bidders and their offers are generated client-side with fixed `arrivesAt` timestamps (no `setTimeout`), read via a `now`-ticking selector — the same derived-time pattern `ActiveDisruptionScreen.tsx` already uses, so state survives reload/backgrounding without losing or double-firing offers.

**Tech Stack:** Next.js 16 (Turbopack) App Router, React 19, TypeScript, Vitest + Testing Library, Lucide icons, CSS Modules — no new dependencies.

## Global Constraints

- No backend, no auth, no real payment/escrow — bidders and offers are seeded/generated client-side, exactly like the existing `GOOD_SAMARITAN_RESPONDERS` pattern.
- Follow the existing state-module convention exactly: typed state + pure reducer + `create*State()` + `parse*State()` defensive validator + selectors as plain exported functions. See `lib/kapitbiz-hazard-assist.ts` as the reference.
- Time-based logic must use the `now`-as-parameter pattern (`fn(state, now)`), never `setTimeout`/`setInterval` for business logic. Only a UI tick timer (`setInterval` calling `setNow(Date.now())`, as in `ActiveDisruptionScreen.tsx:33`) is allowed, and only to force re-render.
- Reuse existing CSS classes before adding new ones: `.primaryButton`, `.secondaryButton`, `.dangerButton`, `.iconButton`, `.segmentedControl`, `.dialogBackdrop`, `.hazardDialogHeader`, `.hazardDialogBody`, `.responderList`/`.responderRow`/`.responderTrust`/`.responderAction`, `.screenIntro`, `.eyebrow`, `.emptyStateBlock`, `.verifiedBadge` all already exist in `components/kapitbiz/KapitBizRelay.module.css`.
- Money is always whole/decimal PHP, formatted with `` `PHP${value.toLocaleString("en-PH")}` `` (see `formatCurrency` in `AppChrome.tsx` and `NetworkScreen.tsx`).
- Every new dialog must reuse `HazardAssistDialog` (`components/kapitbiz/HazardAssistDialog.tsx`) for its focus-trap/Escape/return-focus behavior — never build a new dialog wrapper.
- Only one Sagip Center dialog is ever open at a time (post-request form, offer board, or supplier preview) — mirrors the existing app-wide single-dialog convention.
- Run `npm test`, `npm run lint`, and `npm run build` from `web/` before considering any task done if the step says so; all must pass with zero new errors/warnings.

---

## File Structure

| File | Responsibility |
|---|---|
| `web/lib/kapitbiz-sagip.ts` | Create | Types, seed bidder pool + SRP ceilings, pure reducer, seed/generate/sort/select functions, `parseSagipState`. |
| `web/lib/use-sagip.ts` | Create | React hook: `useReducer` + localStorage persistence, mirrors `use-hazard-assist.ts`. |
| `web/components/kapitbiz/SagipCenterScreen.tsx` | Create | Tab screen: segment toggle, request list, dialog-surface state machine. |
| `web/components/kapitbiz/SagipRequestForm.tsx` | Create | Post-a-request/surplus dialog body. |
| `web/components/kapitbiz/SagipOfferBoard.tsx` | Create | Request detail dialog body: sorted offer list, accept/negotiate/reject/barter actions, fulfilled-meter, "Preview as supplier" entry point. |
| `web/components/kapitbiz/SupplierPreviewDialog.tsx` | Create | Dialog body: the form a real supplier would fill out, with SRP ceiling enforcement. |
| `web/lib/kapitbiz-demo.ts` | Modify | Add `"sagip"` to `MerchantTab`. |
| `web/components/kapitbiz/AppChrome.tsx` | Modify | Add 5th `navItems` entry + icon import. |
| `web/components/kapitbiz/MerchantShell.tsx` | Modify | Add `"sagip"` to `tabLabels`. |
| `web/components/kapitbiz/KapitBizDemoApp.tsx` | Modify | Own `useSagip()` state, render `SagipCenterScreen` on the new tab. |
| `web/components/kapitbiz/MenuScreen.tsx` | Modify | Add KYC status badge to the Business profile detail. |
| `web/components/kapitbiz/KapitBizRelay.module.css` | Modify | New `.sagip*` and `.kycBadge` rules appended at end of file. |
| `web/tests/kapitbiz-sagip.test.ts` | Create | Reducer/selector unit tests (no DOM). |
| `web/tests/kapitbiz-sagip-ui.test.tsx` | Create | Component/integration tests (Testing Library). |

---

## Task 1: Core types, seed data, and pure reducer

**Files:**
- Create: `web/lib/kapitbiz-sagip.ts`
- Test: `web/tests/kapitbiz-sagip.test.ts`

**Interfaces:**
- Produces: `SagipRequestKind`, `SagipCategory`, `SagipRequest`, `BlindOffer`, `SagipBidderProfile`, `KapitBizSagipState`, `SagipAction`, `SAGIP_STORAGE_KEY`, `SAGIP_BIDDER_POOL`, `SRP_CEILINGS`, `createSagipState()`, `postSagipRequest(input, now)`, `sagipReducer(state, action)`, `remainingQuantity(request)` — all consumed by every later task.

- [ ] **Step 1: Write the failing test**

Create `web/tests/kapitbiz-sagip.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createSagipState,
  postSagipRequest,
  remainingQuantity,
  sagipReducer,
  SRP_CEILINGS,
  type BlindOffer,
} from "@/lib/kapitbiz-sagip";

describe("kapitbiz-sagip reducer", () => {
  it("creates an empty state", () => {
    const state = createSagipState();
    expect(state).toEqual({ version: 1, requests: [], offers: [] });
  });

  it("posts a request with a computed closesAt and no SRP ceiling outside Calamity Mode", () => {
    const now = 1_000_000;
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      now,
    );
    expect(request.postedAt).toBe(now);
    expect(request.closesAt).toBe(now + 24 * 60 * 60 * 1000);
    expect(request.status).toBe("open");
    expect(request.fulfilledQty).toBe(0);
    expect(request.srpCeilingPhp).toBeNull();
  });

  it("applies the category SRP ceiling when Calamity Mode is active", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: true },
      0,
    );
    expect(request.calamityModeActive).toBe(true);
    expect(request.srpCeilingPhp).toBe(SRP_CEILINGS["dry-ice"]);
  });

  it("post-request adds the request to state", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const state = sagipReducer(createSagipState(), { type: "post-request", request });
    expect(state.requests).toEqual([request]);
  });

  it("accept-offer decrements remaining quantity and marks the offer accepted", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offer: BlindOffer = {
      id: "offer-1", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified",
      offerType: "cash", pricePhp: 45, barterDescription: null, barterDeclaredValuePhp: null,
      quantityOffered: 25, submittedAt: 0, arrivesAt: 0, status: "pending",
    };
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "receive-offers", offers: [offer] });
    state = sagipReducer(state, { type: "accept-offer", offerId: "offer-1", at: 100 });

    const updatedRequest = state.requests[0];
    const updatedOffer = state.offers[0];
    expect(updatedOffer.status).toBe("accepted");
    expect(updatedRequest.fulfilledQty).toBe(25);
    expect(remainingQuantity(updatedRequest)).toBe(15);
    expect(updatedRequest.status).toBe("open");
  });

  it("marks the request fulfilled once accepted offers meet the requested quantity", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offer: BlindOffer = {
      id: "offer-1", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified",
      offerType: "cash", pricePhp: 45, barterDescription: null, barterDeclaredValuePhp: null,
      quantityOffered: 40, submittedAt: 0, arrivesAt: 0, status: "pending",
    };
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "receive-offers", offers: [offer] });
    state = sagipReducer(state, { type: "accept-offer", offerId: "offer-1", at: 100 });

    expect(state.requests[0].status).toBe("fulfilled");
    expect(remainingQuantity(state.requests[0])).toBe(0);
  });

  it("reject-offer marks the offer rejected without touching quantity", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offer: BlindOffer = {
      id: "offer-1", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified",
      offerType: "cash", pricePhp: 45, barterDescription: null, barterDeclaredValuePhp: null,
      quantityOffered: 25, submittedAt: 0, arrivesAt: 0, status: "pending",
    };
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "receive-offers", offers: [offer] });
    state = sagipReducer(state, { type: "reject-offer", offerId: "offer-1" });

    expect(state.offers[0].status).toBe("rejected");
    expect(state.requests[0].fulfilledQty).toBe(0);
  });

  it("negotiate-offer with a cash counter moves the offer to negotiating and updates its price", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offer: BlindOffer = {
      id: "offer-1", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified",
      offerType: "cash", pricePhp: 45, barterDescription: null, barterDeclaredValuePhp: null,
      quantityOffered: 25, submittedAt: 0, arrivesAt: 0, status: "pending",
    };
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "receive-offers", offers: [offer] });
    state = sagipReducer(state, {
      type: "negotiate-offer", offerId: "offer-1", counter: { kind: "cash", pricePhp: 38 },
    });

    expect(state.offers[0].status).toBe("negotiating");
    expect(state.offers[0].pricePhp).toBe(38);
  });

  it("negotiate-offer with a barter counter switches offerType and sets barter fields", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offer: BlindOffer = {
      id: "offer-1", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified",
      offerType: "cash", pricePhp: 45, barterDescription: null, barterDeclaredValuePhp: null,
      quantityOffered: 25, submittedAt: 0, arrivesAt: 0, status: "pending",
    };
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "receive-offers", offers: [offer] });
    state = sagipReducer(state, {
      type: "negotiate-offer", offerId: "offer-1",
      counter: { kind: "barter", description: "10 sacks of rice", declaredValuePhp: 900 },
    });

    expect(state.offers[0].status).toBe("negotiating");
    expect(state.offers[0].offerType).toBe("barter");
    expect(state.offers[0].barterDescription).toBe("10 sacks of rice");
    expect(state.offers[0].barterDeclaredValuePhp).toBe(900);
  });

  it("close-request marks an open request closed without touching fulfilled ones", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "close-request", requestId: request.id });
    expect(state.requests[0].status).toBe("closed");
  });

  it("reset returns to the empty state", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    let state = sagipReducer(createSagipState(), { type: "post-request", request });
    state = sagipReducer(state, { type: "reset" });
    expect(state).toEqual(createSagipState());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: FAIL — `Cannot find module '@/lib/kapitbiz-sagip'`

- [ ] **Step 3: Write the implementation**

Create `web/lib/kapitbiz-sagip.ts`:

```ts
export const SAGIP_STORAGE_KEY = "kapitbiz-sagip-v1";

export type SagipRequestKind = "need" | "surplus";
export type SagipRequestStatus = "open" | "closed" | "fulfilled";
export type SagipCategory = "dry-ice" | "packaging" | "fuel" | "generator-rental" | "raw-material" | "other";
export type BidderKycStatus = "verified" | "provisional";
export type OfferType = "cash" | "barter";
export type OfferStatus = "pending" | "accepted" | "negotiating" | "rejected";

export interface SagipRequest {
  id: string;
  kind: SagipRequestKind;
  title: string;
  category: SagipCategory;
  quantity: number;
  unit: string;
  postedAt: number;
  windowHours: number;
  closesAt: number;
  status: SagipRequestStatus;
  fulfilledQty: number;
  calamityModeActive: boolean;
  srpCeilingPhp: number | null;
}

export interface BlindOffer {
  id: string;
  requestId: string;
  bidderLabel: string;
  bidderKycStatus: BidderKycStatus;
  offerType: OfferType;
  pricePhp: number | null;
  barterDescription: string | null;
  barterDeclaredValuePhp: number | null;
  quantityOffered: number;
  submittedAt: number;
  arrivesAt: number;
  status: OfferStatus;
}

export interface SagipBidderProfile {
  id: string;
  name: string;
  kycStatus: BidderKycStatus;
  categories: SagipCategory[];
  priceBandPhpPerUnit: { min: number; max: number };
}

export interface KapitBizSagipState {
  version: 1;
  requests: SagipRequest[];
  offers: BlindOffer[];
}

export type SagipAction =
  | { type: "post-request"; request: SagipRequest }
  | { type: "receive-offers"; offers: BlindOffer[] }
  | { type: "accept-offer"; offerId: string; at: number }
  | { type: "negotiate-offer"; offerId: string; counter: { kind: "cash"; pricePhp: number } | { kind: "barter"; description: string; declaredValuePhp: number } }
  | { type: "reject-offer"; offerId: string }
  | { type: "close-request"; requestId: string }
  | { type: "reset" };

export const SAGIP_BIDDER_POOL: SagipBidderProfile[] = [
  { id: "bidder-abc-sarisari", name: "ABC Sari-Sari Supply Co.", kycStatus: "verified", categories: ["dry-ice", "packaging"], priceBandPhpPerUnit: { min: 38, max: 52 } },
  { id: "bidder-tagum-ice", name: "Tagum Ice Traders", kycStatus: "verified", categories: ["dry-ice"], priceBandPhpPerUnit: { min: 40, max: 60 } },
  { id: "bidder-packrite", name: "PackRite Davao", kycStatus: "provisional", categories: ["packaging"], priceBandPhpPerUnit: { min: 6, max: 12 } },
  { id: "bidder-fuelgo", name: "FuelGo Davao Region", kycStatus: "verified", categories: ["fuel"], priceBandPhpPerUnit: { min: 62, max: 78 } },
  { id: "bidder-gensetph", name: "GenSet Rentals PH", kycStatus: "verified", categories: ["generator-rental"], priceBandPhpPerUnit: { min: 900, max: 1_400 } },
  { id: "bidder-northmill", name: "Northmill Trading", kycStatus: "provisional", categories: ["raw-material"], priceBandPhpPerUnit: { min: 45, max: 65 } },
  { id: "bidder-panabo-supply", name: "Panabo Supply Hub", kycStatus: "verified", categories: ["packaging", "raw-material"], priceBandPhpPerUnit: { min: 20, max: 40 } },
  { id: "bidder-crossroad", name: "Crossroad Logistics Co-op", kycStatus: "provisional", categories: ["fuel", "generator-rental"], priceBandPhpPerUnit: { min: 55, max: 90 } },
];

export const SRP_CEILINGS: Record<SagipCategory, number> = {
  "dry-ice": 55,
  packaging: 10,
  fuel: 68,
  "generator-rental": 1_200,
  "raw-material": 60,
  other: 100,
};

let sagipIdCounter = 0;
function nextSagipId(prefix: string): string {
  sagipIdCounter += 1;
  return `${prefix}-${sagipIdCounter}`;
}

export function createSagipState(): KapitBizSagipState {
  return { version: 1, requests: [], offers: [] };
}

export function postSagipRequest(
  input: {
    kind: SagipRequestKind;
    title: string;
    category: SagipCategory;
    quantity: number;
    unit: string;
    windowHours: number;
    calamityModeActive: boolean;
  },
  now: number,
): SagipRequest {
  return {
    id: nextSagipId("sagip-request"),
    kind: input.kind,
    title: input.title,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    postedAt: now,
    windowHours: input.windowHours,
    closesAt: now + input.windowHours * 60 * 60 * 1000,
    status: "open",
    fulfilledQty: 0,
    calamityModeActive: input.calamityModeActive,
    srpCeilingPhp: input.calamityModeActive ? SRP_CEILINGS[input.category] : null,
  };
}

export function remainingQuantity(request: SagipRequest): number {
  return Math.max(0, request.quantity - request.fulfilledQty);
}

export function sagipReducer(state: KapitBizSagipState, action: SagipAction): KapitBizSagipState {
  switch (action.type) {
    case "post-request":
      return { ...state, requests: [...state.requests, action.request] };
    case "receive-offers":
      return { ...state, offers: [...state.offers, ...action.offers] };
    case "accept-offer": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      if (!offer || offer.status !== "pending" && offer.status !== "negotiating") return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, status: "accepted" as const } : candidate,
      );
      const requests = state.requests.map((request) => {
        if (request.id !== offer.requestId) return request;
        const fulfilledQty = Math.min(request.quantity, request.fulfilledQty + offer.quantityOffered);
        return { ...request, fulfilledQty, status: fulfilledQty >= request.quantity ? "fulfilled" as const : request.status };
      });
      return { ...state, offers, requests };
    }
    case "negotiate-offer": {
      const offers = state.offers.map((candidate) => {
        if (candidate.id !== action.offerId) return candidate;
        if (action.counter.kind === "cash") {
          return { ...candidate, status: "negotiating" as const, offerType: "cash" as const, pricePhp: action.counter.pricePhp };
        }
        return {
          ...candidate,
          status: "negotiating" as const,
          offerType: "barter" as const,
          barterDescription: action.counter.description,
          barterDeclaredValuePhp: action.counter.declaredValuePhp,
        };
      });
      return { ...state, offers };
    }
    case "reject-offer": {
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, status: "rejected" as const } : candidate,
      );
      return { ...state, offers };
    }
    case "close-request": {
      const requests = state.requests.map((request) =>
        request.id === action.requestId && request.status === "open"
          ? { ...request, status: "closed" as const }
          : request,
      );
      return { ...state, requests };
    }
    case "reset":
      return createSagipState();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/kapitbiz-sagip.ts web/tests/kapitbiz-sagip.test.ts
git commit -m "feat: add Sagip Center reducer, seed data, and core types"
```

---

## Task 2: Simulated bidder offer generation + visibility/sort selectors

**Files:**
- Modify: `web/lib/kapitbiz-sagip.ts`
- Test: `web/tests/kapitbiz-sagip.test.ts`

**Interfaces:**
- Consumes: `SAGIP_BIDDER_POOL`, `SRP_CEILINGS`, `SagipRequest`, `BlindOffer` (Task 1).
- Produces: `generateOffersForRequest(request, now)`, `visibleOffers(offers, requestId, now)`, `sortOffers(request, offers)` — consumed by Task 6 (offer board) and Task 12 (Nearby Tulong).

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip.test.ts`:

```ts
import { generateOffersForRequest, sortOffers, visibleOffers } from "@/lib/kapitbiz-sagip";

describe("kapitbiz-sagip offer generation and selectors", () => {
  it("generates offers only from bidders matching the request category", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const offers = generateOffersForRequest(request, 0);
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer.requestId).toBe(request.id);
      expect(offer.status).toBe("pending");
      expect(offer.arrivesAt).toBeGreaterThanOrEqual(0);
    }
  });

  it("caps generated prices at the SRP ceiling when Calamity Mode is active", () => {
    const request = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: true },
      0,
    );
    const offers = generateOffersForRequest(request, 0);
    for (const offer of offers) {
      if (offer.pricePhp !== null) expect(offer.pricePhp).toBeLessThanOrEqual(request.srpCeilingPhp as number);
    }
  });

  it("uses Supplier labels for need requests and Buyer labels for surplus requests", () => {
    const needRequest = postSagipRequest(
      { kind: "need", title: "Dry ice, 40kg", category: "dry-ice", quantity: 40, unit: "kg", windowHours: 24, calamityModeActive: false },
      0,
    );
    const surplusRequest = postSagipRequest(
      { kind: "surplus", title: "50 sacks of flour", category: "raw-material", quantity: 50, unit: "sacks", windowHours: 24, calamityModeActive: false },
      0,
    );
    for (const offer of generateOffersForRequest(needRequest, 0)) expect(offer.bidderLabel).toMatch(/^Supplier /);
    for (const offer of generateOffersForRequest(surplusRequest, 0)) expect(offer.bidderLabel).toMatch(/^Buyer /);
  });

  it("visibleOffers hides offers whose arrivesAt is in the future", () => {
    const offers: BlindOffer[] = [
      { id: "a", requestId: "r1", bidderLabel: "Supplier A", bidderKycStatus: "verified", offerType: "cash", pricePhp: 40, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 1_000, status: "pending" },
      { id: "b", requestId: "r1", bidderLabel: "Supplier B", bidderKycStatus: "verified", offerType: "cash", pricePhp: 42, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 5_000, status: "pending" },
    ];
    expect(visibleOffers(offers, "r1", 2_000).map((o) => o.id)).toEqual(["a"]);
    expect(visibleOffers(offers, "r1", 6_000).map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("sortOffers sorts ascending by price for need requests", () => {
    const request = postSagipRequest(
      { kind: "need", title: "x", category: "dry-ice", quantity: 10, unit: "kg", windowHours: 24, calamityModeActive: false }, 0,
    );
    const offers: BlindOffer[] = [
      { id: "a", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified", offerType: "cash", pricePhp: 50, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
      { id: "b", requestId: request.id, bidderLabel: "Supplier B", bidderKycStatus: "verified", offerType: "cash", pricePhp: 30, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
    ];
    expect(sortOffers(request, offers).map((o) => o.id)).toEqual(["b", "a"]);
  });

  it("sortOffers sorts descending by price for surplus requests", () => {
    const request = postSagipRequest(
      { kind: "surplus", title: "x", category: "raw-material", quantity: 10, unit: "sacks", windowHours: 24, calamityModeActive: false }, 0,
    );
    const offers: BlindOffer[] = [
      { id: "a", requestId: request.id, bidderLabel: "Buyer A", bidderKycStatus: "verified", offerType: "cash", pricePhp: 50, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
      { id: "b", requestId: request.id, bidderLabel: "Buyer B", bidderKycStatus: "verified", offerType: "cash", pricePhp: 30, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
    ];
    expect(sortOffers(request, offers).map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("sortOffers treats barter declared value as the sortable price", () => {
    const request = postSagipRequest(
      { kind: "need", title: "x", category: "dry-ice", quantity: 10, unit: "kg", windowHours: 24, calamityModeActive: false }, 0,
    );
    const offers: BlindOffer[] = [
      { id: "a", requestId: request.id, bidderLabel: "Supplier A", bidderKycStatus: "verified", offerType: "barter", pricePhp: null, barterDescription: "rice", barterDeclaredValuePhp: 900, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
      { id: "b", requestId: request.id, bidderLabel: "Supplier B", bidderKycStatus: "verified", offerType: "cash", pricePhp: 400, barterDescription: null, barterDeclaredValuePhp: null, quantityOffered: 10, submittedAt: 0, arrivesAt: 0, status: "pending" },
    ];
    expect(sortOffers(request, offers).map((o) => o.id)).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: FAIL — `generateOffersForRequest`/`sortOffers`/`visibleOffers` are not exported

- [ ] **Step 3: Write the implementation**

Append to `web/lib/kapitbiz-sagip.ts`:

```ts
function offerPrice(offer: BlindOffer): number {
  return offer.offerType === "cash" ? offer.pricePhp ?? 0 : offer.barterDeclaredValuePhp ?? 0;
}

export function generateOffersForRequest(request: SagipRequest, now: number): BlindOffer[] {
  const matchingBidders = SAGIP_BIDDER_POOL.filter((bidder) => bidder.categories.includes(request.category));
  const labelPrefix = request.kind === "need" ? "Supplier" : "Buyer";
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return matchingBidders.map((bidder, index) => {
    const spread = bidder.priceBandPhpPerUnit.max - bidder.priceBandPhpPerUnit.min;
    const rawPrice = bidder.priceBandPhpPerUnit.min + spread * ((index + 1) / (matchingBidders.length + 1));
    const pricePhp = request.srpCeilingPhp !== null ? Math.min(rawPrice, request.srpCeilingPhp) : rawPrice;

    return {
      id: nextSagipId("sagip-offer"),
      requestId: request.id,
      bidderLabel: `${labelPrefix} ${letters[index] ?? String(index + 1)}`,
      bidderKycStatus: bidder.kycStatus,
      offerType: "cash",
      pricePhp: Math.round(pricePhp),
      barterDescription: null,
      barterDeclaredValuePhp: null,
      quantityOffered: Math.min(request.quantity, Math.round(request.quantity / matchingBidders.length)),
      submittedAt: now,
      arrivesAt: now + (index + 1) * 4_000,
      status: "pending",
    };
  });
}

export function visibleOffers(offers: BlindOffer[], requestId: string, now: number): BlindOffer[] {
  return offers.filter((offer) => offer.requestId === requestId && offer.arrivesAt <= now);
}

export function sortOffers(request: SagipRequest, offers: BlindOffer[]): BlindOffer[] {
  const direction = request.kind === "need" ? 1 : -1;
  return [...offers].sort((a, b) => (offerPrice(a) - offerPrice(b)) * direction);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: PASS (18 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/kapitbiz-sagip.ts web/tests/kapitbiz-sagip.test.ts
git commit -m "feat: generate simulated blind offers with staggered arrival and SRP-capped pricing"
```

---

## Task 3: `parseSagipState` validator + `use-sagip.ts` hook

**Files:**
- Modify: `web/lib/kapitbiz-sagip.ts`
- Create: `web/lib/use-sagip.ts`
- Test: `web/tests/kapitbiz-sagip.test.ts`

**Interfaces:**
- Consumes: `KapitBizSagipState`, `createSagipState`, `sagipReducer`, `SAGIP_STORAGE_KEY` (Task 1).
- Produces: `parseSagipState(value)`, `useSagip()` returning `{ state, hydrated, dispatch, resetSagip }` — consumed by `KapitBizDemoApp.tsx` in Task 4.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip.test.ts`:

```ts
import { parseSagipState } from "@/lib/kapitbiz-sagip";

describe("parseSagipState", () => {
  it("returns a fresh state for malformed input", () => {
    expect(parseSagipState(null)).toEqual(createSagipState());
    expect(parseSagipState({ version: 2 })).toEqual(createSagipState());
    expect(parseSagipState({ version: 1, requests: "nope", offers: [] })).toEqual(createSagipState());
  });

  it("round-trips a valid state", () => {
    const request = postSagipRequest(
      { kind: "need", title: "x", category: "dry-ice", quantity: 10, unit: "kg", windowHours: 24, calamityModeActive: false }, 0,
    );
    const state = sagipReducer(createSagipState(), { type: "post-request", request });
    const parsed = parseSagipState(JSON.parse(JSON.stringify(state)));
    expect(parsed).toEqual(state);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: FAIL — `parseSagipState` is not exported

- [ ] **Step 3: Write the implementation**

Append to `web/lib/kapitbiz-sagip.ts`:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSagipRequest(value: unknown): value is SagipRequest {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && (value.kind === "need" || value.kind === "surplus")
    && typeof value.title === "string"
    && typeof value.category === "string"
    && typeof value.quantity === "number"
    && typeof value.unit === "string"
    && typeof value.postedAt === "number"
    && typeof value.windowHours === "number"
    && typeof value.closesAt === "number"
    && (value.status === "open" || value.status === "closed" || value.status === "fulfilled")
    && typeof value.fulfilledQty === "number"
    && typeof value.calamityModeActive === "boolean"
    && (value.srpCeilingPhp === null || typeof value.srpCeilingPhp === "number");
}

function isBlindOffer(value: unknown): value is BlindOffer {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && typeof value.requestId === "string"
    && typeof value.bidderLabel === "string"
    && (value.bidderKycStatus === "verified" || value.bidderKycStatus === "provisional")
    && (value.offerType === "cash" || value.offerType === "barter")
    && (value.pricePhp === null || typeof value.pricePhp === "number")
    && (value.barterDescription === null || typeof value.barterDescription === "string")
    && (value.barterDeclaredValuePhp === null || typeof value.barterDeclaredValuePhp === "number")
    && typeof value.quantityOffered === "number"
    && typeof value.submittedAt === "number"
    && typeof value.arrivesAt === "number"
    && (value.status === "pending" || value.status === "accepted" || value.status === "negotiating" || value.status === "rejected");
}

export function parseSagipState(value: unknown): KapitBizSagipState {
  if (!isRecord(value) || value.version !== 1) return createSagipState();
  if (!Array.isArray(value.requests) || !value.requests.every(isSagipRequest)) return createSagipState();
  if (!Array.isArray(value.offers) || !value.offers.every(isBlindOffer)) return createSagipState();
  return { version: 1, requests: value.requests, offers: value.offers };
}
```

Create `web/lib/use-sagip.ts`:

```ts
"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  SAGIP_STORAGE_KEY,
  createSagipState,
  parseSagipState,
  sagipReducer,
  type KapitBizSagipState,
  type SagipAction,
} from "@/lib/kapitbiz-sagip";

type HydrateAction = { type: "hydrate"; state: KapitBizSagipState };

function reducer(state: KapitBizSagipState, action: SagipAction | HydrateAction): KapitBizSagipState {
  return action.type === "hydrate" ? action.state : sagipReducer(state, action);
}

function loadSagip(): KapitBizSagipState {
  if (typeof window === "undefined") return createSagipState();
  try {
    const serialized = window.localStorage.getItem(SAGIP_STORAGE_KEY);
    return serialized ? parseSagipState(JSON.parse(serialized) as unknown) : createSagipState();
  } catch {
    return createSagipState();
  }
}

function persistSagip(state: KapitBizSagipState): void {
  try {
    window.localStorage.setItem(SAGIP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be unavailable in constrained or private webviews.
  }
}

export function useSagip() {
  const [state, dispatchInternal] = useReducer(reducer, undefined, createSagipState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatchInternal({ type: "hydrate", state: loadSagip() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistSagip(state);
  }, [hydrated, state]);

  const dispatch = useCallback((action: SagipAction) => dispatchInternal(action), []);
  const resetSagip = useCallback(() => {
    const next = createSagipState();
    dispatchInternal({ type: "hydrate", state: next });
    persistSagip(next);
  }, []);

  return { state, hydrated, dispatch, resetSagip };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip.test.ts`
Expected: PASS (20 tests)

- [ ] **Step 5: Commit**

```bash
git add web/lib/kapitbiz-sagip.ts web/lib/use-sagip.ts web/tests/kapitbiz-sagip.test.ts
git commit -m "feat: add Sagip state validation and the useSagip persistence hook"
```

---

## Task 4: Nav wiring — 5th tab shell (empty screen)

**Files:**
- Modify: `web/lib/kapitbiz-demo.ts`
- Modify: `web/components/kapitbiz/AppChrome.tsx`
- Modify: `web/components/kapitbiz/MerchantShell.tsx`
- Modify: `web/components/kapitbiz/KapitBizDemoApp.tsx`
- Create: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `useSagip()` (Task 3), `styles` from `KapitBizRelay.module.css`.
- Produces: `SagipCenterScreen` component (props: `state: KapitBizSagipState`, `now: number`, `dispatch: (action: SagipAction) => void`) — extended with real content in Tasks 5–9.

- [ ] **Step 1: Write the failing test**

Create `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
import { cleanup, render, screen } from "@testing-library/react";
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

describe("Sagip Center tab", () => {
  it("is reachable from the bottom nav and shows the empty state", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    expect(await screen.findByRole("heading", { name: "Sagip Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Requesting" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Offering surplus" })).toBeInTheDocument();
    expect(screen.getByText(/No open requests yet/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no button named "Sagip Center"

- [ ] **Step 3: Wire the tab type and nav item**

In `web/lib/kapitbiz-demo.ts`, change line 6 and the `isMerchantTab` validator:

```ts
export type MerchantTab = "home" | "requests" | "network" | "sagip" | "activity" | "menu";
```

```ts
function isMerchantTab(value: unknown): value is MerchantTab {
  return value === "home" || value === "requests" || value === "network" || value === "sagip" || value === "activity" || value === "menu";
}
```

In `web/components/kapitbiz/AppChrome.tsx`, update the import and `navItems`:

```ts
import { Bell, ChevronLeft, Handshake, History, House, ListTodo, Menu, Network, X, type LucideIcon } from "lucide-react";
```

```ts
const navItems: { id: Exclude<MerchantTab, "menu">; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "requests", label: "Requests", icon: ListTodo },
  { id: "network", label: "Network", icon: Network },
  { id: "sagip", label: "Sagip Center", icon: Handshake },
  { id: "activity", label: "Activity", icon: History },
];
```

In `web/components/kapitbiz/MerchantShell.tsx`, add the label:

```ts
const tabLabels: Record<MerchantTab, string> = {
  home: "Merchant home",
  requests: "Rescue requests",
  network: "Relay network",
  sagip: "Sagip Center",
  activity: "Business activity",
  menu: "Business menu",
};
```

- [ ] **Step 4: Create the screen shell**

Create `web/components/kapitbiz/SagipCenterScreen.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { KapitBizSagipState, SagipAction, SagipRequestKind } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

export default function SagipCenterScreen({
  state,
  now,
  dispatch,
}: {
  state: KapitBizSagipState;
  now: number;
  dispatch: (action: SagipAction) => void;
}) {
  const [segment, setSegment] = useState<SagipRequestKind>("need");
  const requests = state.requests.filter((request) => request.kind === segment);
  const postLabel = segment === "need" ? "Post a request" : "Post surplus";
  const emptyLabel = segment === "need"
    ? "No open requests yet. Post one to start collecting blind offers."
    : "No surplus posted yet. Offer idle stock or capacity for other businesses to bid on.";

  return (
    <section className={styles.sagipScreen} aria-labelledby="sagip-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Sagip Center</p>
        <h2 id="sagip-heading">Sagip Center</h2>
        <p>Post a supply need or surplus and collect blind offers from the seeded partner network.</p>
      </header>

      <div className={styles.segmentedControl} role="group" aria-label="Sagip Center mode">
        <button type="button" data-active={segment === "need"} aria-pressed={segment === "need"} onClick={() => setSegment("need")}>
          Requesting
        </button>
        <button type="button" data-active={segment === "surplus"} aria-pressed={segment === "surplus"} onClick={() => setSegment("surplus")}>
          Offering surplus
        </button>
      </div>

      <button className={styles.primaryButton} type="button">
        <Plus aria-hidden="true" />
        {postLabel}
      </button>

      {requests.length === 0 ? (
        <div className={styles.emptyStateBlock}>
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <ul className={styles.sagipRequestList} aria-label={segment === "need" ? "Posted requests" : "Posted surplus"}>
          {requests.map((request) => (
            <li key={request.id}>{request.title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Wire it into `KapitBizDemoApp.tsx`**

Add the import and hook near the other hooks (after `const hazardAssist = useHazardAssist();`):

```ts
import { useSagip } from "@/lib/use-sagip";
import SagipCenterScreen from "./SagipCenterScreen";
```

```ts
const sagip = useSagip();
```

Add `sagip.hydrated` to the loading guard:

```ts
if (!hydrated || !relay.hydrated || !hazardAssist.hydrated || !sagip.hydrated) {
```

Add a `now` tick state right after the hazard surface state:

```ts
const [now, setNow] = useState(Date.now());
```

Add an effect below the existing hooks (inside the component body, after the early returns are not yet reached — place it directly after the `useState` calls, before the `if (!hydrated...)` guard is fine since hooks must run unconditionally):

```ts
useEffect(() => {
  const timer = window.setInterval(() => setNow(Date.now()), 1_000);
  return () => window.clearInterval(timer);
}, []);
```

Add `useEffect` to the React import at the top: `import { useEffect, useState } from "react";`

In the tab-rendering block, add a branch for `"sagip"` before the final `network` `else`:

```tsx
) : session.activeTab === "sagip" ? (
  <SagipCenterScreen state={sagip.state} now={now} dispatch={sagip.dispatch} />
) : session.activeTab === "network" ? (
  <NetworkScreen
    state={relay.state}
    onStartRequest={startRelayFromNetwork}
    onOpenGoodSamaritan={openGoodSamaritan}
  />
) : (
```

Since `network` is currently the trailing `else` branch, change it to an explicit `session.activeTab === "network"` check followed by a `null` fallback (there is no other tab left, but TypeScript's exhaustiveness on `MerchantTab` requires every case handled — `"menu"` is handled separately outside this ternary chain already, so the final `else` becomes unreachable and should return `null`):

```tsx
) : (
  null
)}
```

Also update `resetDemo` to reset Sagip state:

```ts
const resetDemo = () => {
  setHazardSurface("closed");
  resetSession();
  relay.resetRescue();
  hazardAssist.resetHazardAssist();
  sagip.resetSagip();
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (1 test)

Then run the full suite to confirm nothing else broke:

Run: `cd web && npm test`
Expected: PASS, all existing + new tests green

- [ ] **Step 7: Commit**

```bash
git add web/lib/kapitbiz-demo.ts web/components/kapitbiz/AppChrome.tsx web/components/kapitbiz/MerchantShell.tsx web/components/kapitbiz/KapitBizDemoApp.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add Sagip Center as the 5th bottom-nav tab with segment toggle"
```

---

## Task 5: Post-a-request form

**Files:**
- Create: `web/components/kapitbiz/SagipRequestForm.tsx`
- Modify: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `postSagipRequest`, `SagipCategory`, `SagipRequestKind` (Task 1), `HazardAssistDialog` (existing).
- Produces: `SagipRequestForm` component (props: `kind: SagipRequestKind`, `onSubmit: (input) => void`, `onClose: () => void`) — consumed only by `SagipCenterScreen`.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Posting a Sagip Center request", () => {
  it("adds a new request to the Requesting list", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));

    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const dialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(dialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(dialog).getByLabelText("Quantity"));
    await user.type(within(dialog).getByLabelText("Quantity"), "40");
    await user.type(within(dialog).getByLabelText("Unit"), "kg");
    await user.click(within(dialog).getByRole("button", { name: "Post request" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Post a request" })).not.toBeInTheDocument());
    expect(screen.getByText("Dry ice, 40kg")).toBeInTheDocument();
  });
});
```

Add `waitFor` and `within` to the existing `@testing-library/react` import at the top of the file:

```ts
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no button named "Post a request" opens anything yet (button exists but does nothing)

- [ ] **Step 3: Write the implementation**

Create `web/components/kapitbiz/SagipRequestForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { SagipCategory, SagipRequestKind } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

const categories: { value: SagipCategory; label: string }[] = [
  { value: "dry-ice", label: "Dry ice" },
  { value: "packaging", label: "Packaging material" },
  { value: "fuel", label: "Fuel" },
  { value: "generator-rental", label: "Generator rental" },
  { value: "raw-material", label: "Raw material" },
  { value: "other", label: "Other" },
];

export default function SagipRequestForm({
  kind,
  onSubmit,
  onClose,
}: {
  kind: SagipRequestKind;
  onSubmit: (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SagipCategory>("dry-ice");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("");
  const [windowHours, setWindowHours] = useState(24);
  const label = kind === "need" ? "Post a request" : "Post surplus";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!title.trim() || !unit.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    onSubmit({ title: title.trim(), category, quantity: parsedQuantity, unit: unit.trim(), windowHours });
  };

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>{label}</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${label}`} title={`Close ${label}`}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>{label}</h2>
        <form className={styles.businessForm} onSubmit={submit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dry ice, 40kg" />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as SagipCategory)}>
              {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Quantity
            <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>
            Unit
            <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" />
          </label>
          <label>
            Offer window
            <select value={windowHours} onChange={(event) => setWindowHours(Number(event.target.value))}>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>
          <div className={styles.onboardingActions}>
            <button className={styles.onboardingBack} type="button" onClick={onClose}>Cancel</button>
            <button className={styles.primaryButton} type="submit">{kind === "need" ? "Post request" : "Post surplus"}</button>
          </div>
        </form>
      </div>
    </>
  );
}
```

Update `web/components/kapitbiz/SagipCenterScreen.tsx` — add imports, a `SagipSurface` state machine, and wire the form:

```ts
import { generateOffersForRequest, postSagipRequest, type KapitBizSagipState, type SagipAction, type SagipCategory, type SagipRequestKind } from "@/lib/kapitbiz-sagip";
import HazardAssistDialog from "./HazardAssistDialog";
import SagipRequestForm from "./SagipRequestForm";
```

Replace the component body with:

```tsx
type SagipSurface = { kind: "closed" } | { kind: "post-request" };

export default function SagipCenterScreen({
  state,
  now,
  dispatch,
}: {
  state: KapitBizSagipState;
  now: number;
  dispatch: (action: SagipAction) => void;
}) {
  const [segment, setSegment] = useState<SagipRequestKind>("need");
  const [surface, setSurface] = useState<SagipSurface>({ kind: "closed" });
  const requests = state.requests.filter((request) => request.kind === segment);
  const postLabel = segment === "need" ? "Post a request" : "Post surplus";
  const emptyLabel = segment === "need"
    ? "No open requests yet. Post one to start collecting blind offers."
    : "No surplus posted yet. Offer idle stock or capacity for other businesses to bid on.";

  const submitRequest = (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number }) => {
    const request = postSagipRequest({ ...input, kind: segment, calamityModeActive: false }, now);
    dispatch({ type: "post-request", request });
    dispatch({ type: "receive-offers", offers: generateOffersForRequest(request, now) });
    setSurface({ kind: "closed" });
  };

  return (
    <section className={styles.sagipScreen} aria-labelledby="sagip-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Sagip Center</p>
        <h2 id="sagip-heading">Sagip Center</h2>
        <p>Post a supply need or surplus and collect blind offers from the seeded partner network.</p>
      </header>

      <div className={styles.segmentedControl} role="group" aria-label="Sagip Center mode">
        <button type="button" data-active={segment === "need"} aria-pressed={segment === "need"} onClick={() => setSegment("need")}>
          Requesting
        </button>
        <button type="button" data-active={segment === "surplus"} aria-pressed={segment === "surplus"} onClick={() => setSegment("surplus")}>
          Offering surplus
        </button>
      </div>

      <button className={styles.primaryButton} type="button" onClick={() => setSurface({ kind: "post-request" })}>
        <Plus aria-hidden="true" />
        {postLabel}
      </button>

      {requests.length === 0 ? (
        <div className={styles.emptyStateBlock}>
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <ul className={styles.sagipRequestList} aria-label={segment === "need" ? "Posted requests" : "Posted surplus"}>
          {requests.map((request) => (
            <li key={request.id}>{request.title}</li>
          ))}
        </ul>
      )}

      {surface.kind === "post-request" ? (
        <HazardAssistDialog label={postLabel} focusKey="post-request" onClose={() => setSurface({ kind: "closed" })}>
          <SagipRequestForm kind={segment} onSubmit={submitRequest} onClose={() => setSurface({ kind: "closed" })} />
        </HazardAssistDialog>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/SagipRequestForm.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add the post-a-request/surplus form to Sagip Center"
```

---

## Task 6: Offer board — view sorted blind offers

**Files:**
- Create: `web/components/kapitbiz/SagipOfferBoard.tsx`
- Modify: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `visibleOffers`, `sortOffers`, `remainingQuantity` (Task 2), `SagipRequest`, `BlindOffer` (Task 1).
- Produces: `SagipOfferBoard` component (props: `request: SagipRequest`, `offers: BlindOffer[]`, `now: number`, `onAccept`, `onReject`, `onNegotiate`, `onClose`, `onPreviewSupplier`) — extended in Task 7–9.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Sagip Center offer board", () => {
  it("shows offers sorted lowest price first for a need request", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    const prices = within(board).getAllByTestId("sagip-offer-price").map((node) => Number(node.textContent?.replace(/\D/g, "")));
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — clicking the request title does not open a dialog

- [ ] **Step 3: Write the implementation**

Create `web/components/kapitbiz/SagipOfferBoard.tsx`:

```tsx
"use client";

import { X } from "lucide-react";
import { remainingQuantity, sortOffers, visibleOffers, type BlindOffer, type SagipRequest } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `PHP${value.toLocaleString("en-PH")}`;
}

function offerSummary(offer: BlindOffer): string {
  return offer.offerType === "cash"
    ? formatCurrency(offer.pricePhp ?? 0)
    : `Barter: ${offer.barterDescription} (declared ${formatCurrency(offer.barterDeclaredValuePhp ?? 0)})`;
}

export default function SagipOfferBoard({
  request,
  allOffers,
  now,
  onAccept,
  onReject,
  onClose,
  onPreviewSupplier,
}: {
  request: SagipRequest;
  allOffers: BlindOffer[];
  now: number;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onClose: () => void;
  onPreviewSupplier: () => void;
}) {
  const visible = sortOffers(request, visibleOffers(allOffers, request.id, now));
  const remaining = remainingQuantity(request);

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>{request.title}</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${request.title}`} title={`Close ${request.title}`}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>{request.title}</h2>
        <p className={styles.sagipOfferMeter}>{request.fulfilledQty} of {request.quantity} {request.unit} secured</p>
        <button className={styles.secondaryButton} type="button" onClick={onPreviewSupplier}>Preview as supplier</button>

        {visible.length === 0 ? (
          <p>No offers yet. Offers arrive within moments of posting.</p>
        ) : (
          <ul className={styles.responderList} aria-label="Blind offers">
            {visible.map((offer) => (
              <li className={styles.responderRow} key={offer.id}>
                <div>
                  <h3>{offer.bidderLabel}</h3>
                  <p data-testid="sagip-offer-price">{offerSummary(offer)}</p>
                  <small>{offer.quantityOffered} {request.unit} offered - {offer.status}</small>
                </div>
                <div className={styles.responderTrust}>
                  <span>{offer.bidderKycStatus === "verified" ? "Verified Business" : "Provisional - pending review"}</span>
                  {offer.status === "pending" || offer.status === "negotiating" ? (
                    <div className={styles.sagipOfferActions}>
                      <button className={styles.responderAction} type="button" disabled={remaining <= 0} onClick={() => onAccept(offer.id)}>
                        Accept
                      </button>
                      <button className={styles.responderAction} type="button" onClick={() => onReject(offer.id)}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
```

Update `web/components/kapitbiz/SagipCenterScreen.tsx`:

Extend the surface type and imports:

```ts
import { generateOffersForRequest, postSagipRequest, remainingQuantity, type KapitBizSagipState, type SagipAction, type SagipCategory, type SagipRequest, type SagipRequestKind } from "@/lib/kapitbiz-sagip";
import SagipOfferBoard from "./SagipOfferBoard";
```

```ts
type SagipSurface = { kind: "closed" } | { kind: "post-request" } | { kind: "offer-board"; requestId: string };
```

Make request list items clickable and add the offer-board render branch. Replace the `<ul>` block:

```tsx
<ul className={styles.sagipRequestList} aria-label={segment === "need" ? "Posted requests" : "Posted surplus"}>
  {requests.map((request) => (
    <li key={request.id}>
      <button type="button" className={styles.inlineAction} onClick={() => setSurface({ kind: "offer-board", requestId: request.id })}>
        {request.title}
      </button>
      <small>{remainingQuantity(request)} of {request.quantity} {request.unit} remaining</small>
    </li>
  ))}
</ul>
```

Add handlers and the offer-board dialog branch (alongside the existing `post-request` branch):

```ts
const activeRequest: SagipRequest | undefined = surface.kind === "offer-board"
  ? state.requests.find((request) => request.id === surface.requestId)
  : undefined;

const acceptOffer = (offerId: string) => dispatch({ type: "accept-offer", offerId, at: now });
const rejectOffer = (offerId: string) => dispatch({ type: "reject-offer", offerId });
```

```tsx
{surface.kind === "post-request" ? (
  <HazardAssistDialog label={postLabel} focusKey="post-request" onClose={() => setSurface({ kind: "closed" })}>
    <SagipRequestForm kind={segment} onSubmit={submitRequest} onClose={() => setSurface({ kind: "closed" })} />
  </HazardAssistDialog>
) : surface.kind === "offer-board" && activeRequest ? (
  <HazardAssistDialog label={activeRequest.title} focusKey={activeRequest.id} onClose={() => setSurface({ kind: "closed" })}>
    <SagipOfferBoard
      request={activeRequest}
      allOffers={state.offers}
      now={now}
      onAccept={acceptOffer}
      onReject={rejectOffer}
      onClose={() => setSurface({ kind: "closed" })}
      onPreviewSupplier={() => {}}
    />
  </HazardAssistDialog>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/SagipOfferBoard.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add the Sagip offer board with sorted blind offers"
```

---

## Task 7: Accept flow — quantity math and fulfilled-meter in the UI

**Files:**
- Modify: `web/tests/kapitbiz-sagip-ui.test.tsx`

(No component changes needed — Task 6 already wired `onAccept`/`onReject` and the reducer math is covered by Task 1's unit tests. This task adds an end-to-end UI test proving accept decrements remaining quantity and disables further accepts once fulfilled, since that's the PRD-critical "multi-accept until demand is met" behavior a judge will directly test.)

**Interfaces:**
- Consumes: everything from Tasks 1–6, no new interfaces produced.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Sagip Center multi-accept", () => {
  it("accepting an offer updates the fulfilled-meter and disables Accept once demand is met", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    expect(within(board).getByText("0 of 40 kg secured")).toBeInTheDocument();

    const acceptButtons = within(board).getAllByRole("button", { name: "Accept" });
    await user.click(acceptButtons[0]);
    expect(await within(board).findByText(/of 40 kg secured/)).not.toHaveTextContent("0 of 40 kg secured");
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: This should already PASS given Task 6's wiring — if it fails, the failure will point at exactly which prop/handler is missing in `SagipCenterScreen.tsx`'s `acceptOffer` wiring; fix that wiring to match Task 6's code before proceeding.

- [ ] **Step 3: Commit**

```bash
git add web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "test: cover multi-accept fulfilled-meter behavior end to end"
```

---

## Task 8: Negotiate (counter-offer) action

**Files:**
- Modify: `web/components/kapitbiz/SagipOfferBoard.tsx`
- Modify: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `negotiate-offer` action (Task 1).
- Produces: `SagipOfferBoard` gains an `onNegotiate: (offerId: string, counter: { kind: "cash"; pricePhp: number }) => void` prop and an inline counter-offer input per offer card.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Sagip Center negotiate", () => {
  it("lets the requester submit a cash counter-offer", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    const negotiateButtons = within(board).getAllByRole("button", { name: "Negotiate" });
    await user.click(negotiateButtons[0]);
    const priceInput = within(board).getAllByLabelText("Counter price (PHP)")[0];
    await user.clear(priceInput);
    await user.type(priceInput, "30");
    await user.click(within(board).getAllByRole("button", { name: "Send counter-offer" })[0]);

    expect(await within(board).findByText(/negotiating/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no "Negotiate" button exists yet

- [ ] **Step 3: Write the implementation**

In `web/components/kapitbiz/SagipOfferBoard.tsx`, add `useState` and a per-offer negotiate-open flag, plus the `onNegotiate` prop:

```ts
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { remainingQuantity, sortOffers, visibleOffers, type BlindOffer, type SagipRequest } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";
```

```ts
export default function SagipOfferBoard({
  request,
  allOffers,
  now,
  onAccept,
  onReject,
  onNegotiate,
  onClose,
  onPreviewSupplier,
}: {
  request: SagipRequest;
  allOffers: BlindOffer[];
  now: number;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string, counterPricePhp: number) => void;
  onClose: () => void;
  onPreviewSupplier: () => void;
}) {
  const [negotiatingOfferId, setNegotiatingOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const visible = sortOffers(request, visibleOffers(allOffers, request.id, now));
  const remaining = remainingQuantity(request);

  const sendCounter = (offerId: string) => {
    const parsed = Number(counterPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onNegotiate(offerId, parsed);
    setNegotiatingOfferId(null);
    setCounterPrice("");
  };
```

Replace the actions block inside the offer list item:

```tsx
{offer.status === "pending" || offer.status === "negotiating" ? (
  <div className={styles.sagipOfferActions}>
    <button className={styles.responderAction} type="button" disabled={remaining <= 0} onClick={() => onAccept(offer.id)}>
      Accept
    </button>
    <button className={styles.responderAction} type="button" onClick={() => setNegotiatingOfferId(offer.id)}>
      Negotiate
    </button>
    <button className={styles.responderAction} type="button" onClick={() => onReject(offer.id)}>
      Reject
    </button>
  </div>
) : null}
{negotiatingOfferId === offer.id ? (
  <div className={styles.sagipNegotiateForm}>
    <label>
      Counter price (PHP)
      <input type="number" min="1" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} />
    </label>
    <button className={styles.secondaryButton} type="button" onClick={() => sendCounter(offer.id)}>Send counter-offer</button>
  </div>
) : null}
```

Update `web/components/kapitbiz/SagipCenterScreen.tsx` — add the handler and prop:

```ts
const negotiateOffer = (offerId: string, counterPricePhp: number) =>
  dispatch({ type: "negotiate-offer", offerId, counter: { kind: "cash", pricePhp: counterPricePhp } });
```

```tsx
<SagipOfferBoard
  request={activeRequest}
  allOffers={state.offers}
  now={now}
  onAccept={acceptOffer}
  onReject={rejectOffer}
  onNegotiate={negotiateOffer}
  onClose={() => setSurface({ kind: "closed" })}
  onPreviewSupplier={() => {}}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/SagipOfferBoard.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add cash counter-offer negotiation to the Sagip offer board"
```

---

## Task 9: Barter proposal

**Files:**
- Modify: `web/components/kapitbiz/SagipOfferBoard.tsx`
- Modify: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `negotiate-offer` action's barter branch (Task 1).
- Produces: `SagipOfferBoard` gains a "Propose barter" toggle alongside "Negotiate" reusing the same negotiate form, switched to barter fields.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Sagip Center barter", () => {
  it("lets the requester propose a barter counter with a declared value", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    await user.click(within(board).getAllByRole("button", { name: "Propose barter" })[0]);
    await user.type(within(board).getAllByLabelText("Goods offered")[0], "10 sacks of rice");
    await user.type(within(board).getAllByLabelText("Declared value (PHP)")[0], "900");
    await user.click(within(board).getAllByRole("button", { name: "Send barter proposal" })[0]);

    expect(await within(board).findByText(/Barter: 10 sacks of rice/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no "Propose barter" button exists yet

- [ ] **Step 3: Write the implementation**

In `web/components/kapitbiz/SagipOfferBoard.tsx`, add barter state and prop:

```ts
export default function SagipOfferBoard({
  request,
  allOffers,
  now,
  onAccept,
  onReject,
  onNegotiate,
  onBarter,
  onClose,
  onPreviewSupplier,
}: {
  request: SagipRequest;
  allOffers: BlindOffer[];
  now: number;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string, counterPricePhp: number) => void;
  onBarter: (offerId: string, description: string, declaredValuePhp: number) => void;
  onClose: () => void;
  onPreviewSupplier: () => void;
}) {
  const [negotiatingOfferId, setNegotiatingOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [barterOfferId, setBarterOfferId] = useState<string | null>(null);
  const [barterDescription, setBarterDescription] = useState("");
  const [barterValue, setBarterValue] = useState("");
  const visible = sortOffers(request, visibleOffers(allOffers, request.id, now));
  const remaining = remainingQuantity(request);

  const sendCounter = (offerId: string) => {
    const parsed = Number(counterPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onNegotiate(offerId, parsed);
    setNegotiatingOfferId(null);
    setCounterPrice("");
  };
  const sendBarter = (offerId: string) => {
    const parsedValue = Number(barterValue);
    if (!barterDescription.trim() || !Number.isFinite(parsedValue) || parsedValue <= 0) return;
    onBarter(offerId, barterDescription.trim(), parsedValue);
    setBarterOfferId(null);
    setBarterDescription("");
    setBarterValue("");
  };
```

Add the "Propose barter" button alongside "Negotiate" and its form beneath the negotiate form:

```tsx
{offer.status === "pending" || offer.status === "negotiating" ? (
  <div className={styles.sagipOfferActions}>
    <button className={styles.responderAction} type="button" disabled={remaining <= 0} onClick={() => onAccept(offer.id)}>
      Accept
    </button>
    <button className={styles.responderAction} type="button" onClick={() => setNegotiatingOfferId(offer.id)}>
      Negotiate
    </button>
    <button className={styles.responderAction} type="button" onClick={() => setBarterOfferId(offer.id)}>
      Propose barter
    </button>
    <button className={styles.responderAction} type="button" onClick={() => onReject(offer.id)}>
      Reject
    </button>
  </div>
) : null}
{negotiatingOfferId === offer.id ? (
  <div className={styles.sagipNegotiateForm}>
    <label>
      Counter price (PHP)
      <input type="number" min="1" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} />
    </label>
    <button className={styles.secondaryButton} type="button" onClick={() => sendCounter(offer.id)}>Send counter-offer</button>
  </div>
) : null}
{barterOfferId === offer.id ? (
  <div className={styles.sagipNegotiateForm}>
    <label>
      Goods offered
      <input value={barterDescription} onChange={(event) => setBarterDescription(event.target.value)} placeholder="10 sacks of rice" />
    </label>
    <label>
      Declared value (PHP)
      <input type="number" min="1" value={barterValue} onChange={(event) => setBarterValue(event.target.value)} />
    </label>
    <button className={styles.secondaryButton} type="button" onClick={() => sendBarter(offer.id)}>Send barter proposal</button>
  </div>
) : null}
```

Update `web/components/kapitbiz/SagipCenterScreen.tsx`:

```ts
const barterOffer = (offerId: string, description: string, declaredValuePhp: number) =>
  dispatch({ type: "negotiate-offer", offerId, counter: { kind: "barter", description, declaredValuePhp } });
```

```tsx
<SagipOfferBoard
  request={activeRequest}
  allOffers={state.offers}
  now={now}
  onAccept={acceptOffer}
  onReject={rejectOffer}
  onNegotiate={negotiateOffer}
  onBarter={barterOffer}
  onClose={() => setSurface({ kind: "closed" })}
  onPreviewSupplier={() => {}}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/SagipOfferBoard.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add barter counter-proposal with declared peso value"
```

---

## Task 10: Supplier preview with Calamity Mode SRP ceiling enforcement

**Files:**
- Create: `web/components/kapitbiz/SupplierPreviewDialog.tsx`
- Modify: `web/components/kapitbiz/SagipCenterScreen.tsx`
- Modify: `web/components/kapitbiz/SagipRequestForm.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: `SagipRequest.srpCeilingPhp`/`calamityModeActive` (Task 1).
- Produces: `SupplierPreviewDialog` component (props: `request: SagipRequest`, `onClose: () => void`) — self-contained, no state mutation (preview only, matches design doc).

This task also adds a "Calamity Mode" toggle to `SagipRequestForm` so the demo can post a request with `calamityModeActive: true`, since Task 5 hardcoded it to `false`.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Supplier preview and Calamity Mode price ceiling", () => {
  it("blocks a supplier price above the SRP ceiling when Calamity Mode is active", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByLabelText("Calamity Mode is active for this request"));
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    await user.click(within(board).getByRole("button", { name: "Preview as supplier" }));
    const preview = await screen.findByRole("dialog", { name: "Preview as supplier" });

    expect(within(preview).getByText(/Price Act ceiling: PHP55/)).toBeInTheDocument();
    const priceInput = within(preview).getByLabelText("Your price (PHP)");
    await user.type(priceInput, "80");
    const submit = within(preview).getByRole("button", { name: "Submit offer" });
    expect(submit).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no Calamity Mode checkbox, no "Preview as supplier" dialog

- [ ] **Step 3: Add the Calamity Mode toggle to the request form**

In `web/components/kapitbiz/SagipRequestForm.tsx`, add state and the checkbox, and include it in the submitted payload:

```ts
export default function SagipRequestForm({
  kind,
  onSubmit,
  onClose,
}: {
  kind: SagipRequestKind;
  onSubmit: (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number; calamityModeActive: boolean }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SagipCategory>("dry-ice");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("");
  const [windowHours, setWindowHours] = useState(24);
  const [calamityModeActive, setCalamityModeActive] = useState(false);
  const label = kind === "need" ? "Post a request" : "Post surplus";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!title.trim() || !unit.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    onSubmit({ title: title.trim(), category, quantity: parsedQuantity, unit: unit.trim(), windowHours, calamityModeActive });
  };
```

Add the checkbox before the action row in the form JSX:

```tsx
<label>
  <input type="checkbox" checked={calamityModeActive} onChange={(event) => setCalamityModeActive(event.target.checked)} aria-label="Calamity Mode is active for this request" />
  Calamity Mode is active for this request
</label>
```

Update `web/components/kapitbiz/SagipCenterScreen.tsx`'s `submitRequest` to pass the flag through (it already spreads `input`, so no change needed there since `calamityModeActive` now flows in via `input`) — remove the hardcoded `calamityModeActive: false` and rely on the spread:

```ts
const submitRequest = (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number; calamityModeActive: boolean }) => {
  const request = postSagipRequest({ ...input, kind: segment }, now);
  dispatch({ type: "post-request", request });
  dispatch({ type: "receive-offers", offers: generateOffersForRequest(request, now) });
  setSurface({ kind: "closed" });
};
```

- [ ] **Step 4: Create the supplier preview dialog**

Create `web/components/kapitbiz/SupplierPreviewDialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SagipRequest } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `PHP${value.toLocaleString("en-PH")}`;
}

export default function SupplierPreviewDialog({
  request,
  onClose,
}: {
  request: SagipRequest;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const parsedPrice = Number(price);
  const overCeiling = request.srpCeilingPhp !== null && Number.isFinite(parsedPrice) && parsedPrice > request.srpCeilingPhp;
  const canSubmit = price.trim() !== "" && Number.isFinite(parsedPrice) && parsedPrice > 0 && !overCeiling;

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Preview as supplier</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close Preview as supplier" title="Close Preview as supplier">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>What a supplier sees</h2>
        <p>{request.title} - {request.quantity} {request.unit} requested.</p>
        {request.calamityModeActive && request.srpCeilingPhp !== null ? (
          <p className={styles.sagipPriceCeilingNote}>Price Act ceiling: {formatCurrency(request.srpCeilingPhp)} per {request.unit}. This request is under a declared calamity.</p>
        ) : null}
        <label>
          Your price (PHP)
          <input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        {overCeiling ? <p className={styles.sagipPriceCeilingNote}>That price is above the Price Act ceiling and cannot be submitted.</p> : null}
        <button className={styles.primaryButton} type="button" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
          Submit offer
        </button>
        {submitted ? <p role="status">Preview only - no real offer was sent.</p> : null}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Wire it into `SagipCenterScreen.tsx`**

Extend the surface type and add the render branch:

```ts
type SagipSurface = { kind: "closed" } | { kind: "post-request" } | { kind: "offer-board"; requestId: string } | { kind: "supplier-preview"; requestId: string };
```

```ts
import SupplierPreviewDialog from "./SupplierPreviewDialog";
```

Change `onPreviewSupplier={() => {}}` to open the new surface:

```tsx
onPreviewSupplier={() => setSurface({ kind: "supplier-preview", requestId: activeRequest.id })}
```

Add the render branch after the `offer-board` branch:

```tsx
) : surface.kind === "supplier-preview" && activeRequest ? (
  <HazardAssistDialog label="Preview as supplier" focusKey={`supplier-${activeRequest.id}`} onClose={() => setSurface({ kind: "closed" })}>
    <SupplierPreviewDialog request={activeRequest} onClose={() => setSurface({ kind: "closed" })} />
  </HazardAssistDialog>
) : null}
```

Update the `activeRequest` lookup to cover both surfaces:

```ts
const activeRequest: SagipRequest | undefined = surface.kind === "offer-board" || surface.kind === "supplier-preview"
  ? state.requests.find((request) => request.id === surface.requestId)
  : undefined;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 7: Commit**

```bash
git add web/components/kapitbiz/SupplierPreviewDialog.tsx web/components/kapitbiz/SagipCenterScreen.tsx web/components/kapitbiz/SagipRequestForm.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: add supplier preview with live Calamity Mode price ceiling enforcement"
```

---

## Task 11: KYC status badge on the Business profile

**Files:**
- Modify: `web/components/kapitbiz/MenuScreen.tsx`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: nothing new — this is a static seeded badge matching the merchant persona, consistent with the rest of the app's seeded-data approach.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("KYC status", () => {
  it("shows a Verified badge on the business profile", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Business profile" }));
    const dialog = screen.getByRole("dialog", { name: "Business profile" });
    expect(within(dialog).getByText("Verified")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: FAIL — no "Verified" text on the business profile dialog

- [ ] **Step 3: Write the implementation**

In `web/components/kapitbiz/MenuScreen.tsx`, update the `detailCopy.profile.body` to a JSX-friendly structure. Since `detailCopy` is currently `Record<Detail, { title: string; body: string }>` rendered as `<p>{detailCopy[detail].body}</p>`, add a dedicated badge only for the `profile` detail by changing the render call site rather than the shared type:

Change the dialog render block:

```tsx
{detail ? (
  <DetailDialog title={detailCopy[detail].title} onClose={closeDialog}>
    {detail === "profile" ? <span className={styles.kycBadge} data-status="verified">Verified</span> : null}
    <p>{detailCopy[detail].body}</p>
  </DetailDialog>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/MenuScreen.tsx web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: show a Verified KYC badge on the business profile"
```

---

## Task 12: Nearby Tulong end-to-end + CSS + final verification

**Files:**
- Modify: `web/components/kapitbiz/KapitBizRelay.module.css`
- Test: `web/tests/kapitbiz-sagip-ui.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–11. This task proves Nearby Tulong (the `"surplus"` segment) works end to end through the exact same components, and finishes the visual styling.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/kapitbiz-sagip-ui.test.tsx`:

```ts
describe("Nearby Tulong (surplus segment)", () => {
  it("posts surplus, receives Buyer-labeled offers, and sorts highest price first", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Offering surplus" }));
    await user.click(screen.getByRole("button", { name: "Post surplus" }));
    const postDialog = screen.getByRole("dialog", { name: "Post surplus" });
    await user.type(within(postDialog).getByLabelText("Title"), "50 sacks of flour nearing expiration");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "raw-material");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "50");
    await user.type(within(postDialog).getByLabelText("Unit"), "sacks");
    await user.click(within(postDialog).getByRole("button", { name: "Post surplus" }));

    await user.click(await screen.findByText("50 sacks of flour nearing expiration"));
    const board = await screen.findByRole("dialog", { name: "50 sacks of flour nearing expiration" });
    const buyerNames = within(board).getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(buyerNames.every((name) => name?.startsWith("Buyer "))).toBe(true);

    const prices = within(board).getAllByTestId("sagip-offer-price").map((node) => Number(node.textContent?.replace(/\D/g, "")));
    const sortedDescending = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sortedDescending);
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `cd web && npx vitest run tests/kapitbiz-sagip-ui.test.tsx`
Expected: This should PASS given Tasks 1–10 already made every component generic over `kind` — if it fails, the failure output will point at the exact spot where `"need"` was hardcoded instead of using `segment`/`request.kind`; fix that spot to match the rest of the generic wiring.

- [ ] **Step 3: Add CSS**

Append to the end of `web/components/kapitbiz/KapitBizRelay.module.css`:

```css
.sagipScreen { display: grid; gap: 16px; padding-top: 20px; }
.sagipRequestList { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.sagipRequestList li { display: grid; gap: 2px; border-bottom: 1px solid #bec8ca; padding: 10px 0; }
.sagipRequestList li small { color: #526163; font-size: 0.78rem; }
.sagipOfferMeter { margin: 0; color: #002d86; font-family: var(--font-mono), ui-monospace, monospace; font-size: 0.92rem; font-weight: 700; }
.sagipOfferActions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.sagipNegotiateForm { display: grid; gap: 8px; margin-top: 10px; border-top: 1px solid #bec8ca; padding-top: 10px; }
.sagipNegotiateForm label { display: grid; gap: 4px; font-size: 0.82rem; font-weight: 700; }
.sagipNegotiateForm input { min-height: 40px; border: 1px solid #bec8ca; border-radius: 4px; padding: 8px; }
.sagipPriceCeilingNote { margin: 0; border-left: 3px solid #c66c00; background: #fff7e8; color: #523200; padding: 10px 12px; font-size: 0.82rem; line-height: 1.3rem; }
.kycBadge { display: inline-block; margin-bottom: 8px; border-radius: 4px; background: #effcf4; color: #087a35; padding: 4px 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
```

- [ ] **Step 4: Run the full verification suite**

Run: `cd web && npm test`
Expected: PASS, all tests green (existing 104 + new Sagip tests)

Run: `cd web && npm run lint`
Expected: 0 errors (pre-existing `no-img-element` warning in `IntakeForm.tsx` is unrelated and expected)

Run: `cd web && npm run build`
Expected: Compiles successfully, 0 TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add web/components/kapitbiz/KapitBizRelay.module.css web/tests/kapitbiz-sagip-ui.test.tsx
git commit -m "feat: style Sagip Center and verify Nearby Tulong end to end"
```

---

## Self-Review Notes

- **Spec coverage:** Navigation (§1) → Task 4. Data model (§2) → Tasks 1–3. Screens/interactions (§3: request board, accept/negotiate/reject/barter, multi-accept, preview-as-supplier + SRP ceiling) → Tasks 5–10. Timing/wiring/testing (§4) → Tasks 2, 3, 4, and the test coverage threaded through every task. KYC (§1 nav notes) → Task 11. Nearby Tulong → Task 12 (proves reuse, no new components needed since `kind` was threaded through from Task 1 onward).
- **Placeholder scan:** every step has complete, real code; no "TODO"/"similar to Task N" shortcuts.
- **Type consistency checked:** `SagipRequest`, `BlindOffer`, `SagipAction` defined once in Task 1 and reused verbatim in every later task; `remainingQuantity`, `sortOffers`, `visibleOffers`, `generateOffersForRequest` defined in Tasks 1–2 and consumed with matching signatures in Tasks 4–10; `SagipCenterScreen`'s `SagipSurface` union is extended incrementally (Task 4 → 5 → 6 → 10) rather than redefined, so earlier variants stay valid.
