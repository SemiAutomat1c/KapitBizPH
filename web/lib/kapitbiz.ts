"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kapitbiz-relay-v2";

export type RelayStep = "incident" | "triage" | "capacity" | "reservation" | "handoff" | "complete";

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  availableQuantity: number;
  selectedQuantity: number;
  unitValue: number;
  unitWeightKg: number;
  totalValue: number;
  rescueWindowMinutes: number | null;
  selected: boolean;
}

export interface CapacityHost {
  id: string;
  name: string;
  locality: string;
  coordinates: [number, number];
  capacityKg: number;
  distanceKm: number;
  transferMinutes: number;
  windowHours: number;
  fee: number;
  outsideAffectedArea: boolean;
  reason: string;
}

export interface TransportOption {
  id: string;
  name: string;
  arrivalMinutes: number;
  fee: number;
  capacityKg: number;
}

export interface RelayDemoState {
  version: 2;
  step: RelayStep;
  scenarioStartedAt: number;
  inventory: InventoryItem[];
  hosts: CapacityHost[];
  transportOptions: TransportOption[];
  selectedHostId: string | null;
  selectedTransportId: string | null;
  reservationConfirmedAt: number | null;
  handoffId: string | null;
  receiverConfirmedAt: number | null;
}

export type RelayAction =
  | { type: "start-rescue" }
  | { type: "go-to"; step: RelayStep }
  | { type: "toggle-item"; itemId: string }
  | { type: "set-quantity"; itemId: string; quantity: number }
  | { type: "select-host"; hostId: string }
  | { type: "select-transport"; transportId: string }
  | { type: "confirm-reservation"; at: number }
  | { type: "confirm-receiver"; at: number }
  | { type: "reset"; at: number };

export interface RelaySelection {
  selectedGroups: number;
  selectedQuantity: number;
  selectedWeightKg: number;
  selectedValue: number;
  selectedItems: InventoryItem[];
}

export interface ReservationTotal {
  storageFee: number;
  transportFee: number;
  total: number;
}

const steps: RelayStep[] = ["incident", "triage", "capacity", "reservation", "handoff", "complete"];

export function createSeedState(now: number): RelayDemoState {
  return {
    version: 2,
    step: "incident",
    scenarioStartedAt: now,
    inventory: [
      { id: "ice-cream", name: "Ice cream", unit: "tubs", availableQuantity: 18, selectedQuantity: 11, unitValue: 400, unitWeightKg: 5 / 11, totalValue: 7_200, rescueWindowMinutes: 90, selected: true },
      { id: "frozen-chicken", name: "Frozen chicken", unit: "kg", availableQuantity: 30, selectedQuantity: 25, unitValue: 280, unitWeightKg: 1, totalValue: 8_400, rescueWindowMinutes: 120, selected: true },
      { id: "processed-meat", name: "Processed meat", unit: "kg", availableQuantity: 12, selectedQuantity: 12, unitValue: 425, unitWeightKg: 1, totalValue: 5_100, rescueWindowMinutes: 150, selected: true },
      { id: "canned-goods", name: "Canned goods", unit: "units", availableQuantity: 40, selectedQuantity: 0, unitValue: 27.5, unitWeightKg: 0.4, totalValue: 1_100, rescueWindowMinutes: null, selected: false },
    ],
    hosts: [
      { id: "northline", name: "Northline Cold Storage", locality: "Panabo City", coordinates: [125.684, 7.308], capacityKg: 60, distanceKm: 28, transferMinutes: 38, windowHours: 12, fee: 300, outsideAffectedArea: true, reason: "Generator-backed cold storage outside the affected area." },
      { id: "tagum-north", name: "Tagum North Cold Chain", locality: "Tagum City", coordinates: [125.812, 7.45], capacityKg: 48, distanceKm: 9, transferMinutes: 18, windowHours: 8, fee: 250, outsideAffectedArea: true, reason: "Verified spare freezer capacity in the north cluster." },
      { id: "south-market", name: "South Market Freezer", locality: "Tagum City", coordinates: [125.8, 7.43], capacityKg: 20, distanceKm: 4, transferMinutes: 12, windowHours: 6, fee: 180, outsideAffectedArea: true, reason: "Only 20 kg free." },
      { id: "davao-hub", name: "Davao Regional Hub", locality: "Davao City", coordinates: [125.613, 7.073], capacityKg: 100, distanceKm: 62, transferMinutes: 95, windowHours: 24, fee: 650, outsideAffectedArea: true, reason: "Long route; unsuitable for the active rescue window." },
    ],
    transportOptions: [
      { id: "rider", name: "Rider - Logistics Pro", arrivalMinutes: 15, fee: 150, capacityKg: 50 },
      { id: "van", name: "Refrigerated van", arrivalMinutes: 30, fee: 450, capacityKg: 250 },
    ],
    selectedHostId: null,
    selectedTransportId: null,
    reservationConfirmedAt: null,
    handoffId: null,
    receiverConfirmedAt: null,
  };
}

