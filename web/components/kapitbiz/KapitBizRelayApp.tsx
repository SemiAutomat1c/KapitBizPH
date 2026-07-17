"use client";

import { useEffect } from "react";
import { useKapitBiz, type RelayStep } from "@/lib/kapitbiz";
import { AppHeader, BottomNav, IncidentRail, ProgressHeader } from "./AppChrome";
import ActiveDisruptionScreen from "./ActiveDisruptionScreen";
import CapacityMatchScreen from "./CapacityMatchScreen";
import InventoryTriageScreen from "./InventoryTriageScreen";
import ReservationScreen from "./ReservationScreen";
import HandoffScreen from "./HandoffScreen";
import RescueCompleteScreen from "./RescueCompleteScreen";
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
  const isFocusedTransaction = relay.state.step === "reservation" || relay.state.step === "handoff";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [relay.state.step]);

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
        ) : relay.state.step === "capacity" ? (
          <CapacityMatchScreen
            state={relay.state}
            selection={relay.selection}
            eligibleHosts={relay.eligibleHosts}
            onSelectHost={(hostId) => {
              relay.dispatch({ type: "select-host", hostId });
              relay.dispatch({ type: "go-to", step: "reservation" });
            }}
          />
        ) : relay.state.step === "reservation" ? (
          <ReservationScreen
            state={relay.state}
            selection={relay.selection}
            dispatch={relay.dispatch}
          />
        ) : relay.state.step === "handoff" ? (
          <HandoffScreen
            state={relay.state}
            selection={relay.selection}
            dispatch={relay.dispatch}
          />
        ) : relay.state.step === "complete" ? (
          <RescueCompleteScreen
            state={relay.state}
            selection={relay.selection}
            dispatch={relay.dispatch}
          />
        ) : (
          <section className={styles.placeholder} aria-labelledby="next-step-heading">
            <p className={styles.eyebrow}>Rescue workflow</p>
            <h2 id="next-step-heading">Next rescue step</h2>
            <p>Continue the active rescue transaction.</p>
          </section>
        )}
      </section>
      {!isFocusedTransaction ? <BottomNav /> : null}
    </main>
  );
}
