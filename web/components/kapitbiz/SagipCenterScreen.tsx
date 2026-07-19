"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { KapitBizSagipState, SagipAction, SagipRequestKind } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

export default function SagipCenterScreen({
  state,
  dispatch,
}: {
  state: KapitBizSagipState;
  dispatch: (action: SagipAction) => void;
}) {
  const [segment, setSegment] = useState<SagipRequestKind>("need");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const requests = state.requests.filter((request) => request.kind === segment);
  const postLabel = segment === "need" ? "Post a request" : "Post surplus";
  const emptyLabel = segment === "need"
    ? "No open requests yet. Post one to start collecting blind offers."
    : "No surplus posted yet. Offer idle stock or capacity for other businesses to bid on.";

  return (
    <section className={styles.sagipScreen} aria-labelledby="sagip-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Sagip Center</p>
        <h2 id="sagip-heading">Sagip Center</h2>
        <p>Post a supply need or surplus and collect blind offers from the seeded partner network.</p>
      </header>

      <div className={styles.segmentedControl} role="group" aria-label="Sagip Center mode">
        <button type="button" data-active={segment === "need"} aria-pressed={segment === "need"} onClick={() => setSegment("need")}>
          Requesting
        </button>
        <button type="button" data-active={segment === "surplus"} aria-pressed={segment === "surplus"} onClick={() => setSegment("surplus")}>
          Offering surplus
        </button>
      </div>

      <button className={styles.primaryButton} type="button">
        <Plus aria-hidden="true" />
        {postLabel}
      </button>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <ul className={styles.sagipRequestList} aria-label={segment === "need" ? "Posted requests" : "Posted surplus"}>
          {requests.map((request) => (
            <li key={request.id}>{request.title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
