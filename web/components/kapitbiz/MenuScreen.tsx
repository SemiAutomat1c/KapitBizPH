"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoRole } from "@/lib/kapitbiz-demo";
import { Building2, CloudOff, Download, Info, RotateCcw, Smartphone, Truck, Warehouse, X } from "lucide-react";
import styles from "./KapitBizRelay.module.css";

type Detail = "profile" | "status" | "about";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const detailCopy: Record<Detail, { title: string; body: string }> = {
  profile: {
    title: "Business profile",
    body: "Maya's Frozen Goods is configured in Tagum City for frozen goods. Maya Dela Cruz is the merchant contact in this seeded demo.",
  },
  status: {
    title: "Demo and offline status",
    body: "This is a frontend-only seeded pilot. Rescue data persists in this browser, and the capacity map retains its offline schematic fallback.",
  },
  about: {
    title: "About this pilot",
    body: "KapitBiz Relay demonstrates a local, traceable handoff of at-risk perishable inventory during a simulated disruption. It does not claim live utility, capacity, payment, or approval data.",
  },
};

function DetailDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.dialogBackdrop}>
      <section className={styles.menuDialog} role="dialog" aria-modal="true" aria-labelledby="menu-dialog-heading">
        <div className={styles.dialogHeader}>
          <h2 id="menu-dialog-heading">{title}</h2>
          <button ref={closeRef} className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${title}`} title={`Close ${title}`}>
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function MenuScreen({
  onPreviewRole,
  onResetDemo,
}: {
  onPreviewRole: (role: Exclude<DemoRole, "merchant">) => void;
  onResetDemo: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState("Android prompt appears in supported Chrome browsers.");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallStatus("Android install prompt ready.");
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallStatus("KapitBiz Relay installed.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const closeDialog = () => {
    setDetail(null);
    setResetOpen(false);
    setInstallOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const openDetail = (nextDetail: Detail, target: HTMLButtonElement) => {
    triggerRef.current = target;
    setDetail(nextDetail);
  };
  const openReset = (target: HTMLButtonElement) => {
    triggerRef.current = target;
    setResetOpen(true);
  };
  const openInstall = (target: HTMLButtonElement) => {
    triggerRef.current = target;
    setInstallOpen(true);
  };
  const installAndroid = async () => {
    if (!installPrompt) {
      setInstallStatus("If no prompt appears, use Chrome menu > Add to Home screen.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallStatus(choice.outcome === "accepted" ? "Install prompt accepted." : "Install prompt dismissed.");
  };

  return (
    <section className={styles.menuScreen} aria-labelledby="business-menu-heading">
      <div className={styles.menuIntro}>
        <p className={styles.eyebrow}>Business controls</p>
        <h2 id="business-menu-heading">Business menu</h2>
      </div>
      <div className={styles.menuActions}>
        <button type="button" aria-label="Business profile" onClick={(event) => openDetail("profile", event.currentTarget)}>
          <Building2 aria-hidden="true" />
          <span><strong>Business profile</strong><small>Maya&apos;s Frozen Goods</small></span>
        </button>
        <button type="button" aria-label="Preview Storage Host" onClick={() => onPreviewRole("host")}>
          <Warehouse aria-hidden="true" />
          <span><strong>Preview Storage Host</strong><small>Open the seeded host role</small></span>
        </button>
        <button type="button" aria-label="Preview Rider" onClick={() => onPreviewRole("rider")}>
          <Truck aria-hidden="true" />
          <span><strong>Preview Rider</strong><small>Open the seeded rider role</small></span>
        </button>
        <button type="button" aria-label="Install app" onClick={(event) => openInstall(event.currentTarget)}>
          <Smartphone aria-hidden="true" />
          <span><strong>Install app</strong><small>Android install and iPhone home-screen guide</small></span>
        </button>
        <button type="button" aria-label="Demo and offline status" onClick={(event) => openDetail("status", event.currentTarget)}>
          <CloudOff aria-hidden="true" />
          <span><strong>Demo and offline status</strong><small>Seeded browser data and offline map fallback</small></span>
        </button>
        <button type="button" aria-label="About this pilot" onClick={(event) => openDetail("about", event.currentTarget)}>
          <Info aria-hidden="true" />
          <span><strong>About this pilot</strong><small>Scope and simulated-data details</small></span>
        </button>
        <button className={styles.menuDangerAction} type="button" aria-label="Reset demo" onClick={(event) => openReset(event.currentTarget)}>
          <RotateCcw aria-hidden="true" />
          <span><strong>Reset demo</strong><small>Clear this browser&apos;s session and rescue data</small></span>
        </button>
      </div>

      {detail ? (
        <DetailDialog title={detailCopy[detail].title} onClose={closeDialog}>
          {detail === "profile" ? <span className={styles.kycBadge} data-status="verified">Verified</span> : null}
          <p>{detailCopy[detail].body}</p>
        </DetailDialog>
      ) : null}
      {resetOpen ? (
        <DetailDialog title="Reset KapitBiz demo" onClose={closeDialog}>
          <p>This clears the saved session and rescue transaction, then starts a newly timed incident.</p>
          <div className={styles.dialogActions}>
            <button className={styles.secondaryButton} type="button" onClick={closeDialog}>Cancel</button>
            <button className={styles.dangerButton} type="button" onClick={onResetDemo}>Confirm reset demo</button>
          </div>
        </DetailDialog>
      ) : null}
      {installOpen ? (
        <DetailDialog title="Install KapitBiz Relay" onClose={closeDialog}>
          <div className={styles.installGrid}>
            <section className={styles.installCard} aria-labelledby="android-install-heading">
              <h3 id="android-install-heading">Android</h3>
              <p>Install from Chrome for a home-screen app with offline demo files.</p>
              <button className={styles.primaryButton} type="button" onClick={installAndroid}>
                <Download aria-hidden="true" />
                Install on Android
              </button>
              <p className={styles.installStatus} role="status">{installStatus}</p>
            </section>
            <section className={styles.installCard} aria-labelledby="iphone-install-heading">
              <h3 id="iphone-install-heading">iPhone</h3>
              <ol className={styles.installSteps}>
                <li>Open this page in Safari</li>
                <li>Tap Share</li>
                <li>Add to Home Screen</li>
                <li>Tap Add</li>
              </ol>
            </section>
          </div>
        </DetailDialog>
      ) : null}
    </section>
  );
}
