"use client";

import { X } from "lucide-react";
import {
  selectContinuityRecommendation,
  type KapitBizHazardAssistState,
} from "@/lib/kapitbiz-hazard-assist";
import CalamityModePreview from "./CalamityModePreview";
import styles from "./KapitBizRelay.module.css";

export default function ContinuityDecisionPanel({
  state,
  onStartRelay,
  onAskNearbyHosts,
  onMarkSafe,
  onClose,
  onSetCalamityPreview,
}: {
  state: KapitBizHazardAssistState;
  onStartRelay: () => void;
  onAskNearbyHosts: () => void;
  onMarkSafe: () => void;
  onClose: () => void;
  onSetCalamityPreview: (open: boolean) => void;
}) {
  const recommendation = selectContinuityRecommendation(state);

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Simulated decision support</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close continuity decision" title="Close continuity decision">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody} aria-live="polite">
        <h2 data-hazard-initial-focus tabIndex={-1}>
          {recommendation === "relay" ? "Recommended: Relay the frozen stock" : "Recommended: Run the generator"}
        </h2>
        <p>It costs less than running the generator today and gives you a QR custody record.</p>
        <div className={styles.continuityOptions} aria-label="Continuity cost comparison">
          <section>
            <span>Run generator</span>
            <strong>PHP{state.generatorEstimatePhp}</strong>
            <small>6 hours x 1.75 L/hr x PHP68/L</small>
          </section>
          <section data-recommended="true">
            <span>Relay to cold storage</span>
            <strong>PHP{state.relayEstimatePhp}</strong>
            <small>Seeded storage plus rider reservation</small>
          </section>
        </div>
        {state.calamityModePreviewOpen ? <CalamityModePreview /> : null}
        <div className={styles.continuityActions}>
          <button className={styles.primaryButton} type="button" onClick={onStartRelay}>Start relay</button>
          <button className={styles.secondaryButton} type="button" onClick={onAskNearbyHosts}>Ask nearby hosts</button>
          <button className={styles.secondaryButton} type="button" onClick={() => onSetCalamityPreview(!state.calamityModePreviewOpen)}>View Calamity Mode</button>
          <button className={styles.secondaryButton} type="button" onClick={onMarkSafe}>Mark safe for now</button>
        </div>
      </div>
    </>
  );
}
