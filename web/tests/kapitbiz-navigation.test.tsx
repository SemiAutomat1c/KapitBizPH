import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  vi.unstubAllEnvs();
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
    expect(screen.getByRole("heading", { name: "Keep every handoff clear" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Set up business" }));
    expect(screen.getByRole("heading", { name: "Set up your business" })).toBeInTheDocument();
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
      onboardingStep: "verify",
      onboardingComplete: false,
      businessSetupComplete: false,
      role: "merchant",
      activeTab: "home",
      rescueOpen: false,
      riderArrivedAt: null,
    }));
    render(<KapitBizDemoApp />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Keep every handoff clear" })).toBeInTheDocument());
  });

  it("makes every primary navigation item a working control", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    for (const [buttonName, heading] of [
      ["Home", "Good morning, Maya"],
      ["Sagip Center", "Sagip Center"],
      ["Bayanihan", "Bayanihan Forum"],
    ] as const) {
      await user.click(await screen.findByRole("button", { name: buttonName }));
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("moves tab-change focus to the active screen heading instead of the merchant workspace", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Sagip Center" }));

    const heading = screen.getByRole("heading", { name: "Sagip Center" });
    const workspace = heading.closest("section")?.parentElement;
    expect(heading).toHaveFocus();
    expect(workspace).not.toHaveFocus();
  });

  it("opens Menu and navigates Home to Sagip Center", async () => {
    seedCompletedOnboarding();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("heading", { name: "Business menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Home" }));
    await user.click(screen.getByRole("button", { name: "Tingnan ang Sagip Center" }));
    expect(screen.getByRole("heading", { name: "Sagip Center" })).toBeInTheDocument();
  });

  it("opens Business activity from notifications", async () => {
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

  it("opens Android install and iPhone add-to-home guidance from Menu", async () => {
    seedCompletedOnboarding({ activeTab: "menu" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByRole("heading", { name: "Business menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Install app" }));

    expect(screen.getByRole("dialog", { name: "Install KapitBiz Relay" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install on Android" })).toBeInTheDocument();
    expect(screen.getByText("Tap Share")).toBeInTheDocument();
    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
  });

  it("uses the Android browser install prompt when it is available", async () => {
    seedCompletedOnboarding({ activeTab: "menu" });
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = Promise.resolve({ outcome: "accepted" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    window.dispatchEvent(installEvent);
    await user.click(await screen.findByRole("button", { name: "Install app" }));
    await user.click(screen.getByRole("button", { name: "Install on Android" }));

    expect(prompt).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Install prompt accepted.")).toBeInTheDocument());
  });

  it.each([
    ["Preview Storage Host", "Storage Host preview"],
    ["Preview Rider", "Rider preview"],
  ] as const)("returns from the %s preview to Menu", async (controlName, heading) => {
    seedCompletedOnboarding({ activeTab: "menu" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: controlName }));
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Return to Merchant" }));
    expect(screen.getByRole("heading", { name: "Business menu" })).toBeInTheDocument();
  });

  it("routes controlled rescue Menu and notification actions", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    seedRescueAtCapacity();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await screen.findByRole("heading", { name: "2 matches found" });
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("heading", { name: "Business menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
  });

  it("routes notifications from an active rescue to Business activity", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    seedRescueAtCapacity();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await screen.findByRole("heading", { name: "2 matches found" });
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByRole("heading", { name: "Business activity" })).toBeInTheDocument();
  });

  it("opens the completed custody record from Business activity", async () => {
    seedCompletedOnboarding();
    createCompleteStateForTest();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Notifications" }));
    expect(screen.getByRole("heading", { name: "Business activity" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View custody record" }));
    expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
  });

  it("closes a completed rescue to Home and reopens its custody record from Business activity", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    createCompleteStateForTest();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Recovery packet preview" }));
    expect(screen.getByRole("dialog", { name: "Recovery packet preview" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close preview" }));
    await user.click(screen.getByRole("button", { name: "Close rescue" }));

    expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kapitbiz-relay-v2") ?? "{}")).toMatchObject({
      step: "complete",
      receiverConfirmedAt: expect.any(Number),
    });

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByRole("button", { name: "View custody record" }));
    expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
  });

  it("shows every seeded partner and opens host details", async () => {
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByRole("heading", { name: "Relay network" })).toBeInTheDocument();
    expect(screen.getByText("Northline Cold Storage")).toBeInTheDocument();
    expect(screen.getByText("Tagum North Cold Chain")).toBeInTheDocument();
    expect(screen.getByText("South Market Freezer")).toBeInTheDocument();
    expect(screen.getByText("Davao Regional Hub")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View Northline Cold Storage details" }));
    expect(screen.getByRole("dialog", { name: "Northline Cold Storage" })).toBeInTheDocument();
  });

  it("uses the offline network schematic without a Mapbox token", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Map" }));
    expect(screen.getByRole("region", { name: "Offline route schematic" })).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("restores focus to the offline map host trigger after close and Escape", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Map" }));
    const trigger = screen.getByRole("button", { name: "View Northline Cold Storage details" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Close Northline Cold Storage" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close Northline Cold Storage" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Northline Cold Storage" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Northline Cold Storage" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("traps forward and reverse Tab navigation in an eligible host dialog", async () => {
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    const trigger = await screen.findByRole("button", { name: "View Northline Cold Storage details" });
    await user.click(trigger);
    const closeButton = screen.getByRole("button", { name: "Close Northline Cold Storage" });
    const startRequest = screen.getByRole("button", { name: "Start rescue request" });
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(startRequest).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it("traps forward and reverse Tab navigation in an ineligible host dialog", async () => {
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "View South Market Freezer details" }));
    const closeButton = screen.getByRole("button", { name: "Close South Market Freezer" });
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it("shows both seeded transport options", async () => {
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Transport" }));
    expect(screen.getByText("Rider - Logistics Pro")).toBeInTheDocument();
    expect(screen.getByText("Refrigerated van")).toBeInTheDocument();
    expect(screen.getByText(/15 min arrival/)).toBeInTheDocument();
    expect(screen.getByText(/250 kg capacity/)).toBeInTheDocument();
  });

  it("carries the reviewed host into the rescue reservation instead of dropping it", async () => {
    seedCompletedOnboarding({ activeTab: "network" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "View Northline Cold Storage details" }));
    await user.click(screen.getByRole("button", { name: "Start rescue request" }));

    expect(screen.getByRole("heading", { name: "Confirm reservation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Northline Cold Storage" })).toBeInTheDocument();
  });
});
