"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import { SEEDED_HAZARD_EVENT } from "@/lib/kapitbiz-hazard-assist";
import styles from "./KapitBizRelay.module.css";

export default function HazardAlertStrip({
  onRunSafetyCheck,
  onOpenGoodSamaritan,
}: {
  onRunSafetyCheck: () => void;
  onOpenGoodSamaritan: () => void;
}) {
  return (
    <section className={styles.hazardAlertStrip} aria-labelledby="hazard-alert-heading">
      <TriangleAlert aria-hidden="true" />
      <div className={styles.hazardAlertCopy}>
        <p className={styles.eyebrow}>Simulated demo event</p>
        <h3 id="hazard-alert-heading">{SEEDED_HAZARD_EVENT.title}</h3>
        <p>{SEEDED_HAZARD_EVENT.detail}</p>
        <ul className={styles.hazardChips} aria-label="Hazard Assist demo inputs">
          <li>Demo feed</li><li>Fuel reference</li><li>Neighbor capacity</li>
        </ul>
      </div>
      <div className={styles.hazardAlertActions}>
        <button className={styles.hazardAlertAction} type="button" onClick={onRunSafetyCheck}>
          Run Safety Check <ArrowRight aria-hidden="true" />
        </button>
        <button className={styles.hazardNeighborAction} type="button" onClick={onOpenGoodSamaritan}>Good Samaritan capacity</button>
      </div>
    </section>
  );
}
