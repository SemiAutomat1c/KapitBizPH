"use client";
import { useCallback, useEffect, useState } from "react";
import { AREAS, areaById, seed, type Entry, type Vals } from "./core";

// ponytail: localStorage store is the working default so the app runs and demos
// offline with zero setup (venue wifi is unreliable). Convex backend files live in
// /convex — after `npx convex dev`, swap this hook for the Convex version per web/README.md.

// v2: KiloKita waste seeds (invalidates old Palengke Loop cache)
const KEY = "hc2026-entries-v2";

function load(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Entry[];
  } catch {
    /* ignore corrupt cache */
  }
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

function persist(all: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function useEntries(areaId: string) {
  const [all, setAll] = useState<Entry[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAll(load()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const commit = useCallback((next: Entry[]) => {
    persist(next);
    setAll(next);
  }, []);

  const addEntry = useCallback((values: Vals) => {
    const area = areaById(areaId);
    const entry: Entry = {
      id: `e-${Date.now()}`,
      areaId,
      values,
      status: area.statuses[0],
      impact: area.impact(values),
      createdAt: Date.now(),
    };
    commit([entry, ...load()]);
    return entry;
  }, [areaId, commit]);

  const setStatus = useCallback((id: string, status: string) => {
    commit(load().map((e) => (e.id === id ? { ...e, status } : e)));
  }, [commit]);

  const resetDemo = useCallback(() => commit(seed()), [commit]);

  const entries = all
    .filter((e) => e.areaId === areaId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const totalImpact = entries.reduce((s, e) => s + e.impact, 0);
  const area = areaById(areaId);
  const totalSecondary = area.secondaryImpact
    ? entries.reduce((s, e) => s + (area.secondaryImpact?.(e.values) ?? 0), 0)
    : 0;

  return { entries, totalImpact, totalSecondary, addEntry, setStatus, resetDemo };
}

export const AREA_LIST = AREAS;
