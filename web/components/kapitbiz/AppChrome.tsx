import type { RelayDemoState, RelaySelection, RelayStep } from "@/lib/kapitbiz";
import { Bell, ChevronLeft, Handshake, History, House, ListTodo, Menu, Network, X, type LucideIcon } from "lucide-react";
import type { MerchantTab } from "@/lib/kapitbiz-demo";
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

export function AppHeader({
  step,
  onBack,
  onClose,
  onMenu,
  onNotifications,
}: {
  step: RelayStep;
  onBack: () => void;
  onClose?: () => void;
  onMenu?: () => void;
  onNotifications?: () => void;
}) {
  const canGoBack = step !== "incident";

  return (
    <header className={styles.appHeader}>
      <h1 aria-label="KapitBiz Relay" className={styles.headerLogoContainer}>
        <img src="/illustrations/kapitlogo.png" alt="KapitBizPH Logo" className={styles.headerLogo} />
      </h1>
      {canGoBack || onClose || onMenu || onNotifications ? (
        <div className={styles.headerActions}>
          {canGoBack ? (
            <button className={styles.iconButton} type="button" onClick={onBack} aria-label="Go back" title="Go back">
              <ChevronLeft aria-hidden="true" />
            </button>
          ) : null}
          {onClose ? (
            <button className={styles.iconButton} type="button" onClick={onClose} aria-label="Close rescue" title="Close rescue">
              <X aria-hidden="true" />
            </button>
          ) : null}
          {onNotifications ? (
            <button className={styles.iconButton} type="button" onClick={onNotifications} aria-label="Notifications" title="Notifications">
              <Bell aria-hidden="true" />
            </button>
          ) : null}
          {onMenu ? (
            <button className={styles.iconButton} type="button" onClick={onMenu} aria-label="Open menu" title="Open menu">
              <Menu aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function MerchantHeader({
  title,
  onMenu,
  onNotifications,
}: {
  title: string;
  onMenu: () => void;
  onNotifications: () => void;
}) {
  return (
    <header className={styles.merchantHeader}>
      {title === "KapitBiz Relay" ? (
        <h1 aria-label="KapitBiz Relay" className={styles.headerLogoContainer}>
          <img src="/illustrations/kapitlogo.png" alt="KapitBizPH Logo" className={styles.headerLogo} />
        </h1>
      ) : (
        <h1>{title}</h1>
      )}
      <div className={styles.headerActions}>
        <button className={styles.iconButton} type="button" onClick={onNotifications} aria-label="Notifications" title="Notifications">
          <Bell aria-hidden="true" />
        </button>
        <button className={styles.iconButton} type="button" onClick={onMenu} aria-label="Open menu" title="Open menu">
          <Menu aria-hidden="true" />
        </button>
      </div>
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

const navItems: { id: Exclude<MerchantTab, "menu">; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "requests", label: "Requests", icon: ListTodo },
  { id: "network", label: "Network", icon: Network },
  { id: "sagip", label: "Sagip Center", icon: Handshake },
  { id: "activity", label: "Activity", icon: History },
];

export function BottomNav({
  activeTab,
  onSelect,
}: {
  activeTab: MerchantTab;
  onSelect: (tab: Exclude<MerchantTab, "menu">) => void;
}) {
  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={styles.navItem}
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