export function deriveSelection(state: RelayDemoState): RelaySelection {
  const selectedItems = state.inventory.filter((item) => item.selected && item.selectedQuantity > 0);
  const selectedWeightKg = selectedItems.reduce((sum, item) => sum + item.selectedQuantity * item.unitWeightKg, 0);
  const selectedValue = selectedItems.reduce((sum, item) => sum + item.selectedQuantity * item.unitValue, 0);

  return {
    selectedGroups: selectedItems.length,
    selectedQuantity: selectedItems.reduce((sum, item) => sum + item.selectedQuantity, 0),
    selectedWeightKg: round(selectedWeightKg),
    selectedValue: round(selectedValue),
    selectedItems,
  };
}

export function eligibleHosts(state: RelayDemoState): CapacityHost[] {
  const { selectedWeightKg } = deriveSelection(state);
  return state.hosts.filter((host) => host.outsideAffectedArea && host.capacityKg >= selectedWeightKg && host.transferMinutes <= shortestRescueWindow(state));
}

export function calculateReservation(state: RelayDemoState): ReservationTotal {
  const storageFee = state.hosts.find((host) => host.id === state.selectedHostId)?.fee ?? 0;
  const transportFee = state.transportOptions.find((option) => option.id === state.selectedTransportId)?.fee ?? 0;
  return { storageFee, transportFee, total: storageFee + transportFee };
}

export function relayReducer(state: RelayDemoState, action: RelayAction): RelayDemoState {
  switch (action.type) {
    case "start-rescue":
      return state.step === "incident" ? { ...state, step: "triage" } : state;
    case "go-to":
      return canGoTo(state, action.step) ? { ...state, step: action.step } : state;
    case "toggle-item":
      return updateInventory(state, action.itemId, (item) => {
        const selected = !item.selected;
        return { ...item, selected, selectedQuantity: selected && item.selectedQuantity === 0 ? 1 : item.selectedQuantity };
      });
    case "set-quantity":
      return updateInventory(state, action.itemId, (item) => {
        const selectedQuantity = clampQuantity(action.quantity, item.availableQuantity);
        return { ...item, selectedQuantity, selected: selectedQuantity > 0 };
      });
    case "select-host":
      return eligibleHosts(state).some((host) => host.id === action.hostId) ? { ...state, selectedHostId: action.hostId, selectedTransportId: null } : state;
    case "select-transport": {
      const transport = state.transportOptions.find((option) => option.id === action.transportId);
      return transport && transport.capacityKg >= deriveSelection(state).selectedWeightKg ? { ...state, selectedTransportId: transport.id } : state;
    }
    case "confirm-reservation": {
      const hostIsEligible = eligibleHosts(state).some((host) => host.id === state.selectedHostId);
      const transport = state.transportOptions.find((option) => option.id === state.selectedTransportId);
      const transportHasCapacity = transport && transport.capacityKg >= deriveSelection(state).selectedWeightKg;
      return state.step === "reservation" && hostIsEligible && transportHasCapacity
        ? { ...state, step: "handoff", reservationConfirmedAt: action.at, handoffId: "RE-4892-X" }
        : state;
    }
    case "confirm-receiver":
      return state.step === "handoff" && state.handoffId && state.reservationConfirmedAt ? { ...state, step: "complete", receiverConfirmedAt: action.at } : state;
    case "reset":
      return createSeedState(action.at);
  }
}

function canGoTo(state: RelayDemoState, nextStep: RelayStep): boolean {
  const currentIndex = steps.indexOf(state.step);
  const nextIndex = steps.indexOf(nextStep);
  if (nextIndex <= currentIndex) return true;
  if (nextIndex !== currentIndex + 1) return false;

  switch (nextStep) {
    case "triage": return state.step === "incident";
    case "capacity": return deriveSelection(state).selectedGroups > 0;
    case "reservation": return eligibleHosts(state).some((host) => host.id === state.selectedHostId);
    case "handoff": return state.reservationConfirmedAt !== null && state.handoffId !== null;
    case "complete": return state.receiverConfirmedAt !== null;
    case "incident": return true;
  }
}

