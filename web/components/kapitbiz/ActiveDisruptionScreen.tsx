import { useEffect, useState } from "react";
import { Circle, CircleAlert, Zap } from "lucide-react";
import type { RelayDemoState } from "@/lib/kapitbiz";
import DemoDataNotice from "./DemoDataNotice";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatRescueWindow(scenarioStartedAt: number, now: number): string {
  const remainingSeconds = Math.max(0, 90 * 60 - Math.floor((now - scenarioStartedAt) / 1_000));
  const hours = Math.floor(remainingSeconds / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function ActiveDisruptionScreen({ state, onStart }: { state: RelayDemoState; onStart: () => void }) {
  const atRiskValue = state.inventory.reduce((total, item) => total + item.totalValue, 0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className={styles.incidentScreen} aria-labelledby="incident-heading">
      <div className={styles.alertPanel} role="status">
        <CircleAlert aria-hidden="true" />
        <div>
          <h2 id="incident-heading">Localized power interruption alert</h2>
          <p>Tagum City, Davao del Norte</p>
        </div>
      </div>

      <section className={styles.disruptionPanel} aria-labelledby="disruption-heading">
        <div className={styles.panelHeading}>
          <h3 id="disruption-heading">Disruption status</h3>
          <p className={styles.statusBadge}>Active</p>
        </div>
        <div className={styles.incidentFacts}>
          <div>
            <span>Started</span>
            <strong>2:10 PM</strong>
          </div>
          <div>
            <span>Est. duration</span>
            <strong>6 Hours</strong>
          </div>
        </div>
        <div className={styles.riskFacts}>
          <div>
            <span>Inventory at risk</span>
            <strong>{formatCurrency(atRiskValue)}</strong>
          </div>
          <div>
            <span>Rescue window</span>
            <strong>{formatRescueWindow(state.scenarioStartedAt, now)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.merchantPanel} aria-label="Merchant at risk">
        <h3>Maya&apos;s Frozen Goods</h3>
        <p>Tagum Central Hub</p>
        <span><Circle aria-hidden="true" />System alert</span>
      </section>

      <button className={styles.primaryButton} type="button" onClick={onStart}>
        <Zap aria-hidden="true" />
        Start inventory rescue
      </button>
      <DemoDataNotice />
    </section>
  );
}
