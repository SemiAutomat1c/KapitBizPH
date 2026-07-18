import { describe, expect, it } from "vitest";
import { buildActivityFeed } from "@/lib/kapitbiz-activity";
import { createDemoSession } from "@/lib/kapitbiz-demo";
import { createCompleteStateForTest } from "./kapitbiz-test-helpers";

describe("KapitBiz activity feed", () => {
  it("builds chronological merchant, rider, and custody events", () => {
    const complete = createCompleteStateForTest();
    const session = {
      ...createDemoSession(),
      onboardingComplete: true,
      riderArrivedAt: 4_200_000,
    };

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
});
