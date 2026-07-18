"use client";

import { useKapitBizDemoSession, type DemoRole } from "@/lib/kapitbiz-demo";
import { useKapitBiz } from "@/lib/kapitbiz";
import { KapitBizRelayWorkspace } from "./KapitBizRelayApp";
import ActivityScreen from "./ActivityScreen";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";
import MerchantShell from "./MerchantShell";
import NetworkScreen from "./NetworkScreen";
import OnboardingFlow from "./OnboardingFlow";
import RequestsScreen from "./RequestsScreen";
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
    return <RolePreparationScreen role={session.role} onReturn={() => dispatch({ type: "select-role", role: "merchant" })} />;
  }

  if (session.rescueOpen) {
    return <KapitBizRelayWorkspace relay={relay} onClose={() => dispatch({ type: "close-rescue" })} />;
  }

  const resetDemo = () => {
    relay.resetDemo();
    resetSession();
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

function RolePreparationScreen({
  role,
  onReturn,
}: {
  role: Exclude<DemoRole, "merchant">;
  onReturn: () => void;
}) {
  const roleLabel = role === "host" ? "Host" : "Rider";

  return (
    <main className={styles.onboardingShell} aria-labelledby="role-preparation-heading">
      <section className={styles.onboardingContent}>
        <p className={styles.onboardingEyebrow}>Demo role</p>
        <h1 id="role-preparation-heading">{roleLabel} preparation</h1>
        <p className={styles.onboardingCopy} role="status">
          {roleLabel} role selected for this demo.
        </p>
        <button className={styles.primaryButton} type="button" onClick={onReturn}>
          Return to Merchant
        </button>
      </section>
    </main>
  );
}
