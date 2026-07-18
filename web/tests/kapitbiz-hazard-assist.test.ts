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
      decisionNote: "Relay chosen over simulated generator estimate: PHP714",
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
