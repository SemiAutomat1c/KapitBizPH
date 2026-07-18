"use client";

import { X } from "lucide-react";
import type { RelayDemoState, RelaySelection } from "@/lib/kapitbiz";
import type { KapitBizHazardAssistState } from "@/lib/kapitbiz-hazard-assist";
import styles from "./KapitBizRelay.module.css";

export default function RecoveryPacketPreview({
  state,
  selection,
  hazardState,
  onClose,
}: {
  state: RelayDemoState;
  selection: RelaySelection;
  hazardState: KapitBizHazardAssistState;
  onClose: () => void;
}) {
  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Seeded recovery record</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close recovery packet preview" title="Close recovery packet preview">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>Recovery packet preview</h2>
        <p>Demo summary compiled from the seeded Hazard Assist and completed Relay record.</p>
        <dl className={styles.recoveryPacketList}>
          <div><dt>Business baseline</dt><dd><span>Maya&apos;s Frozen Goods</span> · <span>PHP21,800 at-risk inventory baseline</span></dd></div>
          <div><dt>Hazard context</dt><dd>Simulated brownout + flood-risk route</dd></div>
          <div><dt>Continuity decision</dt><dd><span>Relay chosen over PHP{hazardState.generatorEstimatePhp.toLocaleString("en-PH")} generator estimate</span></dd></div>
          <div><dt>Handoff evidence</dt><dd>QR custody record {state.handoffId ?? "RE-4892-X"} · PHP{selection.selectedValue.toLocaleString("en-PH")} protected</dd></div>
          <div><dt>Future product step</dt><dd>Exportable packet for recovery-loan or insurance documentation after backend and institutional validation.</dd></div>
        </dl>
        <aside className={styles.recoveryPacketDisclosure}>
          Preview only. This is not an accepted government form or guaranteed claim document.
        </aside>
        <button className={styles.secondaryAction} type="button" onClick={onClose}>Close preview</button>
      </div>
    </>
  );
}
