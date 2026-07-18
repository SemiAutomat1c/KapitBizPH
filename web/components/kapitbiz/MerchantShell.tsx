"use client";

import { useEffect, useRef } from "react";
import type { MerchantTab } from "@/lib/kapitbiz-demo";
import { BottomNav, MerchantHeader } from "./AppChrome";
import styles from "./KapitBizRelay.module.css";

const tabLabels: Record<MerchantTab, string> = {
  home: "Merchant home",
  requests: "Rescue requests",
  network: "Relay network",
  activity: "Business activity",
  menu: "Business menu",
};

export default function MerchantShell({
  activeTab,
  onSelectTab,
  onOpenMenu,
  children,
}: {
  activeTab: MerchantTab;
  onSelectTab: (tab: Exclude<MerchantTab, "menu">) => void;
  onOpenMenu: () => void;
  children: React.ReactNode;
}) {
  const screenRef = useRef<HTMLElement>(null);
  const previousTabRef = useRef(activeTab);

  useEffect(() => {
    if (previousTabRef.current === activeTab) return;
    previousTabRef.current = activeTab;
    screenRef.current?.focus({ preventScroll: true });
  }, [activeTab]);

  return (
    <main className={styles.merchantShell}>
      <section ref={screenRef} className={styles.merchantWorkspace} aria-label={tabLabels[activeTab]} tabIndex={-1}>
        <MerchantHeader
          title="KapitBiz Relay"
          onMenu={onOpenMenu}
          onNotifications={() => onSelectTab("activity")}
        />
        {children}
      </section>
      <BottomNav activeTab={activeTab} onSelect={onSelectTab} />
    </main>
  );
}
