"use client";

import { useState } from "react";
import { CheckCircle2, Clipboard, Clock3, Share2, ShieldCheck } from "lucide-react";
import {
  calculateReservation,
  expectedFacilityArrivalAt,
  type RelayDemoState,
  type RelaySelection,
} from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

const SHARE_TEXT = "KapitBiz Relay demo record RE-4892-X: PHP 16,500 of inventory, 42 kg, transferred from Maya's Frozen Goods to Northline Cold Storage. Simulated demo transaction.";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" }).format(new Date(timestamp));
}

function formatDeadline(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" }).format(new Date(timestamp + 12 * 60 * 60 * 1_000));
}

export default function RescueCompleteScreen({
  state,
  selection,
}: {
  state: RelayDemoState;
  selection: RelaySelection;
}) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const host = state.hosts.find((candidate) => candidate.id === state.selectedHostId);
  const transport = state.transportOptions.find((candidate) => candidate.id === state.selectedTransportId);
  const reservation = calculateReservation(state);
  const arrivedAt = expectedFacilityArrivalAt(state) ?? state.reservationConfirmedAt ?? state.scenarioStartedAt;
  const confirmedAt = Math.max(state.receiverConfirmedAt ?? arrivedAt, arrivedAt);

  const shareRecord = async () => {
    const browserNavigator = window.navigator;
    if (browserNavigator.share) {
      try {
        await browserNavigator.share({ text: SHARE_TEXT });
        setShareStatus("Recovery record shared.");
        return;
      } catch {
        // A dismissed or unavailable share sheet falls through to clipboard.
      }
    }
    if (browserNavigator.clipboard?.writeText) {
      try {
        await browserNavigator.clipboard.writeText(SHARE_TEXT);
        setShareStatus("Recovery record copied to clipboard.");
        return;
      } catch {
        // The exact record remains visible below when clipboard access is denied.
      }
    }
    setShareStatus(`Could not share automatically. ${SHARE_TEXT}`);
  };

  if (!host) return null;

  return (
    <section className={styles.completeScreen} aria-labelledby="complete-heading">
      <header className={styles.completeHero}>
        <span><CheckCircle2 aria-hidden="true" /></span>
        <h2 id="complete-heading">₱{selection.selectedValue.toLocaleString("en-PH")} inventory protected</h2>
        <p>Relay operation successfully completed</p>
      </header>

      <section className={styles.completeSummary} aria-label="Completed rescue summary">
        <div className={styles.completeSummaryTop}>
          <div><span>Storage facility</span><strong>{host.name}</strong></div>
          <div><span>Payload</span><strong>{selection.selectedWeightKg} kg</strong></div>
        </div>
        <div className={styles.deadlineNotice}><Clock3 aria-hidden="true" /><p>Secured for <strong>{host.windowHours} hours</strong> (Pickup by {formatDeadline(confirmedAt)})</p></div>
        <div className={styles.completeStats}><span>₱{reservation.total.toLocaleString("en-PH")} rescue cost</span><span>{state.handoffId}</span></div>
      </section>

      <section className={styles.timelineSection} aria-labelledby="timeline-heading">
        <p className={styles.eyebrow}>Simulated custody timeline</p>
        <h3 id="timeline-heading">Audit timeline</h3>
        <ol className={styles.auditTimeline}>
          <li data-complete="true"><span aria-hidden="true" /><div><strong>Transfer confirmed</strong><p>Inventory handed to facility lead</p></div><time dateTime={new Date(confirmedAt).toISOString()}>{formatTime(confirmedAt)}</time></li>
          <li><span aria-hidden="true" /><div><strong>Arrival at facility</strong><p>{transport?.name ?? "Rescue transport"} reached {host.locality}</p></div><time dateTime={new Date(arrivedAt).toISOString()}>{formatTime(arrivedAt)}</time></li>
          <li><span aria-hidden="true" /><div><strong>Rescue initiated</strong><p>Source: Maya&apos;s Frozen Goods, Tagum City</p></div><time dateTime={new Date(state.scenarioStartedAt).toISOString()}>{formatTime(state.scenarioStartedAt)}</time></li>
        </ol>
      </section>

      <aside className={styles.verifiedRecord} aria-label="Custody verification"><ShieldCheck aria-hidden="true" /><strong>Chain of custody verified</strong><span>Handoff record {state.handoffId}</span></aside>

      <div className={styles.completeActions}>
        <button className={styles.primaryButton} type="button" onClick={shareRecord}><Share2 aria-hidden="true" /> Share recovery record</button>
        <button className={styles.secondaryAction} type="button" onClick={() => setShareStatus(SHARE_TEXT)}><Clipboard aria-hidden="true" /> View handoff record</button>
        {shareStatus ? <p className={styles.shareStatus} role="status" aria-live="polite">{shareStatus}</p> : null}
      </div>
    </section>
  );
}
