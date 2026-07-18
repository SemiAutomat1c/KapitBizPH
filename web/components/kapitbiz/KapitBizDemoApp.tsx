"use client";

import { useKapitBizDemoSession } from "@/lib/kapitbiz-demo";
import { useKapitBiz } from "@/lib/kapitbiz";
import { KapitBizRelayApp } from "./KapitBizRelayApp";
import ActivityScreen from "./ActivityScreen";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";
import MerchantShell from "./MerchantShell";
import NetworkScreen from "./NetworkScreen";
import OnboardingFlow from "./OnboardingFlow";
import RequestsScreen from "./RequestsScreen";
import RolePreviewScreen from "./RolePreviewScreen";
import styles from "./KapitBizRelay.module.css";

export default function KapitBizDemoApp() {
  const { session, hydrated, dispatch, resetSession } = useKapitBizDemoSession();
  const relay = useKapitBiz();

  if (!hydrated || !relay.hydrated) {
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
  };
  const selectTab = (tab: "home" | "requests" | "network" | "activity") => {
    dispatch({ type: "select-tab", tab });
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
    </MerchantShell>
  );
}
