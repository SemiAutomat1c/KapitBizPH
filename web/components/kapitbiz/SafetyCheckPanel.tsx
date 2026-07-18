"use client";

import { X } from "lucide-react";
import type { SafetyCheckAnswer } from "@/lib/kapitbiz-hazard-assist";
import styles from "./KapitBizRelay.module.css";

export default function SafetyCheckPanel({
  answer,
  onAnswer,
  onClose,
}: {
  answer: SafetyCheckAnswer;
  onAnswer: (answer: Exclude<SafetyCheckAnswer, "unknown">) => void;
  onClose: () => void;
}) {
  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>Simulated Safety Check</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close Safety Check" title="Close Safety Check">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>
          Is Maya&apos;s Frozen Goods safe to operate right now?
        </h2>
        <p>One operational check routes the business to the next continuity action.</p>
        <div className={styles.safetyChoices} role="group" aria-label="Safety Check answer">
          <button type="button" aria-pressed={answer === "safe"} onClick={() => onAnswer("safe")}>Safe for now</button>
          <button type="button" aria-pressed={answer === "need-help"} onClick={() => onAnswer("need-help")}>Need help</button>
          <button type="button" aria-pressed={answer === "stock-at-risk"} onClick={() => onAnswer("stock-at-risk")}>Stock at risk</button>
        </div>
      </div>
    </>
  );
}
