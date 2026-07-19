import { describe, expect, it } from "vitest";
import {
  createSagipState,
  postSagipRequest,
  remainingQuantity,
  sagipReducer,
  SRP_CEILINGS,
  generateOffersForRequest,
  sortOffers,
  visibleOffers,
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
    state = sagipReducer(state, { type: "accept-offer", offerId: "offer-1" });

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
    state = sagipReducer(state, { type: "accept-offer", offerId: "offer-1" });

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
