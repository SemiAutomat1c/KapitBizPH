"use client";

import { useKapitBizDemoSession } from "@/lib/kapitbiz-demo";
import KapitBizRelayApp from "./KapitBizRelayApp";
import OnboardingFlow from "./OnboardingFlow";
import styles from "./KapitBizRelay.module.css";

export default function KapitBizDemoApp() {
  const { session, hydrated, dispatch } = useKapitBizDemoSession();

  if (!hydrated) {
    return (
      <main className={styles.restoreShell}>
        <p role="status">Restoring KapitBiz Relay...</p>
      </main>
    );
  }

  if (!session.onboardingComplete) {
    return <OnboardingFlow session={session} dispatch={dispatch} />;
  }

  if (session.role !== "merchant") {
    return (
      <main className={styles.restoreShell}>
        <p role="status">Preparing your KapitBiz Relay role...</p>
      </main>
    );
  }

  return (
    <>
      <header className={styles.merchantWelcome}>
        <div>
          <p>Merchant home</p>
          <h1>Good morning, Maya</h1>
        </div>
        <strong>Maya&apos;s Frozen Goods</strong>
      </header>
      <KapitBizRelayApp />
    </>
  );
}
