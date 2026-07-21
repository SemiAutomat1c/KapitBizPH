"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Package, PackageCheck, ShieldAlert, Truck, Warehouse } from "lucide-react";
import type { RelayDemoState } from "@/lib/kapitbiz";
import { EmptyRequestsIllustration } from "./illustrations";
import styles from "./KapitBizRelay.module.css";

type RequestFilter = "active" | "pending" | "completed";

const filters: Array<{ id: RequestFilter; label: string; icon: typeof Package }> = [
  { id: "active", label: "Active", icon: ShieldAlert },
  { id: "pending", label: "Pending", icon: Clock3 },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function RequestsScreen({
  state,
  startedFromHazardAssist = false,
  onOpenRescue,
}: {
  state: RelayDemoState;
  startedFromHazardAssist?: boolean;
  onOpenRescue: () => void;
}) {
  const [filter, setFilter] = useState<RequestFilter>("active");
  const rescueComplete = state.receiverConfirmedAt !== null;

  const counts = {
    active: rescueComplete ? 0 : 1,
    pending: 1,
    completed: rescueComplete ? 2 : 1,
  };

  return (
    <section className={styles.requestsScreen} aria-labelledby="requests-heading">
      <header className={styles.requestsHeader}>
        <div>
          <p className={styles.eyebrow}>Merchant operations</p>
          <h2 id="requests-heading">Rescue requests</h2>
          <p>Track the rescue queue for Maya&apos;s Frozen Goods.</p>
        </div>
        <div className={styles.requestsSummary}>
          <span className={styles.requestsSummaryCount}>{counts.active}</span>
          <span className={styles.requestsSummaryLabel}>Active</span>
        </div>
      </header>

      <fieldset className={styles.requestFilters} aria-label="Request status">
        <legend className={styles.visuallyHidden}>Request status</legend>
        {filters.map((option) => {
          const Icon = option.icon;
          return (
            <label key={option.id} data-selected={filter === option.id}>
              <input
                type="radio"
                name="request-filter"
                value={option.id}
                aria-label={option.label}
                checked={filter === option.id}
                onChange={() => setFilter(option.id)}
              />
              <Icon aria-hidden="true" />
              <span>{option.label}</span>
              {counts[option.id] > 0 && (
                <span className={styles.filterCount} aria-hidden="true">{counts[option.id]}</span>
              )}
            </label>
          );
        })}
      </fieldset>

      <div className={styles.requestList}>
        {filter === "active" ? (
          rescueComplete ? (
            <div className={styles.emptyStateBlock}>
              <EmptyRequestsIllustration />
              <p>No active rescue requests.</p>
            </div>
          ) : (
            <ActiveRequest state={state} startedFromHazardAssist={startedFromHazardAssist} onOpenRescue={onOpenRescue} />
          )
        ) : null}
        {filter === "pending" ? <PendingRequest /> : null}
        {filter === "completed" ? <CompletedRequests complete={rescueComplete} /> : null}
      </div>
    </section>
  );
}

function ActiveRequest({ state, startedFromHazardAssist, onOpenRescue }: { state: RelayDemoState; startedFromHazardAssist: boolean; onOpenRescue: () => void }) {
  const isStarted = state.step !== "incident";
  const stepProgress = {
    incident: 1,
    triage: 2,
    capacity: 3,
    reservation: 4,
    handoff: 5,
    complete: 6,
  };
  const currentStep = stepProgress[state.step] ?? 1;

  return (
    <article className={`${styles.requestCard} ${styles.requestCardActive}`}>
      <div className={styles.requestCardAccent} />
      <div className={styles.requestCardInner}>
        <div className={styles.requestCardTop}>
          <div className={styles.requestCardIcon} data-status="active">
            <PackageCheck aria-hidden="true" />
          </div>
          <div className={styles.requestCardMeta}>
            <div className={styles.requestCardTitleRow}>
              <h3>RE-4892-X</h3>
              <span className={styles.badgeActive}>{isStarted ? "In progress" : "Ready to begin"}</span>
            </div>
            {startedFromHazardAssist && (
              <span className={styles.requestCardSource}>
                <ShieldAlert aria-hidden="true" />
                Started from Safety Check
              </span>
            )}
            <p className={styles.requestCardDesc}>42 kg selected · PHP16,500 protected value</p>
          </div>
        </div>

        <div className={styles.requestProgress}>
          {["Initiated", "Triaged", "Matched", "Reserved", "In transit"].map((label, i) => (
            <div key={label} className={styles.requestProgressStep} data-done={currentStep > i + 1} data-active={currentStep === i + 1}>
              <div className={styles.requestProgressDot} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.requestCardDetails}>
          <div className={styles.requestDetailChip}>
            <Warehouse aria-hidden="true" />
            Northline Cold Storage · PHP300
          </div>
          <div className={styles.requestDetailChip}>
            <Truck aria-hidden="true" />
            Rider · PHP150
          </div>
        </div>

        <button className={styles.requestCardAction} type="button" onClick={onOpenRescue} aria-label="Resume rescue RE-4892-X">
          {isStarted ? "Resume rescue" : "Start rescue"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function PendingRequest() {
  return (
    <article className={`${styles.requestCard} ${styles.requestCardPending}`}>
      <div className={styles.requestCardAccent} />
      <div className={styles.requestCardInner}>
        <div className={styles.requestCardTop}>
          <div className={styles.requestCardIcon} data-status="pending">
            <Clock3 aria-hidden="true" />
          </div>
          <div className={styles.requestCardMeta}>
            <div className={styles.requestCardTitleRow}>
              <h3>Host confirmation requested</h3>
              <span className={styles.badgePending}>Pending</span>
            </div>
            <p className={styles.requestCardDesc}>Northline Cold Storage is reviewing a seeded capacity check.</p>
          </div>
        </div>
        <p className={styles.requestCardNote}>Queue reference HC-104 · no merchant action required</p>
      </div>
    </article>
  );
}

function CompletedRequests({ complete }: { complete: boolean }) {
  return (
    <>
      {complete && (
        <article className={`${styles.requestCard} ${styles.requestCardComplete}`}>
          <div className={styles.requestCardAccent} />
          <div className={styles.requestCardInner}>
            <div className={styles.requestCardTop}>
              <div className={styles.requestCardIcon} data-status="complete">
                <CheckCircle2 aria-hidden="true" />
              </div>
              <div className={styles.requestCardMeta}>
                <div className={styles.requestCardTitleRow}>
                  <h3>RE-4892-X</h3>
                  <span className={styles.badgeComplete}>Completed</span>
                </div>
                <p className={styles.requestCardDesc}>42 kg transferred to Northline Cold Storage.</p>
              </div>
            </div>
            <p className={styles.requestCardNote}>PHP16,500 protected value · PHP450 total rescue cost</p>
          </div>
        </article>
      )}
      <article className={`${styles.requestCard} ${styles.requestCardComplete}`}>
        <div className={styles.requestCardAccent} />
        <div className={styles.requestCardInner}>
          <div className={styles.requestCardTop}>
            <div className={styles.requestCardIcon} data-status="complete">
              <CheckCircle2 aria-hidden="true" />
            </div>
            <div className={styles.requestCardMeta}>
              <div className={styles.requestCardTitleRow}>
                <h3>RE-4817-V</h3>
                <span className={styles.badgeComplete}>Completed</span>
              </div>
              <p className={styles.requestCardDesc}>Seeded historical cold-storage transfer closed.</p>
            </div>
          </div>
          <p className={styles.requestCardNote}>PHP8,200 protected · custody record archived</p>
        </div>
      </article>
    </>
  );
}
