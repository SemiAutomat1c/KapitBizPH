import {
  createDemoSession,
  DEMO_SESSION_STORAGE_KEY,
  type KapitBizDemoSession,
} from "@/lib/kapitbiz-demo";
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

export function seedRescueAtHandoff({
  hostId = "northline",
  transportId = "rider",
}: {
  hostId?: string;
  transportId?: string;
} = {}): RelayDemoState {
  let state = seedRescueAtCapacity();
  state = relayReducer(state, { type: "select-host", hostId });
  state = relayReducer(state, { type: "go-to", step: "reservation" });
  state = relayReducer(state, { type: "select-transport", transportId });
  state = relayReducer(state, { type: "confirm-reservation", at: 1_000_100 });
  localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(state));
  return state;
}

export function createCompleteStateForTest(): RelayDemoState {
  const complete = relayReducer(seedRescueAtHandoff(), { type: "confirm-receiver", at: 4_300_100 });
  localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(complete));
  return complete;
}
