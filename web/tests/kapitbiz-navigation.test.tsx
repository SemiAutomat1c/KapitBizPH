import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import { seedCompletedOnboarding } from "./kapitbiz-test-helpers";

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("KapitBiz complete demo navigation", () => {
  it("completes onboarding and opens Maya's merchant home", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await screen.findByRole("heading", { name: "Protect what is at risk" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Relay to available capacity" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Choose a role" }));
    await user.click(screen.getByRole("button", { name: "Continue as Merchant" }));
    await user.click(screen.getByRole("button", { name: "Enter KapitBiz Relay" }));

    const merchantGreeting = screen.getByRole("heading", { name: "Good morning, Maya" });
    expect(merchantGreeting).toBeInTheDocument();
    expect(within(merchantGreeting.closest("header")!).getByText("Maya's Frozen Goods")).toBeInTheDocument();
  });

  it("opens the existing merchant rescue experience after completed onboarding", async () => {
    seedCompletedOnboarding();
    render(<KapitBizDemoApp />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Localized power interruption alert" })).toBeInTheDocument();
    });
  });

  it("resumes the saved onboarding step after remount", async () => {
    localStorage.setItem("kapitbiz-demo-session-v1", JSON.stringify({
      version: 1,
      onboardingStep: "role",
      onboardingComplete: false,
      businessSetupComplete: false,
      role: "merchant",
      activeTab: "home",
      rescueOpen: false,
      riderArrivedAt: null,
    }));
    render(<KapitBizDemoApp />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Choose your demo role" })).toBeInTheDocument());
  });
});
