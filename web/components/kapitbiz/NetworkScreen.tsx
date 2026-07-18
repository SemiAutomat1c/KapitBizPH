"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Map, MapPinned, Snowflake, Truck, X } from "lucide-react";
import { deriveSelection, eligibleHosts, type CapacityHost, type RelayDemoState } from "@/lib/kapitbiz";
import CapacityMap from "./CapacityMap";
import styles from "./KapitBizRelay.module.css";

type PartnerType = "storage" | "transport";
type NetworkView = "list" | "map";

function formatCurrency(value: number): string {
  return `PHP${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function ineligibleLabel(host: CapacityHost, selectedWeightKg: number): string {
  return host.capacityKg < selectedWeightKg ? "Capacity gap" : "Long route";
}

function HostDetailsDialog({
  host,
  eligible,
  selectedWeightKg,
  onClose,
  onStartRequest,
}: {
  host: CapacityHost;
  eligible: boolean;
  selectedWeightKg: number;
  onClose: () => void;
  onStartRequest: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, [onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={styles.dialogBackdrop}>
      <section ref={dialogRef} className={styles.menuDialog} role="dialog" aria-modal="true" aria-labelledby="network-host-dialog-heading" onKeyDown={handleKeyDown}>
        <div className={styles.dialogHeader}>
          <h2 id="network-host-dialog-heading">{host.name}</h2>
          <button ref={closeRef} className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${host.name}`} title={`Close ${host.name}`}>
            <X aria-hidden="true" />
          </button>
        </div>
        <p className={styles.networkDialogLocation}>{host.locality} | {host.distanceKm} km | {host.transferMinutes} min transfer</p>
        <dl className={styles.networkDialogMetrics}>
          <div><dt>Free capacity</dt><dd>{host.capacityKg} kg</dd></div>
          <div><dt>Storage window</dt><dd>{host.windowHours} hours</dd></div>
          <div><dt>Storage fee</dt><dd>{formatCurrency(host.fee)}</dd></div>
          <div><dt>Active rescue</dt><dd>{selectedWeightKg} kg</dd></div>
        </dl>
        {eligible ? (
          <p className={styles.networkEligibility} data-eligible="true">Eligible for the seeded {selectedWeightKg} kg rescue.</p>
        ) : (
          <p className={styles.networkEligibility} data-eligible="false"><strong>{ineligibleLabel(host, selectedWeightKg)}</strong> {host.reason}</p>
        )}
        <p className={styles.networkSimulatedNotice}>Simulated seeded partner data. Capacity, availability, and route conditions are not live.</p>
        {eligible ? (
          <button className={styles.primaryButton} type="button" onClick={onStartRequest}>
            Start rescue request
            <ArrowRight aria-hidden="true" />
          </button>
        ) : null}
      </section>
    </div>
  );
}

