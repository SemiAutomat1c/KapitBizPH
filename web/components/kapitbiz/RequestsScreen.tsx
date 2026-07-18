"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import type { RelayDemoState } from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

type RequestFilter = "active" | "pending" | "completed";

const filters: Array<{ id: RequestFilter; label: string }> = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

export default function RequestsScreen({
  state,
  onOpenRescue,
}: {
  state: RelayDemoState;
  onOpenRescue: () => void;
}) {
  const [filter, setFilter] = useState<RequestFilter>("active");
  const rescueComplete = state.receiverConfirmedAt !== null;

  return (
    <section className={styles.requestsScreen} aria-labelledby="requests-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Merchant operations</p>
        <h2 id="requests-heading">Rescue requests</h2>
        <p>Track the seeded rescue queue for Maya&apos;s Frozen Goods.</p>
      </header>

      <fieldset className={styles.requestFilters} aria-label="Request status">
        <legend className={styles.visuallyHidden}>Request status</legend>
        {filters.map((option) => (
          <label key={option.id} data-selected={filter === option.id}>
            <input
              type="radio"
              name="request-filter"
              value={option.id}
              checked={filter === option.id}
              onChange={() => setFilter(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {filter === "active" ? (
        rescueComplete ? <p className={styles.emptyState}>No active rescue requests.</p> : <ActiveRequest state={state} onOpenRescue={onOpenRescue} />
      ) : null}
      {filter === "pending" ? <PendingRequest /> : null}
      {filter === "completed" ? <CompletedRequests complete={rescueComplete} /> : null}
    </section>
  );
}

function ActiveRequest({ state, onOpenRescue }: { state: RelayDemoState; onOpenRescue: () => void }) {
  const rescueStatus = state.step === "incident" ? "Ready to begin" : "In progress";

  return (
    <article className={styles.requestRow}>
      <div className={styles.requestIcon}><PackageCheck aria-hidden="true" /></div>
      <div className={styles.requestCopy}>
        <div className={styles.requestTitleRow}><h3>RE-4892-X</h3><span className={styles.currentBadge}>{rescueStatus}</span></div>
        <p>42 kg selected · PHP16,500 protected value</p>
        <small>Northline Cold Storage · PHP300 storage · PHP150 rider · PHP450 total</small>
      </div>
      <button className={styles.inlineAction} type="button" onClick={onOpenRescue} aria-label="Resume rescue RE-4892-X">
        Resume <ArrowRight aria-hidden="true" />
      </button>
    </article>
  );
}

function PendingRequest() {
  return (
    <article className={styles.requestRow}>
      <div className={styles.requestIcon}><Clock3 aria-hidden="true" /></div>
      <div className={styles.requestCopy}>
        <div className={styles.requestTitleRow}><h3>Host confirmation requested</h3><span className={styles.pendingBadge}>Pending</span></div>
        <p>Northline Cold Storage is reviewing a seeded capacity check.</p>
        <small>Queue reference HC-104 · no merchant action required</small>
      </div>
    </article>
  );
}

function CompletedRequests({ complete }: { complete: boolean }) {
  return (
    <div className={styles.requestList}>
      <article className={styles.requestRow}>
        <div className={styles.requestIcon}><CheckCircle2 aria-hidden="true" /></div>
        <div className={styles.requestCopy}>
          <div className={styles.requestTitleRow}><h3>RE-4817-V</h3><span className={styles.completeBadge}>Completed</span></div>
          <p>Seeded historical cold-storage transfer closed.</p>
          <small>PHP8,200 protected · custody record archived</small>
        </div>
      </article>
      {complete ? (
        <article className={styles.requestRow}>
          <div className={styles.requestIcon}><CheckCircle2 aria-hidden="true" /></div>
          <div className={styles.requestCopy}>
            <div className={styles.requestTitleRow}><h3>RE-4892-X</h3><span className={styles.completeBadge}>Completed</span></div>
            <p>42 kg transferred to Northline Cold Storage.</p>
            <small>PHP16,500 protected value · PHP450 total rescue cost</small>
          </div>
        </article>
      ) : <p className={styles.emptyState}>No completed rescue requests yet</p>}
    </div>
  );
}
