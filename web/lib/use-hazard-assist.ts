"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  HAZARD_ASSIST_STORAGE_KEY,
  createHazardAssistState,
  hazardAssistReducer,
  parseHazardAssistState,
  type HazardAssistAction,
  type KapitBizHazardAssistState,
} from "@/lib/kapitbiz-hazard-assist";

type HydrateAction = { type: "hydrate"; state: KapitBizHazardAssistState };

function reducer(
  state: KapitBizHazardAssistState,
  action: HazardAssistAction | HydrateAction,
): KapitBizHazardAssistState {
  return action.type === "hydrate" ? action.state : hazardAssistReducer(state, action);
}

function loadHazardAssist(): KapitBizHazardAssistState {
  if (typeof window === "undefined") return createHazardAssistState();
  try {
    const serialized = window.localStorage.getItem(HAZARD_ASSIST_STORAGE_KEY);
    return serialized ? parseHazardAssistState(JSON.parse(serialized) as unknown) : createHazardAssistState();
  } catch {
    return createHazardAssistState();
  }
}

function persistHazardAssist(state: KapitBizHazardAssistState): void {
  try {
    window.localStorage.setItem(HAZARD_ASSIST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be unavailable in constrained or private webviews.
  }
}

export function useHazardAssist() {
  const [state, dispatchInternal] = useReducer(reducer, undefined, createHazardAssistState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatchInternal({ type: "hydrate", state: loadHazardAssist() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistHazardAssist(state);
  }, [hydrated, state]);

  const dispatch = useCallback((action: HazardAssistAction) => dispatchInternal(action), []);
  const resetHazardAssist = useCallback(() => {
    const next = createHazardAssistState();
    dispatchInternal({ type: "hydrate", state: next });
    persistHazardAssist(next);
  }, []);

  return { state, hydrated, dispatch, resetHazardAssist };
}
