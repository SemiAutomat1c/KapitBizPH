"use client";

/* QR data URLs and browser-local evidence object URLs cannot use Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent, type Dispatch } from "react";
import QRCode from "qrcode";
import { Camera, CheckCircle2, ImagePlus, ShieldCheck } from "lucide-react";
import {
  simulatedTransferConfirmedAt,
  type RelayAction,
  type RelayDemoState,
  type RelaySelection,
} from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(new Date(timestamp));
}

export default function HandoffScreen({
  state,
  selection,
  dispatch,
}: {
  state: RelayDemoState;
  selection: RelaySelection;
  dispatch: Dispatch<RelayAction>;
}) {
  const host = state.hosts.find((candidate) => candidate.id === state.selectedHostId);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const evidenceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!host || !state.handoffId || !state.reservationConfirmedAt) return;

    let active = true;
    const payload = JSON.stringify({
      id: state.handoffId,
      sender: "Maya's Frozen Goods",
      receiver: host.name,
      value: selection.selectedValue,
      weightKg: selection.selectedWeightKg,
      reservationConfirmedAt: state.reservationConfirmedAt,
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: { dark: "#002d86", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (active) {
          setQrDataUrl(dataUrl);
          setQrFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl(null);
          setQrFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [host, selection.selectedValue, selection.selectedWeightKg, state.handoffId, state.reservationConfirmedAt]);

  useEffect(() => () => {
    if (evidenceUrlRef.current) URL.revokeObjectURL(evidenceUrlRef.current);
  }, []);

  const handleEvidenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    if (evidenceUrlRef.current) URL.revokeObjectURL(evidenceUrlRef.current);
    evidenceUrlRef.current = nextUrl;
    setEvidenceUrl(nextUrl);
  };

  if (!host || !state.handoffId || !state.reservationConfirmedAt) return null;

  return (
    <section className={styles.handoffScreen} aria-labelledby="handoff-heading">
      <header className={styles.handoffIntro}>
        <div>
          <p className={styles.eyebrow}>Custody confirmation</p>
          <h2 id="handoff-heading">Inventory handoff</h2>
        </div>
        <span className={styles.handoffId}>{state.handoffId}</span>
      </header>

      <div className={styles.handoffParties} aria-label="Handoff parties">
        <div><span>Sender</span><strong>Maya&apos;s Frozen Goods</strong></div>
        <span className={styles.handoffArrow} aria-hidden="true">→</span>
        <div><span>Receiver</span><strong>{host.name}</strong></div>
      </div>

      <section className={styles.qrPanel} aria-label="QR receiver handoff">
        <div className={styles.qrFrame}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="KapitBiz handoff QR code" className={styles.qrCode} />
          ) : (
            <div className={styles.qrFallback} role="status" aria-live="polite">
              <ShieldCheck aria-hidden="true" />
              <strong>{qrFailed ? "QR unavailable" : "Preparing secure handoff"}</strong>
              <span>{state.handoffId}</span>
            </div>
          )}
        </div>
        <p className={styles.waitingStatus} role="status" aria-live="polite">
          <span aria-hidden="true" /> Waiting for receiver confirmation
        </p>
        {qrFailed ? <p className={styles.inlineNotice}>Use the handoff ID for manual receiver confirmation. QR rendering does not block this rescue.</p> : null}
        <p className={styles.handoffTimestamp}>Reservation confirmed {formatTime(state.reservationConfirmedAt)}</p>
      </section>

      <section className={styles.handoffMetrics} aria-label="Transfer details">
        <div><span>Inventory</span><strong>{selection.selectedGroups} groups</strong></div>
        <div><span>Payload</span><strong>{selection.selectedWeightKg} kg</strong><strong>{formatCurrency(selection.selectedValue)}</strong></div>
      </section>

      <section className={styles.evidenceSection} aria-labelledby="evidence-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Optional handoff proof</p><h3 id="evidence-heading">Verification evidence</h3></div>
          <label className={styles.evidenceInputLabel} htmlFor="handoff-evidence"><Camera aria-hidden="true" /> Add photo</label>
          <input id="handoff-evidence" className={styles.visuallyHidden} type="file" accept="image/*" onChange={handleEvidenceChange} />
        </div>
        <div className={styles.evidenceRow}>
          {evidenceUrl ? (
            <img className={styles.evidencePreview} src={evidenceUrl} alt="Selected handoff evidence preview" />
          ) : (
            <div className={styles.evidenceEmpty} aria-label="No evidence photo selected"><ImagePlus aria-hidden="true" /><span>No photo selected</span></div>
          )}
        </div>
        <p className={styles.evidenceNote}>Evidence preview stays on this device and is not uploaded.</p>
      </section>

      <aside className={styles.custodyPanel} aria-label="Handoff custody details">
        <ShieldCheck aria-hidden="true" />
        <div><strong>Receiver confirmation is simulated</strong><p>{selection.selectedWeightKg} kg valued at {formatCurrency(selection.selectedValue)} is transferring from Maya&apos;s Frozen Goods to {host.name}.</p></div>
      </aside>

      <div className={styles.handoffAction}>
        <span><ShieldCheck aria-hidden="true" /> Secured by KapitBiz Relay</span>
        <button className={styles.primaryButton} type="button" onClick={() => dispatch({ type: "confirm-receiver", at: simulatedTransferConfirmedAt(state, Date.now()) })}>
          <CheckCircle2 aria-hidden="true" /> Confirm inventory received
        </button>
      </div>
    </section>
  );
}
