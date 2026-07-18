"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useKapitBiz, type RelayStep } from "@/lib/kapitbiz";
import { AppHeader, IncidentRail, ProgressHeader } from "./AppChrome";
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

const stepLabels: Record<RelayStep, string> = {
  incident: "Incident",
  triage: "Triage",
  capacity: "Capacity",
  reservation: "Reservation",
  handoff: "Handoff",
  complete: "Complete",
};

function previousStep(step: RelayStep): RelayStep {
  return stepOrder[Math.max(0, stepOrder.indexOf(step) - 1)];
}

type RelayController = ReturnType<typeof useKapitBiz>;

export function KapitBizRelayWorkspace({
  relay,
  showHomeLink = false,
  onClose,
}: {
  relay: RelayController;
  showHomeLink?: boolean;
  onClose?: () => void;
}) {
  const workspaceRef = useRef<HTMLElement>(null);
  const previousStepRef = useRef(relay.state.step);
  const isFocusedTransaction = relay.state.step === "reservation" || relay.state.step === "handoff";

  useEffect(() => {
    if (!relay.hydrated) return;
    if (previousStepRef.current === relay.state.step) return;
    previousStepRef.current = relay.state.step;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    workspaceRef.current?.focus({ preventScroll: true });
  }, [relay.hydrated, relay.state.step]);

  const goBack = () =>
    relay.dispatch({ type: "go-to", step: previousStep(relay.state.step) });

  if (!relay.hydrated) {
    return (
      <main className={styles.restoreShell}>
        <p role="status">Restoring rescue transaction...</p>
      </main>
    );
  }

  return (
    <main className={styles.appShell}>
      <IncidentRail state={relay.state} selection={relay.selection} />
      <section
        ref={workspaceRef}
        className={styles.workspace}
        aria-label={`${stepLabels[relay.state.step]} rescue step`}
        tabIndex={-1}
      >
        <AppHeader step={relay.state.step} onBack={goBack} onClose={onClose} />
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
      {showHomeLink && !isFocusedTransaction ? (
        <nav className={styles.bottomNav} aria-label="Primary navigation">
          <Link className={styles.navItem} href="/" aria-current="page">Home</Link>
        </nav>
      ) : null}
    </main>
  );
}

export default function KapitBizRelayApp() {
  const relay = useKapitBiz();
  return <KapitBizRelayWorkspace relay={relay} showHomeLink />;
}
