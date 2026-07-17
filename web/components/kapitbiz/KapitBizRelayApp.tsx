"use client";

import { useKapitBiz, type RelayStep } from "@/lib/kapitbiz";
import { AppHeader, BottomNav, IncidentRail, ProgressHeader } from "./AppChrome";
import ActiveDisruptionScreen from "./ActiveDisruptionScreen";
import InventoryTriageScreen from "./InventoryTriageScreen";
import styles from "./KapitBizRelay.module.css";

const stepOrder: RelayStep[] = [
  "incident",
  "triage",
  "capacity",
  "reservation",
  "handoff",
  "complete",
];

function previousStep(step: RelayStep): RelayStep {
  return stepOrder[Math.max(0, stepOrder.indexOf(step) - 1)];
}

export default function KapitBizRelayApp() {
  const relay = useKapitBiz();
  const goBack = () =>
    relay.dispatch({ type: "go-to", step: previousStep(relay.state.step) });

  return (
    <main className={styles.appShell}>
      <IncidentRail state={relay.state} selection={relay.selection} />
      <section className={styles.workspace}>
        <AppHeader step={relay.state.step} onBack={goBack} />
        <ProgressHeader step={relay.state.step} />
        {relay.state.step === "incident" ? (
          <ActiveDisruptionScreen state={relay.state} onStart={() => relay.dispatch({ type: "start-rescue" })} />
        ) : relay.state.step === "triage" ? (
          <InventoryTriageScreen
            state={relay.state}
            selection={relay.selection}
            dispatch={relay.dispatch}
          />
        ) : (
          <section className={styles.placeholder} aria-labelledby="next-step-heading">
            <p className={styles.eyebrow}>Rescue workflow</p>
            <h2 id="next-step-heading">Capacity matching</h2>
            <p>Your selected inventory is ready for capacity matching.</p>
          </section>
        )}
      </section>
      <BottomNav />
    </main>
  );
}