export default function NetworkScreen({
  state,
  onStartRequest,
}: {
  state: RelayDemoState;
  onStartRequest: () => void;
}) {
  const [partnerType, setPartnerType] = useState<PartnerType>("storage");
  const [view, setView] = useState<NetworkView>("list");
  const [detailHost, setDetailHost] = useState<CapacityHost | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const eligiblePartnerIds = useMemo(() => new Set(eligibleHosts(state).map((host) => host.id)), [state]);
  const selectedWeightKg = useMemo(() => deriveSelection(state).selectedWeightKg, [state]);

  const openHostDetails = (host: CapacityHost, trigger?: HTMLButtonElement) => {
    if (trigger) triggerRef.current = trigger;
    setDetailHost(host);
  };
  const closeHostDetails = () => {
    const trigger = triggerRef.current;
    setDetailHost(null);
    window.requestAnimationFrame(() => {
      trigger?.focus();
      if (triggerRef.current === trigger) triggerRef.current = null;
    });
  };
  const selectPartnerType = (nextType: PartnerType) => {
    setPartnerType(nextType);
    if (nextType === "transport") setView("list");
  };

  return (
    <section className={styles.networkScreen} aria-labelledby="network-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Seeded demo network</p>
        <h2 id="network-heading">Relay network</h2>
        <p>Simulated storage hosts and transport options for the active {selectedWeightKg} kg rescue.</p>
      </header>

      <div className={styles.networkControls}>
        <div className={styles.segmentedControl} role="group" aria-label="Partner type">
          <button type="button" data-active={partnerType === "storage"} aria-pressed={partnerType === "storage"} onClick={() => selectPartnerType("storage")}>
            <Snowflake aria-hidden="true" />
            Storage
          </button>
          <button type="button" data-active={partnerType === "transport"} aria-pressed={partnerType === "transport"} onClick={() => selectPartnerType("transport")}>
            <Truck aria-hidden="true" />
            Transport
          </button>
        </div>
        {partnerType === "storage" ? (
          <div className={styles.segmentedControl} role="group" aria-label="Network presentation">
            <button type="button" data-active={view === "list"} aria-pressed={view === "list"} onClick={() => setView("list")}>
              <MapPinned aria-hidden="true" />
              List
            </button>
            <button type="button" data-active={view === "map"} aria-pressed={view === "map"} onClick={() => setView("map")}>
              <Map aria-hidden="true" />
              Map
            </button>
          </div>
        ) : null}
      </div>

      {partnerType === "storage" && view === "map" ? (
        <CapacityMap
          origin={[125.8008, 7.4478]}
          hosts={state.hosts}
          eligibleHostIds={[...eligiblePartnerIds]}
          selectedHostId={detailHost?.id ?? null}
          onSelectHost={(hostId, trigger) => {
            const host = state.hosts.find((candidate) => candidate.id === hostId);
            if (host) openHostDetails(host, trigger);
          }}
          presentation="directory"
        />
      ) : null}

      {partnerType === "storage" && view === "list" ? (
        <ul className={styles.networkList} aria-label="Seeded storage partners">
          {state.hosts.map((host) => {
            const eligible = eligiblePartnerIds.has(host.id);
            return (
              <li className={styles.networkRow} data-eligible={eligible} key={host.id}>
                <div className={styles.networkRowIcon}><Snowflake aria-hidden="true" /></div>
                <div className={styles.networkRowCopy}>
                  <div className={styles.networkRowTitle}>
                    <h3>{host.name}</h3>
                    <span>{eligible ? "Eligible" : ineligibleLabel(host, selectedWeightKg)}</span>
                  </div>
                  <p>{host.locality} | {host.capacityKg} kg free | {host.transferMinutes} min | {formatCurrency(host.fee)}</p>
                  {!eligible ? <small>{host.reason}</small> : null}
                </div>
                <button className={styles.inlineAction} type="button" onClick={(event) => openHostDetails(host, event.currentTarget)} aria-label={`View ${host.name} details`}>
                  Details
                  <ArrowRight aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {partnerType === "transport" ? (
        <ul className={styles.networkList} aria-label="Seeded transport partners">
          {state.transportOptions.map((transport) => (
            <li className={styles.networkRow} key={transport.id}>
              <div className={styles.networkRowIcon}><Truck aria-hidden="true" /></div>
              <div className={styles.networkRowCopy}>
                <div className={styles.networkRowTitle}><h3>{transport.name}</h3><span>Seeded option</span></div>
                <p>{`${transport.arrivalMinutes} min arrival | ${transport.capacityKg} kg capacity | ${formatCurrency(transport.fee)} fee`}</p>
                <small>Simulated dispatch availability; no live fleet status.</small>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {detailHost ? (
        <HostDetailsDialog
          host={detailHost}
          eligible={eligiblePartnerIds.has(detailHost.id)}
          selectedWeightKg={selectedWeightKg}
          onClose={closeHostDetails}
          onStartRequest={onStartRequest}
        />
      ) : null}
    </section>
  );
}
