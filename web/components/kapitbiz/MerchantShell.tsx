"use client";

import { useEffect, useRef } from "react";
import type { MerchantTab } from "@/lib/kapitbiz-demo";
import { BottomNav, MerchantHeader } from "./AppChrome";
import styles from "./KapitBizRelay.module.css";

const tabLabels: Record<MerchantTab, string> = {
  home: "Merchant home",
  network: "Relay network",
  sagip: "Sagip Center",
  activity: "Business activity",
  menu: "Business menu",
  bayanihan: "Bayanihan Forum",
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
    const heading = screenRef.current?.querySelector<HTMLElement>("h2");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [activeTab]);

  return (
    <main className={styles.merchantShell}>
      <section ref={screenRef} className={styles.merchantWorkspace} aria-label={tabLabels[activeTab]}>
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
