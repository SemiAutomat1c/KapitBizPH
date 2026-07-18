"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, MapPin, PackageCheck, Truck, Warehouse } from "lucide-react";
import type { RelayDemoState, RelaySelection } from "@/lib/kapitbiz";
import type { DemoRole, KapitBizDemoSession } from "@/lib/kapitbiz-demo";
import styles from "./KapitBizRelay.module.css";

type PreviewRole = Exclude<DemoRole, "merchant">;

function formatEta(arrivalMinutes: number | undefined): string {
  return arrivalMinutes === undefined ? "Unavailable" : `${arrivalMinutes} min`;
}

export default function RolePreviewScreen({
  role,
  state,
  selection,
  session,
  onMarkRiderArrived,
  onConfirmReceived,
  onReturn,
}: {
  role: PreviewRole;
  state: RelayDemoState;
  selection: RelaySelection;
  session: KapitBizDemoSession;
  onMarkRiderArrived: () => void;
  onConfirmReceived: () => boolean;
  onReturn: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const allowPreselectionFallback = state.reservationConfirmedAt === null;
  const host = state.hosts.find((candidate) => candidate.id === state.selectedHostId)
    ?? (allowPreselectionFallback ? state.hosts.find((candidate) => candidate.id === "northline") : undefined);
  const transport = state.transportOptions.find((candidate) => candidate.id === state.selectedTransportId)
    ?? (allowPreselectionFallback ? state.transportOptions.find((candidate) => candidate.id === "rider") : undefined);
  const isRider = role === "rider";
  const transportLabel = transport?.id === "rider" ? "Rider" : "Transport";
  const transportDisplay = transport?.id === "rider" ? "KB-4922" : transport?.name ?? "Not assigned";

  const markArrived = () => {
    onMarkRiderArrived();
    setStatus(session.riderArrivedAt === null ? "Arrival recorded" : "Arrival already recorded");
  };
  const confirmReceived = () => {
    setStatus(onConfirmReceived() ? "Custody transfer confirmed" : "Waiting for QR handoff");
  };

  return (
    <main className={styles.rolePreviewShell} aria-labelledby="role-preview-heading">
      <section className={styles.rolePreviewContent}>
        <header className={styles.rolePreviewHeader}>
          <span className={styles.rolePreviewIcon}>{isRider ? <Truck aria-hidden="true" /> : <Warehouse aria-hidden="true" />}</span>
          <div>
            <p className={styles.onboardingEyebrow}>{isRider ? "Rider dispatch" : "Storage handoff"}</p>
            <h1 id="role-preview-heading">{isRider ? "Rider preview" : "Storage Host preview"}</h1>
          </div>
        </header>

        {isRider ? (
          <>
            <section className={styles.rolePreviewRoute} aria-label="Rider route">
              <div><MapPin aria-hidden="true" /><span>Pickup</span><strong>Maya&apos;s Frozen Goods</strong></div>
              <div><Warehouse aria-hidden="true" /><span>Destination</span><strong>{host?.name ?? "Not assigned"}</strong></div>
            </section>
            <dl className={styles.rolePreviewMetrics}>
              <div><dt>Payload</dt><dd>{selection.selectedWeightKg} kg / PHP{selection.selectedValue.toLocaleString("en-PH")}</dd></div>
              <div><dt>Delivery fee</dt><dd>{transport ? `PHP${transport.fee.toLocaleString("en-PH")} fee` : "Unavailable"}</dd></div>
              <div><dt>{transport?.id === "rider" ? "Vehicle" : "Transport"}</dt><dd>{transportDisplay}</dd></div>
              <div><dt>{transportLabel} ETA</dt><dd>{formatEta(transport?.arrivalMinutes)} to pickup</dd></div>
            </dl>
            <button className={styles.primaryButton} type="button" onClick={markArrived}>
              <PackageCheck aria-hidden="true" /> Mark arrived
            </button>
          </>
        ) : (
          <>
            <section className={styles.rolePreviewRoute} aria-label="Storage reservation">
              <div><Warehouse aria-hidden="true" /><span>Reserved storage</span><strong>{host?.name ?? "Not assigned"}</strong></div>
              <div><Clock3 aria-hidden="true" /><span>{transportLabel} ETA</span><strong>{formatEta(transport?.arrivalMinutes)} to pickup</strong></div>
            </section>
            <dl className={styles.rolePreviewMetrics}>
              <div><dt>Reserved payload</dt><dd>{selection.selectedWeightKg} kg</dd></div>
              <div><dt>Storage window</dt><dd>{host ? `${host.windowHours} hours` : "Unavailable"}</dd></div>
              <div><dt>Storage fee</dt><dd>{host ? `PHP${host.fee.toLocaleString("en-PH")}` : "Unavailable"}</dd></div>
              <div><dt>Handoff record</dt><dd>{state.handoffId ?? "RE-4892-X"}</dd></div>
            </dl>
            <button className={styles.primaryButton} type="button" onClick={confirmReceived}>
              <CheckCircle2 aria-hidden="true" /> Confirm inventory received
            </button>
          </>
        )}

        {status ? <p className={styles.rolePreviewStatus} role="status" aria-live="polite">{status}</p> : null}
        <button className={styles.secondaryAction} type="button" onClick={onReturn}>Return to Merchant</button>
      </section>
    </main>
  );
}
