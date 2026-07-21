"use client";

import { useState, type Dispatch, type FormEvent } from "react";
import type {
  DemoSessionAction,
  KapitBizDemoSession,
  OnboardingStep,
} from "@/lib/kapitbiz-demo";
import {
  BusinessIllustration,
  ProtectIllustration,
  RelayIllustration,
  VerifyIllustration,
} from "./illustrations";
import styles from "./KapitBizRelay.module.css";

const nextStep: Record<OnboardingStep, OnboardingStep | null> = {
  protect: "relay",
  relay: "verify",
  verify: "business",
  business: null,
};

const onboardingSteps: OnboardingStep[] = ["protect", "relay", "verify", "business"];

const previousStep: Record<OnboardingStep, OnboardingStep | null> = {
  protect: null,
  relay: "protect",
  verify: "relay",
  business: "verify",
};

const introductions: Record<Exclude<OnboardingStep, "business">, {
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
    actionLabel: "Set up business",
  },
};

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

const introVisuals: Record<Exclude<OnboardingStep, "business">, () => React.JSX.Element> = {
  protect: ProtectIllustration,
  relay: RelayIllustration,
  verify: VerifyIllustration,
};

function OnboardingVisual({ step }: { step: Exclude<OnboardingStep, "business"> }) {
  const Illustration = introVisuals[step];
  return (
    <div className={styles.onboardingHero} aria-hidden="true">
      <Illustration />
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

  const submitBusiness = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "complete-onboarding", businessName });
  };

  if (step === "business") {
    return (
      <main className={styles.onboardingShell}>
        <section className={styles.onboardingContent} aria-labelledby="business-setup-heading">
          <OnboardingProgress step={step} />
          <div className={styles.onboardingHero} aria-hidden="true">
            <BusinessIllustration />
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
              <button className={styles.onboardingBack} type="button" onClick={() => moveTo("verify")}>Back</button>
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
          <button className={styles.onboardingSkip} type="button" onClick={() => moveTo("business")}>Skip</button>
          <button className={styles.primaryButton} type="button" onClick={() => moveTo(nextStep[step] as OnboardingStep)}>
            {intro.actionLabel}
          </button>
        </div>
      </section>
    </main>
  );
}
