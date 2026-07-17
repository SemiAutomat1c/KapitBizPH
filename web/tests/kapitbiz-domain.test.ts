import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateReservation,
  createSeedState,
  deriveSelection,
  eligibleHosts,
  relayReducer,
  useKapitBiz,
} from "@/lib/kapitbiz";

const STORAGE_KEY = "kapitbiz-relay-v2";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("KapitBiz relay domain", () => {
  it("starts with the approved demo totals", () => {
    const state = createSeedState(1_000_000);
    expect(state.step).toBe("incident");
    expect(state.inventory.reduce((sum, item) => sum + item.totalValue, 0)).toBe(21_800);
    expect(deriveSelection(state)).toMatchObject({
      selectedGroups: 3,
      selectedWeightKg: 42,
      selectedValue: 16_500,
    });
  });

  it("clamps inventory quantity and recalculates value", () => {
    const state = createSeedState(1_000_000);
    const next = relayReducer(state, { type: "set-quantity", itemId: "ice-cream", quantity: 999 });
    expect(next.inventory.find((item) => item.id === "ice-cream")?.selectedQuantity).toBe(18);
    expect(deriveSelection(next).selectedValue).toBe(19_300);
  });

  it("rejects hosts without enough capacity", () => {
    const state = createSeedState(1_000_000);
    expect(eligibleHosts(state).map((host) => host.id)).toEqual(["northline", "tagum-north"]);
  });

  it("keeps Northline recommended when eligible host input order changes", () => {
    const state = createSeedState(1_000_000);
    const reversedState = { ...state, hosts: [...state.hosts].reverse() };

    expect(eligibleHosts(state)[0]?.id).toBe("northline");
    expect(eligibleHosts(reversedState)[0]?.id).toBe("northline");
  });

  it("ranks eligible hosts by capacity headroom, route, window, fee, then stable id", () => {
    const state = createSeedState(1_000_000);
    const baseHost = state.hosts.find((host) => host.id === "northline");
    expect(baseHost).toBeDefined();

    const hosts = [
      { ...baseHost!, id: "tie-z", name: "Tie Z", capacityKg: 60, transferMinutes: 30, windowHours: 12, fee: 300 },
      { ...baseHost!, id: "lower-fee", name: "Lower fee", capacityKg: 60, transferMinutes: 30, windowHours: 12, fee: 200 },
      { ...baseHost!, id: "longer-window", name: "Longer window", capacityKg: 60, transferMinutes: 30, windowHours: 20, fee: 900 },
      { ...baseHost!, id: "faster-route", name: "Faster route", capacityKg: 60, transferMinutes: 20, windowHours: 6, fee: 900 },
      { ...baseHost!, id: "more-headroom", name: "More headroom", capacityKg: 70, transferMinutes: 80, windowHours: 6, fee: 900 },
      { ...baseHost!, id: "tie-a", name: "Tie A", capacityKg: 60, transferMinutes: 30, windowHours: 12, fee: 300 },
    ];

    expect(eligibleHosts({ ...state, hosts }).map((host) => host.id)).toEqual([
      "more-headroom",
      "faster-route",
      "longer-window",
      "lower-fee",
      "tie-a",
      "tie-z",
    ]);
  });

  it("calculates the approved PHP 450 reservation", () => {
    const state = createSeedState(1_000_000);
    const withHost = relayReducer(state, { type: "select-host", hostId: "northline" });
    const withTransport = relayReducer(withHost, { type: "select-transport", transportId: "rider" });
    expect(calculateReservation(withTransport)).toEqual({ storageFee: 300, transportFee: 150, total: 450 });
  });

  it("rejects a capable transport that cannot reach the host within the rescue window", () => {
    const state = createSeedState(1_000_000);
    const withSlowTransport = {
      ...state,
      transportOptions: state.transportOptions.map((option) =>
        option.id === "rider" ? { ...option, arrivalMinutes: 60 } : option,
      ),
    };
    const withHost = relayReducer(withSlowTransport, { type: "select-host", hostId: "northline" });

    expect(relayReducer(withHost, { type: "select-transport", transportId: "rider" }).selectedTransportId).toBeNull();
  });

  it("does not confirm a reservation when its transport misses the rescue window", () => {
    const triage = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
    const capacity = relayReducer(triage, { type: "go-to", step: "capacity" });
    const withHost = relayReducer(capacity, { type: "select-host", hostId: "northline" });
    const reservation = relayReducer(withHost, { type: "go-to", step: "reservation" });
    const withLateTransport = {
      ...reservation,
      transportOptions: reservation.transportOptions.map((option) =>
        option.id === "rider" ? { ...option, arrivalMinutes: 60 } : option,
      ),
      selectedTransportId: "rider",
    };

    expect(relayReducer(withLateTransport, { type: "confirm-reservation", at: 1_000_100 })).toBe(withLateTransport);
  });

  it("clears a selected transport when inventory shortens the rescue window", () => {
    const state = createSeedState(1_000_000);
    const withSlowTransport = {
      ...state,
      transportOptions: state.transportOptions.map((option) =>
        option.id === "rider" ? { ...option, arrivalMinutes: 60 } : option,
      ),
    };
    const withLongerWindow = relayReducer(withSlowTransport, { type: "toggle-item", itemId: "ice-cream" });
    const withHost = relayReducer(withLongerWindow, { type: "select-host", hostId: "northline" });
    const withTransport = relayReducer(withHost, { type: "select-transport", transportId: "rider" });

    expect(withTransport.selectedTransportId).toBe("rider");

    const withShorterWindow = relayReducer(withTransport, { type: "toggle-item", itemId: "ice-cream" });
    expect(withShorterWindow.selectedTransportId).toBeNull();
  });

  it("guards invalid forward transitions", () => {
    const state = createSeedState(1_000_000);
    expect(relayReducer(state, { type: "go-to", step: "complete" }).step).toBe("incident");
  });

  it("does not confirm a reservation before reaching the reservation step", () => {
    const state = createSeedState(1_000_000);
    const withHost = relayReducer(state, { type: "select-host", hostId: "northline" });
    const withTransport = relayReducer(withHost, { type: "select-transport", transportId: "rider" });

    expect(relayReducer(withTransport, { type: "confirm-reservation", at: 1_000_100 })).toBe(withTransport);
  });

  it("confirms a reservation after the required preceding steps", () => {
    const triage = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
    const capacity = relayReducer(triage, { type: "go-to", step: "capacity" });
    const withHost = relayReducer(capacity, { type: "select-host", hostId: "northline" });
    const reservation = relayReducer(withHost, { type: "go-to", step: "reservation" });
    const withTransport = relayReducer(reservation, { type: "select-transport", transportId: "rider" });

    expect(relayReducer(withTransport, { type: "confirm-reservation", at: 1_000_100 })).toMatchObject({
      step: "handoff",
      reservationConfirmedAt: 1_000_100,
      handoffId: "RE-4892-X",
    });
  });

  it("hydrates valid state and persists reducer updates", async () => {
    const storedState = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
    const { result } = renderHook(() => useKapitBiz());

    await waitFor(() => expect(result.current.state).toEqual(storedState));

    act(() => result.current.dispatch({ type: "go-to", step: "capacity" }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toMatchObject({
        version: 2,
        step: "capacity",
      });
    });
  });

  it("replaces corrupt persisted data with a fresh seed after hydration", async () => {
    vi.spyOn(Date, "now").mockReturnValue(2_000_000);
    window.localStorage.setItem(STORAGE_KEY, "{not-json");
    const { result } = renderHook(() => useKapitBiz());

    await waitFor(() => {
      expect(result.current.state.scenarioStartedAt).toBe(2_000_000);
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toMatchObject({
        version: 2,
        step: "incident",
        scenarioStartedAt: 2_000_000,
      });
    });
  });

  it("replaces persisted data with an invalid state shape", async () => {
    vi.spyOn(Date, "now").mockReturnValue(3_000_000);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, step: "incident" }));
    const { result } = renderHook(() => useKapitBiz());

    await waitFor(() => {
      expect(result.current.state.scenarioStartedAt).toBe(3_000_000);
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toMatchObject({
        version: 2,
        scenarioStartedAt: 3_000_000,
        inventory: expect.any(Array),
      });
    });
  });
});
