"use client";

import type { KapitBizHazardAssistState } from "@/lib/kapitbiz-hazard-assist";
import { ArrowRight, ShieldCheck } from "lucide-react";
import HazardAlertStrip from "./HazardAlertStrip";
import { HomeBannerIllustration } from "./illustrations";
import styles from "./KapitBizRelay.module.css";

export default function HomeScreen({
  hazardAssistState,
  onRunSafetyCheck,
  onOpenGoodSamaritan,
  onOpenSagip,
}: {
  hazardAssistState: KapitBizHazardAssistState;
  onRunSafetyCheck: () => void;
  onOpenGoodSamaritan: () => void;
  onOpenSagip: () => void;
}) {
  return (
    <section className={styles.homeScreen} aria-labelledby="home-heading">
      <div className={styles.homeIntro}>
        <p className={styles.eyebrow}>Merchant home</p>
        <h2 id="home-heading">Good morning, Maya</h2>
        <p>Maya&apos;s Frozen Goods</p>
      </div>

      <div className={styles.homeBanner} aria-hidden="true">
        <HomeBannerIllustration />
      </div>

      <HazardAlertStrip onRunSafetyCheck={onRunSafetyCheck} onOpenGoodSamaritan={onOpenGoodSamaritan} />
      {hazardAssistState.safetyCheckAnswer === "safe" ? (
        <p className={styles.safetyCheckRecorded}>Safety Check recorded: safe for now.</p>
      ) : null}

      <button className={styles.primaryButton} type="button" onClick={onOpenSagip}>
        Tingnan ang Sagip Center
        <ArrowRight aria-hidden="true" />
      </button>

      <p className={styles.homeFootnote}><ShieldCheck aria-hidden="true" /> Seeded merchant, host, and rider data for this pilot demo.</p>
    </section>
  );
}
