import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import { DEMO_SESSION_STORAGE_KEY } from "@/lib/kapitbiz-demo";
import {
  createCompleteStateForTest,
  seedCompletedOnboarding,
  seedRescueAtCapacity,
  seedRescueAtHandoff,
} from "./kapitbiz-test-helpers";

describe("KapitBiz role previews", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closes the rescue to Home without losing progress", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    seedRescueAtCapacity();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByRole("heading", { name: "2 matches found" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close rescue" }));
    expect(screen.getByRole("heading", { name: "Good morning, Maya" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resume rescue" }));
    expect(screen.getByRole("heading", { name: "2 matches found" })).toBeInTheDocument();
  });

  it("records Rider arrival and Host custody confirmation on the shared timeline", async () => {
    vi.spyOn(Date, "now").mockReturnValue(4_000_000);
    seedCompletedOnboarding({ role: "rider" });
    seedRescueAtHandoff();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByText("Maya's Frozen Goods")).toBeInTheDocument();
    expect(screen.getByText("Northline Cold Storage")).toBeInTheDocument();
    expect(screen.getByText("42 kg / PHP16,500")).toBeInTheDocument();
    expect(screen.getByText("PHP150 fee")).toBeInTheDocument();
    expect(screen.getByText("KB-4922")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark arrived" }));
    expect(screen.getByRole("status")).toHaveTextContent("Arrival recorded");
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEMO_SESSION_STORAGE_KEY) ?? "null")).toMatchObject({
        riderArrivedAt: 4_000_000,
      });
    });

    await user.click(screen.getByRole("button", { name: "Return to Merchant" }));
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Preview Storage Host" }));
    expect(await screen.findByText("12 hours")).toBeInTheDocument();
    expect(screen.getByText("PHP300")).toBeInTheDocument();
    expect(screen.getByText("RE-4892-X")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm inventory received" }));
    expect(screen.getByRole("status")).toHaveTextContent("Custody transfer confirmed");

    await user.click(screen.getByRole("button", { name: "Return to Merchant" }));
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Rider arrived")).toBeInTheDocument();
    expect(screen.getByText("Arrival at facility")).toBeInTheDocument();
    expect(screen.getByText("Transfer confirmed")).toBeInTheDocument();
  });

  it("shows the selected Tagum North and refrigerated van reservation in both role previews", async () => {
    seedCompletedOnboarding({ role: "rider" });
    const handoff = seedRescueAtHandoff({ hostId: "tagum-north", transportId: "van" });
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(handoff).toMatchObject({
      step: "handoff",
      selectedHostId: "tagum-north",
      selectedTransportId: "van",
    });
    expect(await screen.findByText("Tagum North Cold Chain")).toBeInTheDocument();
    expect(screen.getByText("PHP450 fee")).toBeInTheDocument();
    expect(screen.getByText("Refrigerated van")).toBeInTheDocument();
    expect(screen.getByText("30 min to pickup")).toBeInTheDocument();
    expect(screen.queryByText("Northline Cold Storage")).not.toBeInTheDocument();
    expect(screen.queryByText("PHP150 fee")).not.toBeInTheDocument();
    expect(screen.queryByText("KB-4922")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Return to Merchant" }));
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Preview Storage Host" }));
    expect(await screen.findByText("Tagum North Cold Chain")).toBeInTheDocument();
    expect(screen.getByText("30 min to pickup")).toBeInTheDocument();
    expect(screen.getByText("8 hours")).toBeInTheDocument();
    expect(screen.getByText("PHP250")).toBeInTheDocument();
    expect(screen.queryByText("Northline Cold Storage")).not.toBeInTheDocument();
  });

  it("keeps the relay unchanged when Host confirmation is attempted before QR handoff", async () => {
    seedCompletedOnboarding({ activeTab: "menu" });
    seedRescueAtCapacity();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Preview Storage Host" }));
    await user.click(screen.getByRole("button", { name: "Confirm inventory received" }));
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for QR handoff");
    expect(JSON.parse(localStorage.getItem("kapitbiz-relay-v2") ?? "null")).toMatchObject({
      step: "capacity",
      receiverConfirmedAt: null,
    });
  });

  it("resets both persisted stores only after confirmed Menu reset", async () => {
    vi.spyOn(Date, "now").mockReturnValue(9_000_000);
    seedCompletedOnboarding({ activeTab: "menu", riderArrivedAt: 4_000_000 });
    createCompleteStateForTest();
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Reset demo" }));
    await user.click(screen.getByRole("button", { name: "Confirm reset demo" }));
    expect(screen.getByRole("heading", { name: "Protect what is at risk" })).toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(DEMO_SESSION_STORAGE_KEY) ?? "null")).toMatchObject({
        onboardingComplete: false,
        businessSetupComplete: false,
        role: "merchant",
        riderArrivedAt: null,
      });
      expect(JSON.parse(localStorage.getItem("kapitbiz-relay-v2") ?? "null")).toMatchObject({
        step: "incident",
        scenarioStartedAt: 9_000_000,
        handoffId: null,
        receiverConfirmedAt: null,
      });
    });
  });
});
