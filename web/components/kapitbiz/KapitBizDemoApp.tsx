"use client";

import { useState, useReducer, useEffect } from "react";
import { useKapitBizDemoSession, type MerchantTab } from "@/lib/kapitbiz-demo";
import { createInitialBayanihanState, bayanihanReducer } from "@/lib/kapitbiz-bayanihan";
import type { BayanihanState, BayanihanAction } from "@/lib/kapitbiz-bayanihan";
import BayanihanScreen from "./BayanihanScreen";
import { useKapitBiz } from "@/lib/kapitbiz";
import { useHazardAssist } from "@/lib/use-hazard-assist";
import { useSagip } from "@/lib/use-sagip";
import { buildHazardRelayContext, type SafetyCheckAnswer } from "@/lib/kapitbiz-hazard-assist";
import { KapitBizRelayApp } from "./KapitBizRelayApp";
import ActivityScreen from "./ActivityScreen";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";
import MerchantShell from "./MerchantShell";
import NetworkScreen from "./NetworkScreen";
import OnboardingFlow from "./OnboardingFlow";
import RequestsScreen from "./RequestsScreen";
import RolePreviewScreen from "./RolePreviewScreen";
import SagipCenterScreen from "./SagipCenterScreen";
import HazardAssistDialog from "./HazardAssistDialog";
import SafetyCheckDecisionPanel from "./SafetyCheckDecisionPanel";
import GoodSamaritanPanel from "./GoodSamaritanPanel";
import RecoveryPacketPreview from "./RecoveryPacketPreview";
import styles from "./KapitBizRelay.module.css";

// "decision" used to be its own surface (a second dialog after Safety
// Check). Merged into "safety-check" — the recommendation now renders
// inline in SafetyCheckDecisionPanel once the answer is "stock-at-risk".
type HazardAssistSurface = "closed" | "safety-check" | "good-samaritan";

