"use client";
import { useCallback, useEffect, useState } from "react";

// ponytail: same localStorage-first pattern as lib/store.ts — offline-safe for
// venue wifi, zero setup. Separate store because the Relay rescue flow (stock
// item -> host reservation -> confirmed handoff) doesn't fit the generic
// single-form Entry model the other areas use.

export type Urgency = "hi" | "md" | "lo";
export type HostIcon = "freezer" | "bolt" | "box" | "truck";

export interface StockItem {
  id: string;
  name: string;
  reason: string;
  value: number;
  urgency: Urgency;
  hoursPerRescue: number;
}

export interface Host {
  id: string;
  name: string;
  icon: HostIcon;
  meta: string;
  why: string;
  vettedSince: string;
}

export interface HandoffRecord {
  id: string;
  itemId: string;
  itemName: string;
  hostId: string;
  hostName: string;
  value: number;
  hours: number;
  timestamp: number;
}

export const STOCK: StockItem[] = [
  { id: "fish", name: "Frozen fish & meat", reason: "chest freezer · spoils in ~2 hrs", value: 9200, urgency: "hi", hoursPerRescue: 2 },
  { id: "dairy", name: "Dairy & softdrinks", reason: "ref · spoils in ~4 hrs", value: 4600, urgency: "md", hoursPerRescue: 1.5 },
  { id: "ulam", name: "Cooked ulam for tomorrow", reason: "needs cold hold", value: 3200, urgency: "hi", hoursPerRescue: 1.5 },
  { id: "rice", name: "Rice & dry goods", reason: "flood-risk if water rises", value: 4800, urgency: "lo", hoursPerRescue: 1 },
];

export const HOSTS: Host[] = [
  { id: "rosa", name: "Aling Rosa's Store", icon: "freezer", meta: "Chest freezer, 2 slots · 400 m", why: "On a different feeder — still has power", vettedSince: "Jan 2026" },
  { id: "chamber", name: "Tagum Chamber cold room", icon: "bolt", meta: "Generator-backed · 1.2 km", why: "Genset online, vetted host", vettedSince: "Feb 2026" },
  { id: "ben", name: "Kuya Ben's bodega", icon: "box", meta: "Dry storage, elevated · 300 m", why: "Above flood line, 2nd floor", vettedSince: "Jan 2026" },
  { id: "padala", name: "Padala courier (habal)", icon: "truck", meta: "Can move now · ~15 min", why: "Route still passable", vettedSince: "Mar 2026" },
];

const KEY = "kapitbiz-relay-v1";

interface StoredState {
  rescuedItemIds: string[];
  history: HandoffRecord[];
}

function load(): StoredState {
  if (typeof window === "undefined") return { rescuedItemIds: [], history: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {
    /* ignore corrupt cache */
  }
  return { rescuedItemIds: [], history: [] };
}

function persist(state: StoredState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function useKapitBiz() {
  const [state, setState] = useState<StoredState>({ rescuedItemIds: [], history: [] });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setState(load()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const confirmHandoff = useCallback((itemId: string, hostId: string) => {
    const item = STOCK.find((s) => s.id === itemId);
    const host = HOSTS.find((h) => h.id === hostId);
    if (!item || !host) return;
    const record: HandoffRecord = {
      id: `h-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      hostId: host.id,
      hostName: host.name,
      value: item.value,
      hours: item.hoursPerRescue,
      timestamp: Date.now(),
    };
    const next: StoredState = {
      rescuedItemIds: [...state.rescuedItemIds, item.id],
      history: [record, ...state.history],
    };
    persist(next);
    setState(next);
  }, [state]);

  const resetDemo = useCallback(() => {
    const next: StoredState = { rescuedItemIds: [], history: [] };
    persist(next);
    setState(next);
  }, []);

  const items = STOCK.map((s) => ({
    ...s,
    status: state.rescuedItemIds.includes(s.id) ? ("rescued" as const) : ("at-risk" as const),
  }));

  const protectedValue = items
    .filter((i) => i.status === "rescued")
    .reduce((sum, i) => sum + i.value, 0);
  const hoursPreserved = items
    .filter((i) => i.status === "rescued")
    .reduce((sum, i) => sum + i.hoursPerRescue, 0);
  const atRiskValue = items
    .filter((i) => i.status === "at-risk")
    .reduce((sum, i) => sum + i.value, 0);

  return {
    items,
    hosts: HOSTS,
    history: state.history,
    protectedValue,
    hoursPreserved,
    atRiskValue,
    confirmHandoff,
    resetDemo,
  };
}
