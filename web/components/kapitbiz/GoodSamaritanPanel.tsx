"use client";

import { X } from "lucide-react";
import { GOOD_SAMARITAN_RESPONDERS } from "@/lib/kapitbiz-hazard-assist";
import styles from "./KapitBizRelay.module.css";

export default function GoodSamaritanPanel({
  selectedPartnerId,
  onUsePartner,
  onClose,
}: {
  selectedPartnerId: string | null;
  onUsePartner: (partnerId: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Simulated community capacity</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close Good Samaritan capacity" title="Close Good Samaritan capacity">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>Voluntary Good Samaritan capacity</h2>
        <p className={styles.goodSamaritanRequest}>Prefilled help request: temporary cold storage for the selected 42 kg frozen-stock relay.</p>
        <p className={styles.goodSamaritanDisclosure}>
          Voluntary seeded responses from demo network members. Availability is simulated and rescue is not guaranteed.
        </p>
        <ul className={styles.responderList} aria-label="Voluntary Good Samaritan responders">
          {GOOD_SAMARITAN_RESPONDERS.map((responder) => (
            <li className={styles.responderRow} data-selected={responder.partnerId === selectedPartnerId} key={responder.id}>
              <div>
                <h3>{responder.partnerName}</h3>
                <p>{responder.offer}</p>
                <small>Simulated availability: {responder.availability}</small>
              </div>
              <div className={styles.responderTrust}>
                <span>{responder.trustLabel}</span>
                <button className={styles.responderAction} type="button" onClick={() => onUsePartner(responder.partnerId)}>
                  Use {responder.partnerName} in Relay
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
