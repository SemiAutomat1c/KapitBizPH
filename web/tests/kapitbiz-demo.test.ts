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
