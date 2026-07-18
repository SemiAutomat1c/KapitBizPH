"use client";

import { useState } from "react";
import { useKapitBizDemoSession } from "@/lib/kapitbiz-demo";
import { useKapitBiz } from "@/lib/kapitbiz";
import { useHazardAssist } from "@/lib/use-hazard-assist";
import type { SafetyCheckAnswer } from "@/lib/kapitbiz-hazard-assist";
import { KapitBizRelayApp } from "./KapitBizRelayApp";
import ActivityScreen from "./ActivityScreen";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";
import MerchantShell from "./MerchantShell";
import NetworkScreen from "./NetworkScreen";
import OnboardingFlow from "./OnboardingFlow";
import RequestsScreen from "./RequestsScreen";
import RolePreviewScreen from "./RolePreviewScreen";
import HazardAssistDialog from "./HazardAssistDialog";
import SafetyCheckPanel from "./SafetyCheckPanel";
import ContinuityDecisionPanel from "./ContinuityDecisionPanel";
import styles from "./KapitBizRelay.module.css";

type HazardAssistSurface = "closed" | "safety-check" | "decision" | "good-samaritan";

export default function KapitBizDemoApp() {
  const { session, hydrated, dispatch, resetSession } = useKapitBizDemoSession();
  const relay = useKapitBiz();
  const hazardAssist = useHazardAssist();
  const [hazardSurface, setHazardSurface] = useState<HazardAssistSurface>("closed");

  if (!hydrated || !relay.hydrated || !hazardAssist.hydrated) {
    return (
      <main className={styles.restoreShell}>
        <p role="status">Restoring KapitBiz Relay...</p>
      </main>
    );
  }

  if (!session.onboardingComplete) {
    return <OnboardingFlow session={session} dispatch={dispatch} />;
  }

  if (session.role !== "merchant") {
    return (
      <RolePreviewScreen
        role={session.role}
        state={relay.state}
        selection={relay.selection}
        session={session}
        onMarkRiderArrived={() => dispatch({ type: "mark-rider-arrived", at: Date.now() })}
        onConfirmReceived={() => {
          if (relay.state.step !== "handoff") return false;
          relay.dispatch({ type: "confirm-receiver", at: Date.now() });
          return true;
        }}
        onReturn={() => dispatch({ type: "select-role", role: "merchant" })}
      />
    );
  }

  if (session.rescueOpen) {
    return (
      <KapitBizRelayApp
        relay={relay}
        onClose={() => dispatch({ type: "close-rescue" })}
        onNavigate={(tab) => dispatch({ type: "select-tab", tab })}
        onOpenMenu={() => dispatch({ type: "select-tab", tab: "menu" })}
      />
    );
  }

  const resetDemo = () => {
    resetSession();
    relay.resetRescue();
    hazardAssist.resetHazardAssist();
  };
  const selectTab = (tab: "home" | "requests" | "network" | "activity") => {
    dispatch({ type: "select-tab", tab });
  };
  const openSafetyCheck = () => {
    hazardAssist.dispatch({ type: "acknowledge-alert" });
    setHazardSurface("safety-check");
  };
  const answerSafetyCheck = (answer: Exclude<SafetyCheckAnswer, "unknown">) => {
    hazardAssist.dispatch({ type: "answer-safety-check", answer });
    if (answer === "safe") setHazardSurface("closed");
    if (answer === "need-help") {
      hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
      setHazardSurface("good-samaritan");
    }
    if (answer === "stock-at-risk") setHazardSurface("decision");
  };
  const startRelayFromHazardAssist = () => {
    hazardAssist.dispatch({ type: "start-relay" });
    relay.dispatch({ type: "start-rescue" });
    setHazardSurface("closed");
    dispatch({ type: "open-rescue" });
  };

  return (
    <MerchantShell
      activeTab={session.activeTab}
      onSelectTab={selectTab}
      onOpenMenu={() => dispatch({ type: "select-tab", tab: "menu" })}
    >
      {session.activeTab === "home" ? (
        <HomeScreen
          state={relay.state}
          selection={relay.selection}
          eligibleHostCount={relay.eligibleHosts.length}
          onOpenRescue={() => dispatch({ type: "open-rescue" })}
          hazardAssistState={hazardAssist.state}
          onRunSafetyCheck={openSafetyCheck}
        />
      ) : session.activeTab === "requests" ? (
        <RequestsScreen
          state={relay.state}
          onOpenRescue={() => dispatch({ type: "open-rescue" })}
        />
      ) : session.activeTab === "activity" ? (
        <ActivityScreen
          state={relay.state}
          session={session}
          onOpenRecord={() => dispatch({ type: "open-rescue" })}
        />
      ) : session.activeTab === "menu" ? (
        <MenuScreen
          onPreviewRole={(role) => dispatch({ type: "select-role", role })}
          onResetDemo={resetDemo}
        />
      ) : (
        <NetworkScreen state={relay.state} onStartRequest={() => dispatch({ type: "open-rescue" })} />
      )}
      {hazardSurface !== "closed" ? (
        <HazardAssistDialog
          label={hazardSurface === "safety-check" ? "Safety Check" : "Recommended continuity move"}
          focusKey={hazardSurface}
          onClose={() => setHazardSurface("closed")}
        >
          {hazardSurface === "safety-check" ? (
            <SafetyCheckPanel
              answer={hazardAssist.state.safetyCheckAnswer}
              onAnswer={answerSafetyCheck}
              onClose={() => setHazardSurface("closed")}
            />
          ) : (
            <ContinuityDecisionPanel
              state={hazardAssist.state}
              onStartRelay={startRelayFromHazardAssist}
              onAskNearbyHosts={() => {
                hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
                setHazardSurface("good-samaritan");
              }}
              onMarkSafe={() => answerSafetyCheck("safe")}
              onClose={() => setHazardSurface("closed")}
              onSetCalamityPreview={(open) => hazardAssist.dispatch({ type: "set-calamity-mode-preview", open })}
            />
          )}
        </HazardAssistDialog>
      ) : null}
    </MerchantShell>
  );
}
