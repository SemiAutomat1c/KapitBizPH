"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import {
  QrCode,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type {
  DemoRole,
  DemoSessionAction,
  KapitBizDemoSession,
  OnboardingStep,
} from "@/lib/kapitbiz-demo";
import styles from "./KapitBizRelay.module.css";

const nextStep: Record<OnboardingStep, OnboardingStep | null> = {
  protect: "relay",
  relay: "verify",
  verify: "role",
  role: "business",
  business: null,
};

const onboardingSteps: OnboardingStep[] = ["protect", "relay", "verify", "role", "business"];

const previousStep: Record<OnboardingStep, OnboardingStep | null> = {
  protect: null,
  relay: "protect",
  verify: "relay",
  role: "verify",
  business: "role",
};

const introductions: Record<Exclude<OnboardingStep, "role" | "business">, {
  title: string;
  body: string;
  actionLabel: string;
}> = {
  protect: {
    title: "Protect what is at risk",
    body: "Start a guided rescue for your at-risk stock when an interruption threatens your business.",
    actionLabel: "Next",
  },
  relay: {
    title: "Relay to available capacity",
    body: "Find vetted nearby freezer, storage, and delivery capacity before the rescue window closes.",
    actionLabel: "Next",
  },
  verify: {
    title: "Keep every handoff clear",
    body: "Use a simple QR-backed record to make the transfer visible from reservation through receipt.",
    actionLabel: "Choose a role",
  },
};

const roles: { role: DemoRole; label: string; description: string; icon: LucideIcon }[] = [
  { role: "merchant", label: "Merchant", description: "Protect your stock and request capacity.", icon: Store },
  { role: "host", label: "Capacity Host", description: "Offer verified freezer or storage space.", icon: Warehouse },
  { role: "rider", label: "Rider", description: "Move a confirmed rescue safely and quickly.", icon: Truck },
];

function OnboardingProgress({ step }: { step: OnboardingStep }) {
  const activeIndex = onboardingSteps.indexOf(step);

  return (
    <div className={styles.onboardingProgress} aria-label="Onboarding progress">
      {onboardingSteps.map((item, index) => (
        <span key={item} data-active={index === activeIndex} data-complete={index < activeIndex} />
      ))}
    </div>
  );
}

function OnboardingVisual({ step }: { step: Exclude<OnboardingStep, "role" | "business"> }) {
  const panels: { step: Exclude<OnboardingStep, "role" | "business">; icon: LucideIcon }[] = [
    { step: "protect", icon: ShieldCheck },
    { step: "relay", icon: Warehouse },
    { step: "verify", icon: QrCode },
  ];

  return (
    <div className={styles.onboardingVisualPanels} aria-hidden="true">
      {panels.map(({ step: panelStep, icon: Icon }) => (
        <span key={panelStep} className={styles.onboardingVisualPanel} data-active={panelStep === step}>
          <Icon />
        </span>
      ))}
    </div>
  );
}

export default function OnboardingFlow({
  session,
  dispatch,
}: {
  session: KapitBizDemoSession;
  dispatch: Dispatch<DemoSessionAction>;
}) {
  const [businessName, setBusinessName] = useState("Maya's Frozen Goods");
  const [location, setLocation] = useState("Tagum City");
  const [businessType, setBusinessType] = useState("Frozen goods");
  const [ownerName, setOwnerName] = useState("Maya Dela Cruz");

  const moveTo = (step: OnboardingStep) => dispatch({ type: "set-onboarding-step", step });
  const step = session.onboardingStep;

  const selectRole = (role: DemoRole) => {
    dispatch({ type: "select-role", role });
    if (role === "merchant") {
      moveTo("business");
      return;
    }
    dispatch({ type: "complete-onboarding" });
  };

  const submitBusiness = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "complete-onboarding" });
  };

  if (step === "role") {
    return (
      <main className={styles.onboardingShell}>
        <section className={styles.onboardingContent} aria-labelledby="onboarding-role-heading">
          <OnboardingProgress step={step} />
          <p className={styles.onboardingEyebrow}>KapitBiz Relay demo</p>
          <h1 id="onboarding-role-heading">Choose your demo role</h1>
          <p className={styles.onboardingCopy}>Pick the part of the rescue network you want to explore first.</p>
          <div className={styles.roleChoices}>
            {roles.map(({ role, label, description, icon: Icon }) => (
              <button
                key={role}
                aria-label={`Continue as ${label}`}
                className={styles.roleButton}
                type="button"
                onClick={() => selectRole(role)}
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.onboardingActions}>
            <button className={styles.onboardingBack} type="button" onClick={() => moveTo("verify")}>Back</button>
          </div>
        </section>
      </main>
    );
  }

  if (step === "business") {
    return (
      <main className={styles.onboardingShell}>
        <section className={styles.onboardingContent} aria-labelledby="business-setup-heading">
          <OnboardingProgress step={step} />
          <div className={styles.onboardingVisual}>
            <Snowflake aria-hidden="true" />
          </div>
          <p className={styles.onboardingEyebrow}>Merchant setup</p>
          <h1 id="business-setup-heading">Set up your business</h1>
          <p className={styles.onboardingCopy}>These editable demo details identify the merchant in the rescue flow.</p>
          <form className={styles.businessForm} onSubmit={submitBusiness}>
            <label>
              Business name
              <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
            </label>
            <label>
              Location
              <input value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label>
              Business type
              <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} />
            </label>
            <label>
              Owner name
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
            </label>
            <div className={styles.onboardingActions}>
              <button className={styles.onboardingBack} type="button" onClick={() => moveTo("role")}>Back</button>
              <button className={styles.primaryButton} type="submit">Enter KapitBiz Relay</button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  const intro = introductions[step];
  const backStep = previousStep[step];

  return (
    <main className={styles.onboardingShell}>
      <section className={styles.onboardingContent} aria-labelledby={`onboarding-${step}-heading`}>
        <OnboardingProgress step={step} />
        <OnboardingVisual step={step} />
        <p className={styles.onboardingEyebrow}>KapitBiz Relay demo</p>
        <h1 id={`onboarding-${step}-heading`}>{intro.title}</h1>
        <p className={styles.onboardingCopy}>{intro.body}</p>
        <div className={styles.onboardingActions}>
          {backStep ? (
            <button className={styles.onboardingBack} type="button" onClick={() => moveTo(backStep)}>
              Back
            </button>
          ) : null}
          <button className={styles.onboardingSkip} type="button" onClick={() => moveTo("role")}>Skip</button>
          <button className={styles.primaryButton} type="button" onClick={() => moveTo(nextStep[step] as OnboardingStep)}>
            {intro.actionLabel}
          </button>
        </div>
      </section>
    </main>
  );
}
