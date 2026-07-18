"use client";

import type { RelayDemoState, RelaySelection } from "@/lib/kapitbiz";
import { ArrowRight, FileCheck2, MapPinned, ShieldCheck, TriangleAlert } from "lucide-react";
import styles from "./KapitBizRelay.module.css";

function formatPhp(value: number): string {
  return `PHP${value.toLocaleString("en-PH")}`;
}

export default function HomeScreen({
  state,
  selection,
  eligibleHostCount,
  onOpenRescue,
}: {
  state: RelayDemoState;
  selection: RelaySelection;
  eligibleHostCount: number;
  onOpenRescue: () => void;
}) {
  const atRiskValue = state.inventory.reduce((total, item) => total + item.totalValue, 0);
  const rescueStarted = state.step !== "incident";

  return (
    <section className={styles.homeScreen} aria-labelledby="home-heading">
      <div className={styles.homeIntro}>
        <p className={styles.eyebrow}>Merchant home</p>
        <h2 id="home-heading">Good morning, Maya</h2>
        <p>Maya&apos;s Frozen Goods</p>
      </div>

      <section className={styles.homeAlert} aria-labelledby="active-incident-heading">
        <TriangleAlert aria-hidden="true" />
        <div>
          <p className={styles.eyebrow}>Active localized interruption</p>
          <h3 id="active-incident-heading">Power interruption in Tagum City</h3>
          <p>Seeded six-hour disruption scenario. Inventory protection can begin when you are ready.</p>
        </div>
      </section>

      <section className={styles.homeMetrics} aria-label="Rescue summary">
        <div>
          <span>At risk</span>
          <strong>{formatPhp(atRiskValue)}</strong>
        </div>
        <div>
          <span>Active request</span>
          <strong>{rescueStarted ? "In progress" : "Ready"}</strong>
        </div>
        <div>
          <span>Eligible hosts</span>
          <strong>{eligibleHostCount}</strong>
        </div>
        <div>
          <span>Protected value</span>
          <strong>{formatPhp(selection.selectedValue)}</strong>
        </div>
      </section>

      <section className={styles.homeSummary} aria-label="Prepared rescue selection">
        <MapPinned aria-hidden="true" />
        <div>
          <h3>Prepared for relay</h3>
          <p>{selection.selectedWeightKg} kg selected across {selection.selectedGroups} inventory groups. {eligibleHostCount} hosts can accept this transfer.</p>
        </div>
      </section>

      <button className={styles.primaryButton} type="button" onClick={onOpenRescue}>
        {rescueStarted ? "Resume rescue" : "Start inventory rescue"}
        <ArrowRight aria-hidden="true" />
      </button>

      {state.receiverConfirmedAt !== null ? (
        <button className={styles.secondaryAction} type="button" onClick={onOpenRescue}>
          <FileCheck2 aria-hidden="true" />
          View Custody Record
        </button>
      ) : null}
      <p className={styles.homeFootnote}><ShieldCheck aria-hidden="true" /> Seeded merchant, host, and rider data for this pilot demo.</p>
    </section>
  );
}