function updateInventory(state: RelayDemoState, itemId: string, update: (item: InventoryItem) => InventoryItem): RelayDemoState {
  if (!state.inventory.some((item) => item.id === itemId)) return state;
  const inventory = state.inventory.map((item) => (item.id === itemId ? update(item) : item));
  const nextState = { ...state, inventory };
  const selectedHostStillEligible = eligibleHosts(nextState).some((host) => host.id === state.selectedHostId);
  const selectedTransportStillEligible = nextState.transportOptions.some((option) => option.id === state.selectedTransportId && option.capacityKg >= deriveSelection(nextState).selectedWeightKg);
  return { ...nextState, selectedHostId: selectedHostStillEligible ? state.selectedHostId : null, selectedTransportId: selectedHostStillEligible && selectedTransportStillEligible ? state.selectedTransportId : null };
}

function clampQuantity(quantity: number, availableQuantity: number): number {
  return Number.isFinite(quantity) ? Math.min(availableQuantity, Math.max(0, Math.round(quantity))) : 0;
}

function shortestRescueWindow(state: RelayDemoState): number {
  const windows = state.inventory.filter((item) => item.selected && item.selectedQuantity > 0 && item.rescueWindowMinutes !== null).map((item) => item.rescueWindowMinutes as number);
  return windows.length > 0 ? Math.min(...windows) : Infinity;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function isRelayDemoState(value: unknown): value is RelayDemoState {
  if (!isRecord(value) || value.version !== 2 || !isRelayStep(value.step)) return false;
  if (!isFiniteNumber(value.scenarioStartedAt) || !Array.isArray(value.inventory) || !Array.isArray(value.hosts) || !Array.isArray(value.transportOptions)) return false;
  if (!isNullableString(value.selectedHostId) || !isNullableString(value.selectedTransportId) || !isNullableNumber(value.reservationConfirmedAt) || !isNullableString(value.handoffId) || !isNullableNumber(value.receiverConfirmedAt)) return false;
  return value.inventory.every(isInventoryItem) && value.hosts.every(isCapacityHost) && value.transportOptions.every(isTransportOption);
}

function isInventoryItem(value: unknown): value is InventoryItem {
  return isRecord(value) && ["id", "name", "unit"].every((key) => typeof value[key] === "string") && ["availableQuantity", "selectedQuantity", "unitValue", "unitWeightKg", "totalValue"].every((key) => isFiniteNumber(value[key])) && (value.rescueWindowMinutes === null || isFiniteNumber(value.rescueWindowMinutes)) && typeof value.selected === "boolean";
}

function isCapacityHost(value: unknown): value is CapacityHost {
  return isRecord(value) && ["id", "name", "locality", "reason"].every((key) => typeof value[key] === "string") && Array.isArray(value.coordinates) && value.coordinates.length === 2 && value.coordinates.every(isFiniteNumber) && ["capacityKg", "distanceKm", "transferMinutes", "windowHours", "fee"].every((key) => isFiniteNumber(value[key])) && typeof value.outsideAffectedArea === "boolean";
}

function isTransportOption(value: unknown): value is TransportOption {
  return isRecord(value) && ["id", "name"].every((key) => typeof value[key] === "string") && ["arrivalMinutes", "fee", "capacityKg"].every((key) => isFiniteNumber(value[key]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isRelayStep(value: unknown): value is RelayStep {
  return typeof value === "string" && steps.includes(value as RelayStep);
}

function loadState(): RelayDemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    return isRelayDemoState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistState(state: RelayDemoState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private browsing or constrained webviews.
  }
}

export function useKapitBiz() {
  const [state, setState] = useState<RelayDemoState>(() => createSeedState(Date.now()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState((current) => loadState() ?? current);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) persistState(state);
  }, [hydrated, state]);

  const dispatch = useCallback((action: RelayAction) => {
    setState((current) => relayReducer(current, action));
  }, []);
  const resetDemo = useCallback(() => dispatch({ type: "reset", at: Date.now() }), [dispatch]);
  const selection = useMemo(() => deriveSelection(state), [state]);
  const reservation = useMemo(() => calculateReservation(state), [state]);
  const availableHosts = useMemo(() => eligibleHosts(state), [state]);

  return { state, dispatch, selection, reservation, eligibleHosts: availableHosts, resetDemo };
}
