import { describe, expect, it } from "vitest";
import { buildActivityFeed } from "@/lib/kapitbiz-activity";
import { createDemoSession } from "@/lib/kapitbiz-demo";
import {
  createHazardAssistState,
  hazardAssistReducer,
} from "@/lib/kapitbiz-hazard-assist";
import { createCompleteStateForTest } from "./kapitbiz-test-helpers";

describe("KapitBiz activity feed", () => {
  it("builds chronological merchant, rider, and custody events", () => {
    const complete = createCompleteStateForTest();
    const session = {
      ...createDemoSession(),
      onboardingComplete: true,
      riderArrivedAt: 4_200_000,
    };

    const feed = buildActivityFeed(complete, session, createHazardAssistState());

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
    expect(feed.find((item) => item.id === "safety-check-answered")?.detail)
      .toContain("Simulated");
  });

  it("keeps a stale Good Samaritan timestamp in its Hazard Assist audit slot", () => {
    const complete = createCompleteStateForTest();
    const session = createDemoSession();
    let hazard = createHazardAssistState();
    hazard = hazardAssistReducer(hazard, { type: "acknowledge-alert" });
    hazard = hazardAssistReducer(hazard, { type: "answer-safety-check", answer: "stock-at-risk" });
    hazard = hazardAssistReducer(hazard, {
      type: "ask-good-samaritans",
      at: complete.scenarioStartedAt - 50_001,
    });
    hazard = hazardAssistReducer(hazard, { type: "start-relay" });

    const feed = buildActivityFeed(complete, session, hazard);

    expect(feed.slice(0, 5).map((item) => item.label)).toEqual([
      "Simulated alert received",
      "Safety Check answered",
      "Fuel comparison generated",
      "Good Samaritan capacity opened",
      "Relay started from Safety Check",
    ]);
    expect(feed.find((item) => item.id === "good-samaritan-opened")?.at)
      .toBe(complete.scenarioStartedAt - 20_000);
    expect(feed.find((item) => item.id === "relay-started-from-safety-check")?.detail)
      .toContain("simulated PHP714 generator estimate");
  });
});