export default function KapitBizDemoApp() {
  const { session, hydrated, dispatch, resetSession } = useKapitBizDemoSession();
  const relay = useKapitBiz();
  const hazardAssist = useHazardAssist();
  const sagip = useSagip();
  const [hazardSurface, setHazardSurface] = useState<HazardAssistSurface>("closed");

  const [bayanihanState, dispatchBayanihan] = useReducer(
    (state: BayanihanState, action: BayanihanAction | { type: "hydrate"; state: BayanihanState }) => {
      if (action.type === "hydrate") return action.state;
      return bayanihanReducer(state, action);
    },
    undefined,
    createInitialBayanihanState
  );
  const [bayanihanHydrated, setBayanihanHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const serialized = window.localStorage.getItem("kapitbiz-bayanihan-v1");
        if (serialized) {
          dispatchBayanihan({ type: "hydrate", state: JSON.parse(serialized) });
        }
      } catch (e) {
        // ignore
      }
    }
    setBayanihanHydrated(true);
  }, []);

  useEffect(() => {
    if (bayanihanHydrated) {
      try {
        window.localStorage.setItem("kapitbiz-bayanihan-v1", JSON.stringify(bayanihanState));
      } catch (e) {
        // ignore
      }
    }
  }, [bayanihanHydrated, bayanihanState]);

  if (!hydrated || !relay.hydrated || !hazardAssist.hydrated || !sagip.hydrated || !bayanihanHydrated) {
    return (
      <main className={styles.restoreShell}>
        <p role="status">Restoring KapitBiz Relay...</p>
      </main>
    );
  }

  if (!session.onboardingComplete) {
    return <OnboardingFlow session={session} dispatch={dispatch} />;
  }

  const openRecoveryPacket = () => {
    hazardAssist.dispatch({ type: "set-recovery-packet-preview", open: true });
  };
  const closeRecoveryPacket = () => {
    hazardAssist.dispatch({ type: "set-recovery-packet-preview", open: false });
  };

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
      <>
        <KapitBizRelayApp
          relay={relay}
          onClose={() => dispatch({ type: "close-rescue" })}
          onNavigate={(tab) => dispatch({ type: "select-tab", tab })}
          onOpenMenu={() => dispatch({ type: "select-tab", tab: "menu" })}
          onOpenRecoveryPacket={openRecoveryPacket}
          hazardContext={buildHazardRelayContext(hazardAssist.state)}
          activeTab={session.activeTab}
        />
        {hazardAssist.state.recoveryPacketPreviewOpen && relay.state.receiverConfirmedAt !== null ? (
          <HazardAssistDialog label="Recovery packet preview" focusKey="recovery-packet" onClose={closeRecoveryPacket}>
            <RecoveryPacketPreview
              state={relay.state}
              selection={relay.selection}
              hazardState={hazardAssist.state}
              onClose={closeRecoveryPacket}
            />
          </HazardAssistDialog>
        ) : null}
      </>
    );
  }

  const resetDemo = () => {
    setHazardSurface("closed");
    resetSession();
    relay.resetRescue();
    hazardAssist.resetHazardAssist();
    sagip.resetSagip();
    dispatchBayanihan({ type: "hydrate", state: createInitialBayanihanState() });
  };
  const selectTab = (tab: Exclude<MerchantTab, "menu">) => {
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
    if (answer === "stock-at-risk") setHazardSurface("safety-check");
  };
  const openGoodSamaritan = () => {
    hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
    setHazardSurface("good-samaritan");
  };
  const startRelayFromNetwork = (hostId: string) => {
    relay.dispatch({ type: "start-rescue" });
    relay.dispatch({ type: "go-to", step: "capacity" });
    relay.dispatch({ type: "select-host", hostId });
    relay.dispatch({ type: "go-to", step: "reservation" });
    dispatch({ type: "open-rescue" });
  };
  const startRelayFromHazardAssist = (partnerId?: string) => {
    if (partnerId) {
      hazardAssist.dispatch({ type: "select-good-samaritan", partnerId });
    }
    hazardAssist.dispatch({ type: "start-relay" });
    relay.dispatch({ type: "start-rescue" });

    if (partnerId === "northline" || partnerId === "tagum-north") {
      relay.dispatch({ type: "go-to", step: "capacity" });
      relay.dispatch({ type: "select-host", hostId: partnerId });
      relay.dispatch({ type: "go-to", step: "reservation" });
    }

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
          onOpenGoodSamaritan={openGoodSamaritan}
          onOpenRecoveryPacket={openRecoveryPacket}
        />
      ) : session.activeTab === "requests" ? (
        <RequestsScreen
          state={relay.state}
          startedFromHazardAssist={hazardAssist.state.relayStartedFromHazardAssist}
          onOpenRescue={() => dispatch({ type: "open-rescue" })}
        />
      ) : session.activeTab === "activity" ? (
        <ActivityScreen
          state={relay.state}
          session={session}
          hazardState={hazardAssist.state}
          onOpenRecord={() => dispatch({ type: "open-rescue" })}
          onOpenRecoveryPacket={openRecoveryPacket}
        />
      ) : session.activeTab === "menu" ? (
        <MenuScreen
          onPreviewRole={(role) => dispatch({ type: "select-role", role })}
          onResetDemo={resetDemo}
        />
      ) : session.activeTab === "sagip" ? (
        <SagipCenterScreen state={sagip.state} dispatch={sagip.dispatch} />
      ) : session.activeTab === "Bayanihan" ? (
        <BayanihanScreen state={bayanihanState} dispatch={dispatchBayanihan} businessName={session.businessName} />
      ) : session.activeTab === "network" ? (
        <NetworkScreen
          state={relay.state}
          onStartRequest={startRelayFromNetwork}
          onOpenGoodSamaritan={openGoodSamaritan}
        />
      ) : (
        null
      )}
      {hazardAssist.state.recoveryPacketPreviewOpen && relay.state.receiverConfirmedAt !== null ? (
        <HazardAssistDialog label="Recovery packet preview" focusKey="recovery-packet" onClose={closeRecoveryPacket}>
          <RecoveryPacketPreview
            state={relay.state}
            selection={relay.selection}
            hazardState={hazardAssist.state}
            onClose={closeRecoveryPacket}
          />
        </HazardAssistDialog>
      ) : hazardSurface !== "closed" ? (
        <HazardAssistDialog
          label={hazardSurface === "safety-check" ? "Safety Check" : "Good Samaritan capacity"}
          focusKey={hazardSurface}
          onClose={() => setHazardSurface("closed")}
        >
          {hazardSurface === "safety-check" ? (
            <SafetyCheckDecisionPanel
              state={hazardAssist.state}
              onAnswer={answerSafetyCheck}
              onStartRelay={startRelayFromHazardAssist}
              onAskNearbyHosts={() => {
                hazardAssist.dispatch({ type: "ask-good-samaritans", at: Date.now() });
                setHazardSurface("good-samaritan");
              }}
              onClose={() => setHazardSurface("closed")}
              onSetCalamityPreview={(open) => hazardAssist.dispatch({ type: "set-calamity-mode-preview", open })}
            />
          ) : (
            <GoodSamaritanPanel
              selectedPartnerId={hazardAssist.state.selectedGoodSamaritanPartnerId}
              onUsePartner={startRelayFromHazardAssist}
              onClose={() => setHazardSurface("closed")}
            />
          )}
        </HazardAssistDialog>
      ) : null}
    </MerchantShell>
  );
}
