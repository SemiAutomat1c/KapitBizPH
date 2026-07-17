import { useEffect, useState } from "react";
import type { RelayDemoState } from "@/lib/kapitbiz";
import DemoDataNotice from "./DemoDataNotice";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatRescueWindow(scenarioStartedAt: number, now: number): string {
  const remainingMinutes = Math.max(0, 90 - Math.floor((now - scenarioStartedAt) / 60_000));
  return `${Math.floor(remainingMinutes / 60)} hr ${remainingMinutes % 60} min`;
}

export default function ActiveDisruptionScreen({ state, onStart }: { state: RelayDemoState; onStart: () => void }) {
  const atRiskValue = state.inventory.reduce((total, item) => total + item.totalValue, 0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className={styles.incidentScreen} aria-labelledby="incident-heading">
      <p className={styles.statusBadge}>Active disruption</p>
      <h2 id="incident-heading">A power interruption is approaching.</h2>
      <p className={styles.incidentCopy}>
        Maya&apos;s Frozen Goods has perishable stock that needs a verified rescue route before the interruption begins.
      </p>
      <div className={styles.incidentFacts}>
        <div>
          <span>Merchant</span>
          <strong>Maya&apos;s Frozen Goods</strong>
          <small>Tagum City</small>
        </div>
        <div>
          <span>Inventory at risk</span>
          <strong>{formatCurrency(atRiskValue)}</strong>
          <small>Frozen goods and cold-chain stock</small>
        </div>
        <div>
          <span>Rescue window</span>
          <strong>{formatRescueWindow(state.scenarioStartedAt, now)}</strong>
          <small>Before the most urgent stock spoils</small>
        </div>
      </div>
      <button className={styles.primaryButton} type="button" onClick={onStart}>
        Start inventory rescue
      </button>
      <DemoDataNotice />
    </section>
  );
}
