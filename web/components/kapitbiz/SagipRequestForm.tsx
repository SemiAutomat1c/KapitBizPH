"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { SagipCategory, SagipRequestKind } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

export const SAGIP_CATEGORY_OPTIONS: { value: SagipCategory; label: string }[] = [
  { value: "dry-ice", label: "Dry ice" },
  { value: "packaging", label: "Packaging material" },
  { value: "fuel", label: "Fuel" },
  { value: "generator-rental", label: "Generator rental" },
  { value: "raw-material", label: "Raw material" },
  { value: "other", label: "Other" },
];

export default function SagipRequestForm({
  kind,
  onSubmit,
  onClose,
}: {
  kind: SagipRequestKind;
  onSubmit: (input: { title: string; category: SagipCategory; quantity: number; unit: string; windowHours: number; calamityModeActive: boolean }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SagipCategory>("dry-ice");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("");
  const [windowHours, setWindowHours] = useState(24);
  const [calamityModeActive, setCalamityModeActive] = useState(false);
  const label = kind === "need" ? "Post a request" : "Post surplus";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!title.trim() || !unit.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    onSubmit({ title: title.trim(), category, quantity: parsedQuantity, unit: unit.trim(), windowHours, calamityModeActive });
  };

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span aria-label={label}>{kind === "need" ? "Mag-post ng Sagip" : "Mag-post ng Tulong"}</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${label}`} title={`Close ${label}`}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1} aria-label={label}>{kind === "need" ? "Mag-post ng Sagip" : "Mag-post ng Tulong"}</h2>
        <form className={styles.businessForm} onSubmit={submit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dry ice, 40kg" />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as SagipCategory)}>
              {SAGIP_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Quantity
            <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>
            Unit
            <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" />
          </label>
          <label>
            Offer window
            <select value={windowHours} onChange={(event) => setWindowHours(Number(event.target.value))}>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={calamityModeActive} onChange={(event) => setCalamityModeActive(event.target.checked)} aria-label="Calamity Mode is active for this request" />
            Calamity Mode is active for this request
          </label>
          <div className={styles.onboardingActions}>
            <button className={styles.onboardingBack} type="button" onClick={onClose}>Cancel</button>
            <button className={styles.primaryButton} type="submit" aria-label={kind === "need" ? "Post request" : "Post surplus"}>
              {kind === "need" ? "Mag-post ng Sagip" : "Mag-post ng Tulong"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
