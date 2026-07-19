"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SagipRequest } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `PHP${value.toLocaleString("en-PH")}`;
}

export default function SupplierPreviewDialog({
  request,
  onClose,
}: {
  request: SagipRequest;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const parsedPrice = Number(price);
  const overCeiling = request.srpCeilingPhp !== null && Number.isFinite(parsedPrice) && parsedPrice > request.srpCeilingPhp;
  const canSubmit = price.trim() !== "" && Number.isFinite(parsedPrice) && parsedPrice > 0 && !overCeiling;

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Preview as supplier</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close Preview as supplier" title="Close Preview as supplier">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>What a supplier sees</h2>
        <p>{request.title} - {request.quantity} {request.unit} requested.</p>
        {request.calamityModeActive && request.srpCeilingPhp !== null ? (
          <p className={styles.sagipPriceCeilingNote}>Price Act ceiling: {formatCurrency(request.srpCeilingPhp)} per {request.unit}. This request is under a declared calamity.</p>
        ) : null}
        <label>
          Your price (PHP)
          <input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        {overCeiling ? <p className={styles.sagipPriceCeilingNote}>That price is above the Price Act ceiling and cannot be submitted.</p> : null}
        <button className={styles.primaryButton} type="button" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
          Submit offer
        </button>
        {submitted ? <p role="status">Preview only - no real offer was sent.</p> : null}
      </div>
    </>
  );
}
