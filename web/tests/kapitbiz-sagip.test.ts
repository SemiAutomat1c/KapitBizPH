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
