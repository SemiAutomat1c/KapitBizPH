"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { generateOffersForRequest, postSagipRequest, type KapitBizSagipState, type SagipAction, type SagipCategory, type SagipRequestKind } from "@/lib/kapitbiz-sagip";
import HazardAssistDialog from "./HazardAssistDialog";
import SagipRequestForm from "./SagipRequestForm";
import styles from "./KapitBizRelay.module.css";

type SagipSurface = { kind: "closed" } | { kind: "post-request" };

export default function SagipCenterScreen({
  state,
  dispatch,
}: {
  state: KapitBizSagipState;
  dispatch: (action: SagipAction) => void;
}) {
  const [segment, setSegment] = useState<SagipRequestKind>("need");
  const [now, setNow] = useState(() => Date.now());
  const [surface, setSurface] = useState<SagipSurface>({ kind: "closed" });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const requests = state.requests.filter((request) => request.kind === segment);
  const postLabel = segment === "need" ? "Post a request" : "Post surplus";
  const emptyLabel = segment === "need"
    ? "No open requests yet. Post one to start collecting blind offers."
    : "No surplus posted yet. Offer idle stock or capacity for other businesses to bid on.";
  const submitRequest = (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number }) => {
    const request = postSagipRequest({ ...input, kind: segment, calamityModeActive: false }, now);
    dispatch({ type: "post-request", request });
    dispatch({ type: "receive-offers", offers: generateOffersForRequest(request, now) });
    setSurface({ kind: "closed" });
  };

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

      <button className={styles.primaryButton} type="button" onClick={() => setSurface({ kind: "post-request" })}>
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

      {surface.kind === "post-request" ? (
        <HazardAssistDialog label={postLabel} focusKey="post-request" onClose={() => setSurface({ kind: "closed" })}>
          <SagipRequestForm kind={segment} onSubmit={submitRequest} onClose={() => setSurface({ kind: "closed" })} />
        </HazardAssistDialog>
      ) : null}
    </section>
  );
}
