import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import { createCompleteStateForTest, seedCompletedOnboarding, seedRescueAtCapacity } from "./kapitbiz-test-helpers";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  seedCompletedOnboarding();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("KapitBiz Hazard Assist UI", () => {
  it("turns the compact simulated alert into one Safety Check", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    expect(await screen.findByText("Simulated brownout + flood-risk alert")).toBeInTheDocument();
    expect(screen.getByText("Demo feed")).toBeInTheDocument();
    expect(screen.getByText("Fuel reference")).toBeInTheDocument();
    expect(screen.getByText("Neighbor capacity")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Run Safety Check" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Safety Check" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Is Maya's Frozen Goods safe to operate right now?" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("shows the exact generator and Relay comparison for stock at risk", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await user.click(screen.getByRole("button", { name: "Stock at risk" }));

    expect(screen.getByRole("dialog", { name: "Recommended continuity move" })).toBeInTheDocument();
    expect(screen.getByText("6 hours x 1.75 L/hr x PHP68/L")).toBeInTheDocument();
    expect(screen.getByText("PHP714")).toBeInTheDocument();
    expect(screen.getByText("PHP450")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended: Relay the frozen stock" })).toHaveFocus();
  });

  it("shows the honest Calamity Mode preview and marks the business safe", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await user.click(screen.getByRole("button", { name: "Stock at risk" }));
    await user.click(screen.getByRole("button", { name: "View Calamity Mode" }));
    expect(screen.getByText("Calamity Mode guardrail preview")).toBeInTheDocument();
    expect(screen.getByText(/Future live offers would be checked against official price ceilings/)).toBeInTheDocument();
    expect(screen.getByText("Demo data only.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark safe for now" }));
    expect(screen.queryByRole("dialog", { name: "Recommended continuity move" })).not.toBeInTheDocument();
    expect(screen.getByText("Safety Check recorded: safe for now.")).toBeInTheDocument();
  });

  it("opens voluntary Good Samaritan capacity and enters the existing reservation", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await user.click(screen.getByRole("button", { name: "Need help" }));

    expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
    expect(screen.getByText("120 kg temporary freezer capacity")).toBeInTheDocument();
    expect(screen.getByText("60 kg temporary freezer capacity")).toBeInTheDocument();
    expect(screen.getByText("Refrigerated pickup window")).toBeInTheDocument();
    expect(screen.getAllByText(/Verified demo partner|KYC preview/)).toHaveLength(3);
    expect(screen.getByText(/Voluntary seeded responses/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use Northline Cold Storage in Relay" }));
    expect(screen.getByRole("heading", { name: "Confirm reservation" })).toBeInTheDocument();
  });

  it("opens Good Samaritan capacity from Network", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Network" }));
    await user.click(screen.getByRole("button", { name: "Good Samaritan capacity" }));
    expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
  });

  it("opens Good Samaritan capacity directly from Home", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "View neighbor capacity" }));
    expect(screen.getByRole("dialog", { name: "Good Samaritan capacity" })).toBeInTheDocument();
    expect(screen.getByText("Prefilled help request: temporary cold storage for the selected 42 kg frozen-stock relay.")).toBeInTheDocument();
  });

  it("keeps Good Samaritan dialog actions at least 44px high", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "View neighbor capacity" }));

    const actions = screen.getAllByRole("button", { name: /Use .* in Relay/ });
    expect(actions).toHaveLength(3);
    actions.forEach((action) => {
      expect(action.className).toContain("responderAction");
    });
  });

  it("shows all three Hazard Assist context labels inside the existing Relay flow", async () => {
    seedCompletedOnboarding({ rescueOpen: true });
    seedRescueAtCapacity();
    localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
      version: 1,
      alertAcknowledged: true,
      safetyCheckAnswer: "stock-at-risk",
      generatorEstimatePhp: 714,
      relayEstimatePhp: 450,
      calamityModePreviewOpen: false,
      goodSamaritanAskedAt: 900_000,
      selectedGoodSamaritanPartnerId: "northline",
      relayStartedFromHazardAssist: true,
      recoveryPacketPreviewOpen: false,
    }));
    render(<KapitBizDemoApp />);

    expect(await screen.findByText("Started from Safety Check")).toBeInTheDocument();
    expect(screen.getByText("Simulated brownout + flood-risk alert")).toBeInTheDocument();
    expect(screen.getByText("Relay chosen over simulated generator estimate: PHP714")).toBeInTheDocument();
  });

  it("shows Hazard Assist source in Requests and the unified Activity timeline", async () => {
    localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
      version: 1,
      alertAcknowledged: true,
      safetyCheckAnswer: "stock-at-risk",
      generatorEstimatePhp: 714,
      relayEstimatePhp: 450,
      calamityModePreviewOpen: false,
      goodSamaritanAskedAt: 900_000,
      selectedGoodSamaritanPartnerId: "northline",
      relayStartedFromHazardAssist: true,
      recoveryPacketPreviewOpen: false,
    }));
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Requests" }));
    expect(screen.getByText("Started from Safety Check")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.getByText("Simulated alert received")).toBeInTheDocument();
    expect(screen.getByText("Fuel comparison generated")).toBeInTheDocument();
    expect(screen.getByText("Good Samaritan capacity opened")).toBeInTheDocument();
    expect(screen.getByText("Relay started from Safety Check")).toBeInTheDocument();
  });

  it("opens an honest recovery packet preview after confirmed handoff", async () => {
    createCompleteStateForTest();
    localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
      version: 1,
      alertAcknowledged: true,
      safetyCheckAnswer: "stock-at-risk",
      generatorEstimatePhp: 714,
      relayEstimatePhp: 450,
      calamityModePreviewOpen: false,
      goodSamaritanAskedAt: 900_000,
      selectedGoodSamaritanPartnerId: "northline",
      relayStartedFromHazardAssist: true,
      recoveryPacketPreviewOpen: false,
    }));
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Activity" }));
    await user.click(screen.getByRole("button", { name: "Recovery packet preview" }));

    expect(screen.getByRole("dialog", { name: "Recovery packet preview" })).toBeInTheDocument();
    expect(screen.getByText("Maya's Frozen Goods")).toBeInTheDocument();
    expect(screen.getByText("PHP21,800 at-risk inventory baseline")).toBeInTheDocument();
    expect(screen.getByText("Relay chosen over PHP714 generator estimate")).toBeInTheDocument();
    expect(screen.getByText(/QR custody record RE-4892-X/)).toBeInTheDocument();
    expect(screen.getByText(/not an accepted government form or guaranteed claim document/i)).toBeInTheDocument();
  });

  it("Reset demo clears demo-session, Relay, and Hazard Assist progress", async () => {
    createCompleteStateForTest();
    localStorage.setItem("kapitbiz-hazard-assist-v1", JSON.stringify({
      version: 1,
      alertAcknowledged: true,
      safetyCheckAnswer: "stock-at-risk",
      generatorEstimatePhp: 714,
      relayEstimatePhp: 450,
      calamityModePreviewOpen: true,
      goodSamaritanAskedAt: 900_000,
      selectedGoodSamaritanPartnerId: "northline",
      relayStartedFromHazardAssist: true,
      recoveryPacketPreviewOpen: true,
    }));
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(await screen.findByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    await user.click(screen.getByRole("button", { name: "Confirm reset demo" }));

    expect(await screen.findByRole("heading", { name: "Protect what is at risk" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("kapitbiz-hazard-assist-v1") ?? "null")).toMatchObject({
      safetyCheckAnswer: "unknown",
      relayStartedFromHazardAssist: false,
      recoveryPacketPreviewOpen: false,
    });
    expect(JSON.parse(localStorage.getItem("kapitbiz-relay-v2") ?? "null")).toMatchObject({
      step: "incident",
      receiverConfirmedAt: null,
      handoffId: null,
    });
  });
});
