"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./KapitBizRelay.module.css";

interface HazardAssistDialogProps {
  label: string;
  focusKey: string;
  onClose: () => void;
  children: ReactNode;
}

export default function HazardAssistDialog({ label, focusKey, onClose, children }: HazardAssistDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef.current;
    return () => {
      trigger?.focus();
      window.requestAnimationFrame(() => trigger?.focus());
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("[data-hazard-initial-focus]")?.focus();
  }, [focusKey]);

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
      <section
        ref={dialogRef}
        className={styles.hazardDialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {children}
      </section>
    </div>
  );
}
