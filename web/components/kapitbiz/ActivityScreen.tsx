import { CheckCircle2, Clock3, FileCheck2, Store } from "lucide-react";
import type { RelayDemoState } from "@/lib/kapitbiz";
import type { KapitBizDemoSession } from "@/lib/kapitbiz-demo";
import { buildActivityFeed } from "@/lib/kapitbiz-activity";
import styles from "./KapitBizRelay.module.css";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(new Date(timestamp));
}

export default function ActivityScreen({
  state,
  session,
  onOpenRecord,
}: {
  state: RelayDemoState;
  session: KapitBizDemoSession;
  onOpenRecord: () => void;
}) {
  const feed = buildActivityFeed(state, session);
  const seededAt = state.scenarioStartedAt - 24 * 60 * 60 * 1_000;

  return (
    <section className={styles.activityScreen} aria-labelledby="activity-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Operational log</p>
        <h2 id="activity-heading">Business activity</h2>
        <p>Merchant, rider, and custody events from this seeded rescue.</p>
      </header>

      <ol className={styles.activityFeed} aria-label="Business activity feed">
        <li className={styles.activityItem}>
          <span className={styles.activityMarker}><Store aria-hidden="true" /></span>
          <div>
            <div className={styles.activityTitleRow}><strong>Continuity profile reviewed</strong><time dateTime={new Date(seededAt).toISOString()}>{formatTime(seededAt)}</time></div>
            <p>Seeded merchant readiness record for Maya&apos;s Frozen Goods.</p>
          </div>
        </li>
        {feed.map((item) => (
          <li key={item.id} className={styles.activityItem} data-current={item.status === "current"}>
            <span className={styles.activityMarker}>{item.status === "current" ? <Clock3 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}</span>
            <div>
              <div className={styles.activityTitleRow}><strong>{item.label}</strong><time dateTime={new Date(item.at).toISOString()}>{formatTime(item.at)}</time></div>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      {state.receiverConfirmedAt !== null ? (
        <button className={styles.secondaryAction} type="button" onClick={onOpenRecord}>
          <FileCheck2 aria-hidden="true" />
          View custody record
        </button>
      ) : null}
    </section>
  );
}
