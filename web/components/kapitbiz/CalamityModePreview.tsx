"use client";

import styles from "./KapitBizRelay.module.css";

export default function CalamityModePreview() {
  return (
    <aside className={styles.calamityPreview} aria-label="Calamity Mode guardrail preview">
      <strong>Calamity Mode guardrail preview</strong>
      <p>Future live offers would be checked against official price ceilings during declared calamities.</p>
      <small><span>Demo data only.</span> No official SRP feed or enforcement is connected.</small>
    </aside>
  );
}
