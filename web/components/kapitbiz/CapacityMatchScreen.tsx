"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Map, MapPinned, Star } from "lucide-react";
import type { CapacityHost, RelayDemoState, RelaySelection } from "@/lib/kapitbiz";
import CapacityMap from "./CapacityMap";
import styles from "./KapitBizRelay.module.css";

type CapacityView = "list" | "map";

interface CapacityMatchScreenProps {
  state: RelayDemoState;
  selection: RelaySelection;
  eligibleHosts: CapacityHost[];
  onSelectHost: (hostId: string) => void;
}

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function HostAction({ host, eligible, onSelectHost }: { host: CapacityHost; eligible: boolean; onSelectHost: (hostId: string) => void }) {
  if (!eligible) return null;
  return (
    <button className={styles.primaryButton} type="button" onClick={() => onSelectHost(host.id)}>
      Select {host.name}
      <ArrowRight aria-hidden="true" />
    </button>
  );
}

export default function CapacityMatchScreen({
  state,
  selection,
  eligibleHosts,
  onSelectHost,
}: CapacityMatchScreenProps) {
  const [view, setView] = useState<CapacityView>("list");
  const eligibleIds = useMemo(() => new Set(eligibleHosts.map((host) => host.id)), [eligibleHosts]);
  const recommendedHost = eligibleHosts[0];
  const alternativeHosts = state.hosts.filter((host) => host.id !== recommendedHost?.id);

  return (
    <section className={styles.capacityScreen} aria-labelledby="capacity-heading">
      <header className={styles.capacityIntro}>
        <div>
          <p className={styles.eyebrow}>Near Panabo City</p>
          <h2 id="capacity-heading">{eligibleHosts.length} matches found</h2>
          <p>{selection.selectedWeightKg} kg selected for immediate transfer.</p>
        </div>
        <div className={styles.segmentedControl} role="group" aria-label="Capacity presentation">
          <button type="button" data-active={view === "list"} aria-pressed={view === "list"} onClick={() => setView("list")}>
            <MapPinned aria-hidden="true" />
            List
          </button>
          <button type="button" data-active={view === "map"} aria-pressed={view === "map"} onClick={() => setView("map")}>
            <Map aria-hidden="true" />
            Map
          </button>
        </div>
      </header>

      {view === "map" ? (
        <CapacityMap
          origin={[125.8008, 7.4478]}
          hosts={state.hosts}
          eligibleHostIds={[...eligibleIds]}
          selectedHostId={state.selectedHostId}
          onSelectHost={onSelectHost}
        />
      ) : null}

      {view === "list" && recommendedHost ? (
        <article className={styles.recommendedHost} aria-label="Recommended capacity match">
          <div className={styles.recommendedBand}>
            <span><Star aria-hidden="true" /> Recommended match</span>
            <span>Top reliability</span>
          </div>
          <div className={styles.recommendedContent}>
            <div className={styles.hostTitleRow}>
              <div>
                <h3>{recommendedHost.name}</h3>
                <p><span>{recommendedHost.locality}</span> | <span>{recommendedHost.distanceKm} km away</span></p>
              </div>
              <span className={styles.verifiedBadge}>Network-verified</span>
            </div>
            <dl className={styles.hostMetrics}>
              <div><dt>Available space</dt><dd>{recommendedHost.capacityKg} kg</dd></div>
              <div><dt>Transfer</dt><dd>{recommendedHost.transferMinutes} min</dd></div>
              <div><dt>Window</dt><dd>{recommendedHost.windowHours} hours</dd></div>
              <div><dt>Service fee</dt><dd>{formatCurrency(recommendedHost.fee)}</dd></div>
            </dl>
            <p className={styles.hostMatchReason}><CheckCircle2 aria-hidden="true" /> Outside affected area; simulated network verification.</p>
            <p className={styles.transferDetail}><span>{recommendedHost.transferMinutes} min transfer</span> after pickup</p>
            <HostAction host={recommendedHost} eligible onSelectHost={onSelectHost} />
          </div>
        </article>
      ) : null}

      {view === "list" ? (
        <section className={styles.capacityAlternatives} aria-labelledby="alternatives-heading">
          <h3 id="alternatives-heading">Alternative logistics hubs</h3>
          <ul>
            {alternativeHosts.map((host) => {
              const eligible = eligibleIds.has(host.id);
              const isCapacityGap = host.capacityKg < selection.selectedWeightKg;
              return (
                <li className={styles.alternativeHost} data-eligible={eligible} key={host.id}>
                  <div>
                    <h4>{host.name}</h4>
                    <p>{host.locality} | {host.distanceKm} km | {formatCurrency(host.fee)} fee</p>
                  </div>
                  {eligible ? (
                    <HostAction host={host} eligible={eligible} onSelectHost={onSelectHost} />
                  ) : (
                    <div className={styles.hostIneligibleReason}>
                      <strong>{isCapacityGap ? "Capacity gap" : "Long route"}</strong>
                      <span>{host.reason.replace(/\.$/, "")}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
