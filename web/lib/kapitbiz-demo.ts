"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

export const DEMO_SESSION_STORAGE_KEY = "kapitbiz-demo-session-v1";
export type DemoRole = "merchant" | "host" | "rider";
export type MerchantTab = "home" | "network" | "sagip" | "activity" | "menu" | "bayanihan";
export type OnboardingStep = "protect" | "relay" | "verify" | "business";

export interface KapitBizDemoSession {
  version: 1;
  onboardingStep: OnboardingStep;
  onboardingComplete: boolean;
  businessSetupComplete: boolean;
  role: DemoRole;
  activeTab: MerchantTab;
  rescueOpen: boolean;
  riderArrivedAt: number | null;
  businessName: string;
}

export type DemoSessionAction =
  | { type: "set-onboarding-step"; step: OnboardingStep }
  | { type: "select-role"; role: DemoRole }
  | { type: "complete-onboarding"; businessName?: string }
  | { type: "select-tab"; tab: MerchantTab }
  | { type: "open-rescue" }
  | { type: "close-rescue" }
  | { type: "mark-rider-arrived"; at: number }
  | { type: "reset" };

export function createDemoSession(): KapitBizDemoSession {
  return {
    version: 1,
    onboardingStep: "protect",
    onboardingComplete: false,
    businessSetupComplete: false,
    role: "merchant",
    activeTab: "home",
    rescueOpen: false,
    riderArrivedAt: null,
    businessName: "Maya's Frozen Goods",
  };
}

export function demoSessionReducer(
  state: KapitBizDemoSession,
  action: DemoSessionAction,
): KapitBizDemoSession {
  switch (action.type) {
    case "set-onboarding-step": return { ...state, onboardingStep: action.step };
    case "select-role": return { ...state, role: action.role };
    case "complete-onboarding": return {
      ...state,
      onboardingComplete: true,
      businessSetupComplete: state.role === "merchant",
      activeTab: "home",
      businessName: action.businessName ?? state.businessName,
    };
    case "select-tab": return { ...state, activeTab: action.tab, rescueOpen: false };
    case "open-rescue": return { ...state, rescueOpen: true, role: "merchant" };
    case "close-rescue": return { ...state, rescueOpen: false };
    case "mark-rider-arrived": return state.riderArrivedAt === null ? { ...state, riderArrivedAt: action.at } : state;
    case "reset": return createDemoSession();
  }
}

type HydrateAction = { type: "hydrate"; session: KapitBizDemoSession };

function reduceDemoSession(
  state: KapitBizDemoSession,
  action: DemoSessionAction | HydrateAction,
): KapitBizDemoSession {
  return action.type === "hydrate" ? action.session : demoSessionReducer(state, action);
}

export function useKapitBizDemoSession() {
  const [session, dispatchInternal] = useReducer(reduceDemoSession, undefined, createDemoSession);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Restore once before allowing reducer updates to persist.
    dispatchInternal({ type: "hydrate", session: loadDemoSession() ?? createDemoSession() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persistDemoSession(session);
  }, [hydrated, session]);

  const dispatch = useCallback((action: DemoSessionAction) => {
    dispatchInternal(action);
  }, []);
  const resetSession = useCallback(() => dispatch({ type: "reset" }), [dispatch]);

  return { session, hydrated, dispatch, resetSession };
}

function loadDemoSession(): KapitBizDemoSession | null {
  if (typeof window === "undefined") return null;

  try {
    const serialized = window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    if (isKapitBizDemoSession(parsed)) {
      return {
        ...parsed,
        businessName: parsed.businessName ?? "Maya's Frozen Goods",
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persistDemoSession(session: KapitBizDemoSession): void {
  try {
    window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in private browsing or constrained webviews.
  }
}

function isKapitBizDemoSession(value: unknown): value is KapitBizDemoSession {
  return isRecord(value)
    && value.version === 1
    && isOnboardingStep(value.onboardingStep)
    && typeof value.onboardingComplete === "boolean"
    && typeof value.businessSetupComplete === "boolean"
    && isDemoRole(value.role)
    && isMerchantTab(value.activeTab)
    && typeof value.rescueOpen === "boolean"
    && isNullableFiniteNumber(value.riderArrivedAt)
    && (typeof value.businessName === "string" || value.businessName === undefined);
}

function isDemoRole(value: unknown): value is DemoRole {
  return value === "merchant" || value === "host" || value === "rider";
}

function isMerchantTab(value: unknown): value is MerchantTab {
  return value === "home" || value === "network" || value === "sagip" || value === "activity" || value === "menu" || value === "bayanihan";
}

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return value === "protect" || value === "relay" || value === "verify" || value === "business";
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
