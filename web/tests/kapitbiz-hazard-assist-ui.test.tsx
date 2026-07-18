import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import KapitBizDemoApp from "@/components/kapitbiz/KapitBizDemoApp";
import { seedCompletedOnboarding } from "./kapitbiz-test-helpers";

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
});
