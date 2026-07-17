"use client";

import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent } from "react";
import {
  Bike,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  X,
  Zap,
} from "lucide-react";
import {
  calculateReservation,
  isTransportEligible,
  type RelayAction,
  type RelayDemoState,
  type RelaySelection,
} from "@/lib/kapitbiz";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatWeight(value: number): string {
  return value.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

function formatPickupDeadline(scenarioStartedAt: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(new Date(scenarioStartedAt + 90 * 60 * 1_000));
}

function TransportIcon({ transportId }: { transportId: string }) {
  return transportId === "rider" ? <Bike aria-hidden="true" /> : <Truck aria-hidden="true" />;
}

function TransportSheet({
  state,
  onClose,
  onApply,
}: {
  state: RelayDemoState;
  onClose: () => void;
  onApply: (transportId: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pendingTransportId, setPendingTransportId] = useState<string | null>(state.selectedTransportId);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
    <div className={styles.transportOverlay}>
      <div
        ref={dialogRef}
        className={styles.transportSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transport-selection-heading"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.sheetHandle} aria-hidden="true" />
        <header className={styles.transportSheetHeader}>
          <div>
            <p className={styles.eyebrow}>Dispatch transport</p>
            <h2 id="transport-selection-heading">Transport Selection</h2>
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close transport selection" title="Close transport selection">
            <X aria-hidden="true" />
          </button>
        </header>

        <fieldset className={styles.transportOptions}>
          <legend>Eligible transport options</legend>
          {state.transportOptions.map((transport) => {
            const eligible = isTransportEligible(state, transport);
            return (
              <label className={styles.transportOption} data-selected={pendingTransportId === transport.id} data-ineligible={!eligible} key={transport.id}>
                <input
                  type="radio"
                  name="transport"
                  value={transport.id}
                  checked={pendingTransportId === transport.id}
                  disabled={!eligible}
                  onChange={() => setPendingTransportId(transport.id)}
                />
                <span className={styles.transportIcon}><TransportIcon transportId={transport.id} /></span>
                <span className={styles.transportOptionCopy}>
                  <strong>{transport.name}</strong>
                  <span><Clock3 aria-hidden="true" /> Arrives in {transport.arrivalMinutes} min | {transport.capacityKg} kg capacity</span>
                  {!eligible ? <small>Cannot meet this rescue window</small> : null}
                </span>
                <strong className={styles.transportPrice}>{formatCurrency(transport.fee)}</strong>
                <span className={styles.transportCheck} aria-hidden="true"><Check /></span>
              </label>
            );
          })}
        </fieldset>

        <button
          className={styles.primaryButton}
          type="button"
          disabled={!pendingTransportId}
          onClick={() => {
            if (pendingTransportId) onApply(pendingTransportId);
          }}
        >
          Use selected transport
        </button>
      </div>
    </div>
  );
}

export default function ReservationScreen({
  state,
  selection,
  dispatch,
}: {
  state: RelayDemoState;
  selection: RelaySelection;
  dispatch: Dispatch<RelayAction>;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const chooseTransportRef = useRef<HTMLButtonElement>(null);
  const host = state.hosts.find((candidate) => candidate.id === state.selectedHostId);
  const selectedTransport = state.transportOptions.find((candidate) => candidate.id === state.selectedTransportId);
  const reservation = calculateReservation(state);

  if (!host) return null;

  const closeSheet = () => {
    setSheetOpen(false);
    chooseTransportRef.current?.focus();
  };

  return (
    <section className={styles.reservationScreen} aria-labelledby="reservation-heading">
      <header className={styles.reservationIntro}>
        <p className={styles.eyebrow}>Storage reservation</p>
        <h2 id="reservation-heading">Confirm reservation</h2>
        <p>Hold verified cold storage and dispatch the selected transfer service.</p>
      </header>

      <section className={styles.destinationCard} aria-labelledby="destination-heading">
        <div className={styles.destinationIdentity}>
          <span className={styles.destinationIcon}><PackageCheck aria-hidden="true" /></span>
          <div>
            <p className={styles.eyebrow}>Storage destination</p>
            <h3 id="destination-heading">{host.name}</h3>
            <p><MapPin aria-hidden="true" /> {host.locality} | {host.distanceKm} km away</p>
          </div>
        </div>
        <dl className={styles.destinationMetrics}>
          <div><dt>Capacity</dt><dd>{formatWeight(selection.selectedWeightKg)} kg</dd></div>
          <div><dt>Duration</dt><dd>{host.windowHours} hours</dd></div>
          <div><dt>Storage fee</dt><dd>{formatCurrency(host.fee)}</dd></div>
        </dl>
      </section>

      <section className={styles.reservationInventory} aria-labelledby="reservation-inventory-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Inventory for transfer</p>
            <h3 id="reservation-inventory-heading">{formatWeight(selection.selectedWeightKg)} kg reserved</h3>
          </div>
          <span>{selection.selectedItems.length} groups</span>
        </div>
        <ul>
          {selection.selectedItems.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{formatWeight(item.selectedQuantity * item.unitWeightKg)} kg | {item.selectedQuantity} {item.unit}</span>
              </div>
              <strong>{formatCurrency(item.selectedQuantity * item.unitValue)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.custodyPanel} aria-label="Pickup and custody details">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Custody route secured</strong>
          <p>Maya&apos;s Frozen Goods to {host.name}. Pickup deadline: {formatPickupDeadline(state.scenarioStartedAt)}.</p>
        </div>
      </aside>

      <section className={styles.transportSummary} aria-labelledby="transport-summary-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Transport</p>
            <h3 id="transport-summary-heading">{selectedTransport ? selectedTransport.name : "Choose transport"}</h3>
          </div>
          {selectedTransport ? <span className={styles.transportBadge}>{selectedTransport.arrivalMinutes} min arrival</span> : null}
        </div>
        {selectedTransport ? (
          <p className={styles.transportDescription}><TransportIcon transportId={selectedTransport.id} /> {selectedTransport.capacityKg} kg capacity | dispatch to {host.locality}</p>
        ) : (
          <p className={styles.transportDescription}>Select an eligible service to dispatch the rescue transfer.</p>
        )}
        <button
          ref={chooseTransportRef}
          className={styles.secondaryButton}
          type="button"
          onClick={() => setSheetOpen(true)}
        >
          {selectedTransport ? "Change transport" : "Choose transport"}
        </button>
      </section>

      <section className={styles.costSummary} aria-labelledby="cost-summary-heading">
        <div className={styles.costRow}><span>Storage reservation ({host.windowHours} hours)</span><strong>{formatCurrency(reservation.storageFee)}</strong></div>
        <div className={styles.costRow}><span>Transport fee{selectedTransport ? ` (${selectedTransport.name})` : ""}</span><strong>{formatCurrency(reservation.transportFee)}</strong></div>
        <div className={styles.totalRow}>
          <h3 id="cost-summary-heading">Total cost summary</h3>
          <strong>{formatCurrency(reservation.total)}</strong>
        </div>
      </section>

      <button
        className={styles.primaryButton}
        type="button"
        disabled={!selectedTransport}
        onClick={() => dispatch({ type: "confirm-reservation", at: Date.now() })}
      >
        <Zap aria-hidden="true" />
        Confirm rescue reservation
      </button>
      <p className={styles.reservationFinePrint}>By confirming, KapitBiz holds this storage slot and dispatches the selected transfer service.</p>

      {sheetOpen ? (
        <TransportSheet
          state={state}
          onClose={closeSheet}
          onApply={(transportId) => {
            dispatch({ type: "select-transport", transportId });
            closeSheet();
          }}
        />
      ) : null}
    </section>
  );
}
