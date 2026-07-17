import type { RelayDemoState, RelaySelection, RelayStep } from "@/lib/kapitbiz";
import { Bell, ChevronLeft, History, House, ListTodo, Menu, Network, type LucideIcon } from "lucide-react";
import Link from "next/link";
import styles from "./KapitBizRelay.module.css";

const steps: { id: RelayStep; label: string }[] = [
  { id: "incident", label: "Incident" },
  { id: "triage", label: "Triage" },
  { id: "capacity", label: "Capacity" },
  { id: "reservation", label: "Reserve" },
  { id: "handoff", label: "Handoff" },
  { id: "complete", label: "Complete" },
];

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatIncidentStart(scenarioStartedAt: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(new Date(scenarioStartedAt));
}

export function AppHeader({ step, onBack }: { step: RelayStep; onBack: () => void }) {
  const canGoBack = step !== "incident";

  return (
    <header className={styles.appHeader}>
      <div className={styles.headerTitle}>
        <span
          className={styles.staticIcon}
          aria-label="Menu unavailable in this demo"
          title="Menu unavailable in this demo"
        >
          <Menu aria-hidden="true" />
        </span>
        <h1>KapitBiz Relay</h1>
      </div>
      {canGoBack ? (
        <button className={styles.iconButton} type="button" onClick={onBack} aria-label="Go back" title="Go back">
          <ChevronLeft aria-hidden="true" />
        </button>
      ) : (
        <span
          className={styles.staticIcon}
          aria-label="Notifications unavailable in this demo"
          title="Notifications unavailable in this demo"
        >
          <Bell aria-hidden="true" />
        </span>
      )}
    </header>
  );
}

export function IncidentRail({ state, selection }: { state: RelayDemoState; selection: RelaySelection }) {
  const activeStep = steps.indexOf(steps.find((item) => item.id === state.step) ?? steps[0]);

  return (
    <aside className={styles.incidentRail} aria-label="Incident status">
      <p className={styles.eyebrow}>Active disruption</p>
      <h2>Power interruption</h2>
      <p className={styles.railCopy}>
        Simulated localized six-hour interruption at {formatIncidentStart(state.scenarioStartedAt)}.
      </p>
      <dl className={styles.railStats}>
        <div>
          <dt>Merchant</dt>
          <dd>Maya&apos;s Frozen Goods</dd>
        </div>
        <div>
          <dt>Selected value</dt>
          <dd>{formatCurrency(selection.selectedValue)}</dd>
        </div>
        <div>
          <dt>Ready to rescue</dt>
          <dd>{selection.selectedWeightKg} kg</dd>
        </div>
      </dl>
      <ol className={styles.stepList} aria-label="Rescue progress">
        {steps.map((item, index) => (
          <li key={item.id} data-active={index === activeStep} data-complete={index < activeStep}>
            {item.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function ProgressHeader({ step }: { step: RelayStep }) {
  const activeStep = steps.find((item) => item.id === step) ?? steps[0];
  return (
    <div className={styles.progressHeader} aria-label="Current rescue step">
      <span>{activeStep.label}</span>
      <span>{steps.indexOf(activeStep) + 1} of {steps.length}</span>
    </div>
  );
}

export function BottomNav() {
  const unavailableItems: { label: string; icon: LucideIcon }[] = [
    { label: "Requests", icon: ListTodo },
    { label: "Network", icon: Network },
    { label: "Activity", icon: History },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      <Link className={styles.navItem} href="/" aria-current="page">
        <House aria-hidden="true" />
        <span>Home</span>
      </Link>
      {unavailableItems.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className={`${styles.navItem} ${styles.navItemUnavailable}`}
          aria-label={`${label} unavailable in this demo`}
          title={`${label} unavailable in this demo`}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </span>
      ))}
    </nav>
  );
}
