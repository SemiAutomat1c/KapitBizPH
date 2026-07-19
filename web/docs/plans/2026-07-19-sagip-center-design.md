# Sagip Center + Nearby Tulong design

Status: validated via brainstorming, ready for implementation planning.

## Why

The KapitBiz Ph PRD (v9.0) describes a two-sided B2B marketplace (Sagip Center: blind-offer bidding,
KYC verification tiers, Calamity Mode price ceiling, Nearby Tulong inverse marketplace). The current
KapitBiz Relay app only implements PRD Bracket 4 (a single business rescuing at-risk stock to a known,
pre-listed capacity host — no bidding, no other businesses, no KYC, no price enforcement). This design
closes that gap within the existing frontend-only, seeded-data architecture (no backend, no auth, no
real payments — consistent with the rest of the app and README's stated scope).

## Scope

In scope: Sagip Center blind-offer marketplace, KYC status UI, Calamity Mode price ceiling enforcement,
Nearby Tulong (inverse marketplace, reusing the same components).

Out of scope (explicitly deferred, needs real third-party integration): SMS gateway fallback, live
hazard APIs (USGS/PSA/PAGASA), real escrow/payment gateway, ₱50 premium reveal (no anonymity-unlock
mechanic exists yet since offers are simulated, not real other users).

## 1. Navigation

The existing Relay flow (Safety Check → cost comparison → match to a known host → QR handoff) **is**
the PRD's "Fast Lane" and is untouched by this work.

Sagip Center is the "Slow Lane": a new 5th bottom-nav tab, between Network and Activity. It contains
two segments (mirroring Network's Storage/Transport toggle):

- **Requesting** — Sagip Center, demand-driven (post a need, offers sort low→high)
- **Offering surplus** — Nearby Tulong, supply-driven (post surplus, offers sort high→low)

Both segments render the same underlying components; only `SagipRequest.kind` ("need" | "surplus")
differs, which flips the sort direction and copy.

KYC status appears in two places: Menu → Business profile (Verified / Provisional badge), and on every
blind-offer card next to the anonymous bidder label.

## 2. Data model

New module `lib/kapitbiz-sagip.ts`, following the existing `lib/kapitbiz.ts` /
`lib/kapitbiz-hazard-assist.ts` pattern (typed state + reducer + seed data + selectors).

```ts
type SagipRequest = {
  id: string;
  kind: "need" | "surplus";
  title: string;
  category: string;
  quantity: number;
  unit: string;
  postedAt: number;
  windowHours: number;
  closesAt: number;
  status: "open" | "closed" | "fulfilled";
  fulfilledQty: number;
  calamityModeActive: boolean;
  srpCeilingPhp: number | null;
};

type BlindOffer = {
  id: string;
  requestId: string;
  bidderLabel: string; // "Supplier A", "Supplier B"... sequential per request, never a real name
  bidderKycStatus: "verified" | "provisional";
  offerType: "cash" | "barter";
  pricePhp: number | null;
  barterDescription: string | null;
  barterDeclaredValuePhp: number | null;
  quantityOffered: number;
  submittedAt: number;
  arrivesAt: number; // when this offer becomes visible; fixed at creation, not a live timer
  status: "pending" | "accepted" | "negotiating" | "rejected";
};
```

Simulated bidders: a seeded pool of ~8 fake supplier businesses (name, KYC status, typical price band
per category), generated the same way as today's `GOOD_SAMARITAN_RESPONDERS`. Posting a request
generates a handful of matching offers with staggered `arrivesAt` timestamps.

Reducer actions: `post-request`, `accept-offer` (decrements remaining quantity, supports multi-accept),
`negotiate-offer`, `reject-offer`, `close-request`.

Sort selector: `sortOffers(request, offers)` — ascending for "need", descending for "surplus". This one
function is the entire mechanism that lets Nearby Tulong reuse the Sagip Center board with no
duplicated UI.

## 3. Screens & interactions

**Sagip Center tab** — segment toggle (Requesting / Offering surplus) + list of your posted
requests/surplus + "Post a request" / "Post surplus" button.

**Request detail (offer board)** — header shows title, quantity, countdown to `closesAt`, and a
fulfilled-meter ("28 of 50 kg secured"). Offer list sorted per `kind`, each card shows bidder label +
KYC badge, price or barter description + declared value, and time since submission. Actions per offer:
**Accept** (decrements remaining quantity; once quantity for that offer is confirmed delivered it
triggers a QR handoff record reusing the existing `HandoffScreen` pattern), **Negotiate** (counter-offer
input), **Reject**, **Propose barter** (when `offerType` allows).

**Preview as supplier** — each of your own posted requests has a "Preview as supplier" affordance
(same spirit as the existing Rider/Host `RolePreviewScreen`, but self-contained inside the Sagip Center
tab, not a separate role/session). Opens the form a real supplier would fill out (price, quantity,
barter toggle). When `calamityModeActive` is true, the price field is hard-capped at `srpCeilingPhp`
with an inline "Price Act ceiling: PHP{x}" note and a blocked submit above it — this is what proves
Calamity Mode enforcement live, not just in copy.

## 4. Timing, wiring, error handling, testing

**Timing**: following the existing `simulatedTransferConfirmedAt(state, now)` pattern — `now` is a
parameter passed into pure selectors, not a scheduled callback. Each offer has a fixed `arrivesAt`
computed once at request-post time. `visibleOffers(request, offers, now)` filters to
`arrivesAt <= now`. The screen ticks `now` every second while open (same `setInterval` pattern as
`ActiveDisruptionScreen.tsx`), so the list grows naturally and survives reload/backgrounding without
losing or double-firing offers.

**Wiring**: `lib/kapitbiz-sagip.ts` state owned by `KapitBizDemoApp.tsx`, persisted to `localStorage`
alongside the existing three stores. `MerchantTab` gains `"sagip"`. `AppChrome.tsx`'s `navItems` gets a
5th entry. New components: `SagipCenterScreen.tsx`, `SagipRequestForm.tsx`, `SagipOfferBoard.tsx`,
`SupplierPreviewDialog.tsx`. CSS reuses existing `.primaryButton`/`.secondaryButton`/`.verifiedBadge`
classes rather than inventing new ones.

**Error handling**: no async failure modes since nothing is real I/O. Accepting more than remaining
quantity is disallowed at the button level (disabled + reason text). Submitting a supplier price above
the SRP ceiling is blocked client-side, same pattern as existing form validation.

**Testing**: Vitest + Testing Library, matching existing suites. Reducer unit tests for
`post-request`/`accept-offer`/`negotiate-offer` (quantity math, status transitions), a UI test asserting
the SRP ceiling blocks over-cap submission, and a UI test asserting Nearby Tulong sorts high→low while
Sagip Center sorts low→high from the same component.
