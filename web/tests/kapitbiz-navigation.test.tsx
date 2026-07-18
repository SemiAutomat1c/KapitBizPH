import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import {
  createCompleteStateForTest,
  seedCompletedOnboarding,
  seedRescueAtCapacity,
} from "./kapitbiz-test-helpers";

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("KapitBiz complete demo navigation", () => {
  it("omits Back on the first intro and enables it on later intros", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await screen.findByRole("heading", { name: "Protect what is at risk" });
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Relay to available capacity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Protect what is at risk" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

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
    expect(screen.getByText("Maya's Frozen Goods")).toBeInTheDocument();
  });

  it("opens Maya's merchant home after completed onboarding", async () => {
    seedCompletedOnboarding();
    render(<KapitBizDemoApp />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
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

  it("makes every primary navigation item a working control", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    for (const [buttonName, heading] of [
      ["Home", "Good morning, Maya"],
      ["Requests", "Rescue requests"],
      ["Network", "Relay network"],
      ["Activity", "Business activity"],
    ] as const) {
      await user.click(await screen.findByRole("button", { name: buttonName }));
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("opens Menu and resumes the active rescue from Home", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("heading", { name: "Business menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Home" }));
    await user.click(screen.getByRole("button", { name: "Start inventory rescue" }));
    expect(screen.getByRole("heading", { name: "Localized power interruption alert" })).toBeInTheDocument();
  });

  it("opens Activity from notifications", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Notifications" }));
    expect(screen.getByRole("heading", { name: "Business activity" })).toBeInTheDocument();
  });

  it("shows Menu details and asks for reset confirmation", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Business profile" }));
    expect(screen.getByRole("dialog", { name: "Business profile" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close Business profile" }));

    await user.click(screen.getByRole("button", { name: "Demo and offline status" }));
    expect(screen.getByRole("dialog", { name: "Demo and offline status" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close Demo and offline status" }));

    await user.click(screen.getByRole("button", { name: "About this pilot" }));
    expect(screen.getByRole("dialog", { name: "About this pilot" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close About this pilot" }));

    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(screen.getByRole("dialog", { name: "Reset KapitBiz demo" })).toBeInTheDocument();
  });

  it("offers a resume action for an active rescue without changing it first", async () => {
    seedCompletedOnboarding();
    seedRescueAtCapacity();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Resume rescue" }));
    expect(screen.getByRole("heading", { name: "2 matches found" })).toBeInTheDocument();
  });

  it("closes a completed rescue to Home and reopens its custody record", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    createCompleteStateForTest();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close rescue" }));

    expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Custody Record" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kapitbiz-relay-v2") ?? "{}")).toMatchObject({
      step: "complete",
      receiverConfirmedAt: expect.any(Number),
    });

    await user.click(screen.getByRole("button", { name: "View Custody Record" }));
    expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
  });
});
