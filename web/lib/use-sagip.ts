"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  SAGIP_STORAGE_KEY,
  createSagipState,
  parseSagipState,
  sagipReducer,
  type KapitBizSagipState,
  type SagipAction,
} from "@/lib/kapitbiz-sagip";

type HydrateAction = { type: "hydrate"; state: KapitBizSagipState };

function reducer(state: KapitBizSagipState, action: SagipAction | HydrateAction): KapitBizSagipState {
  return action.type === "hydrate" ? action.state : sagipReducer(state, action);
}

function loadSagip(): KapitBizSagipState {
  if (typeof window === "undefined") return createSagipState();
  try {
    const serialized = window.localStorage.getItem(SAGIP_STORAGE_KEY);
    return serialized ? parseSagipState(JSON.parse(serialized) as unknown) : createSagipState();
  } catch {
    return createSagipState();
  }
}

function persistSagip(state: KapitBizSagipState): void {
  try {
    window.localStorage.setItem(SAGIP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be unavailable in constrained or private webviews.
  }
}

export function useSagip() {
  const [state, dispatchInternal] = useReducer(reducer, undefined, createSagipState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatchInternal({ type: "hydrate", state: loadSagip() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistSagip(state);
  }, [hydrated, state]);

  const dispatch = useCallback((action: SagipAction) => dispatchInternal(action), []);
  const resetSagip = useCallback(() => {
    const next = createSagipState();
    dispatchInternal({ type: "hydrate", state: next });
    persistSagip(next);
  }, []);

  return { state, hydrated, dispatch, resetSagip };
}
