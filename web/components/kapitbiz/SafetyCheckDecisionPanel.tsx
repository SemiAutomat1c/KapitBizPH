"use client";

import { X } from "lucide-react";
import {
  selectContinuityRecommendation,
  type KapitBizHazardAssistState,
  type SafetyCheckAnswer,
} from "@/lib/kapitbiz-hazard-assist";
import CalamityModePreview from "./CalamityModePreview";
import styles from "./KapitBizRelay.module.css";

// Safety Check and the continuity decision used to be two separate dialogs
// (answer "Stock at risk" closed one screen and opened another with a new
// dialog name and stolen focus). Merged into one continuous screen: the
// recommendation just appears below the question when the answer calls for
// it, no navigation, no refocus.
export default function SafetyCheckDecisionPanel({
  state,
  onAnswer,
  onStartRelay,
  onAskNearbyHosts,
  onClose,
  onSetCalamityPreview,
}: {
  state: KapitBizHazardAssistState;
  onAnswer: (answer: Exclude<SafetyCheckAnswer, "unknown">) => void;
  onStartRelay: () => void;
  onAskNearbyHosts: () => void;
  onClose: () => void;
  onSetCalamityPreview: (open: boolean) => void;
}) {
  const atRisk = state.safetyCheckAnswer === "stock-at-risk";
  const recommendation = atRisk ? selectContinuityRecommendation(state) : null;

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Simulated Safety Check</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close Safety Check" title="Close Safety Check">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>
          Is Maya&apos;s Frozen Goods safe to operate right now?
        </h2>
        <p>One operational check routes the business to the next continuity action.</p>
        <div className={styles.safetyChoices} role="group" aria-label="Safety Check answer">
          <button type="button" aria-pressed={state.safetyCheckAnswer === "safe"} onClick={() => onAnswer("safe")}>Safe for now</button>
          <button type="button" aria-pressed={state.safetyCheckAnswer === "need-help"} onClick={() => onAnswer("need-help")}>Need help</button>
          <button type="button" aria-pressed={atRisk} onClick={() => onAnswer("stock-at-risk")}>Stock at risk</button>
        </div>

        {atRisk ? (
          <>
            <h3>{recommendation === "relay" ? "Recommended: Relay the frozen stock" : "Recommended: Run the generator"}</h3>
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
              <button className={styles.secondaryButton} type="button" onClick={onAskNearbyHosts}>Good Samaritan capacity</button>
              <button className={styles.secondaryButton} type="button" onClick={() => onSetCalamityPreview(!state.calamityModePreviewOpen)}>View Calamity Mode</button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
