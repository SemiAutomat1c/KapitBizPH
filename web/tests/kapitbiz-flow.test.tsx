import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";
import { createSeedState } from "@/lib/kapitbiz";

describe("KapitBiz Relay flow", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("opens directly to the simulated incident", () => {
    render(<KapitBizRelayApp />);
    expect(
      screen.getByRole("heading", { name: "KapitBiz Relay" }),
    ).toBeInTheDocument();
    expect(screen.getByText("₱21,800")).toBeInTheDocument();
    expect(screen.queryByText("KiloKita")).not.toBeInTheDocument();
  });

  it("keeps the incident start time derived from persisted state", async () => {
    const scenarioStartedAt = Date.parse("2026-07-18T03:25:00.000Z");
    window.localStorage.setItem(
      "kapitbiz-relay-v2",
      JSON.stringify(createSeedState(scenarioStartedAt)),
    );

    const firstVisit = render(<KapitBizRelayApp />);

    await waitFor(() => {
      expect(screen.getByText("Started").nextElementSibling).toHaveTextContent(
        "11:25 AM",
      );
    });

    firstVisit.unmount();
    render(<KapitBizRelayApp />);

    await waitFor(() => {
      expect(screen.getByText("Started").nextElementSibling).toHaveTextContent(
        "11:25 AM",
      );
    });
  });

  it("exposes only functional navigation as controls", () => {
    render(<KapitBizRelayApp />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByRole("button", { name: "Open menu" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Notifications" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Requests" }),
    ).not.toBeInTheDocument();
  });

  it("triages selected inventory and keeps quantities within stock bounds", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Inventory triage" }),
    ).toBeInTheDocument();
    expect(screen.getByText("42 kg | ₱16,500")).toBeInTheDocument();
    expect(screen.getByText("11 of 18 tubs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /increase processed meat quantity/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
    expect(screen.getByText("37 kg | ₱12,100")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
    expect(screen.getByText("42 kg | ₱16,500")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /decrease ice cream quantity/i }),
    );
    expect(screen.getByText("10 of 18 tubs")).toBeInTheDocument();
    expect(screen.getByText("41.55 kg | ₱16,100")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find rescue capacity/i }),
    ).toBeEnabled();
  });

  it("resumes edited inventory triage after remounting", async () => {
    const user = userEvent.setup();
    const firstVisit = render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /decrease ice cream quantity/i }),
    );

    await waitFor(() => {
      const persisted = window.localStorage.getItem("kapitbiz-relay-v2");
      expect(persisted).not.toBeNull();
      expect(JSON.parse(persisted as string)).toMatchObject({
        step: "triage",
        inventory: expect.arrayContaining([
          expect.objectContaining({ id: "ice-cream", selectedQuantity: 10 }),
        ]),
      });
    });

    firstVisit.unmount();
    render(<KapitBizRelayApp />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Inventory triage" }),
      ).toBeInTheDocument();
      expect(screen.getByText("10 of 18 tubs")).toBeInTheDocument();
      expect(screen.getByText("41.55 kg | ₱16,100")).toBeInTheDocument();
    });
  });

  it("gives each quantity control and value item-specific context", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );

    for (const itemName of ["Ice cream", "Frozen chicken", "Processed meat"]) {
      expect(
        screen.getByRole("group", { name: `${itemName} quantity` }),
      ).toBeInTheDocument();
    }

    expect(
      screen.getByRole("button", { name: "Decrease Ice cream quantity" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Increase Ice cream quantity" }),
    ).toBeEnabled();
    const iceCreamOutput = screen.getByLabelText(
      "Ice cream selected quantity: 11 tubs",
    );
    expect(iceCreamOutput).toHaveTextContent("11");
    expect(iceCreamOutput).not.toHaveAttribute("aria-live");
    expect(screen.getByRole("status", { name: "Selected for rescue" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("requires inventory before continuing to rescue capacity", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );
    await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /frozen chicken/i }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: /processed meat/i }),
    );

    const capacityButton = screen.getByRole("button", {
      name: /find rescue capacity/i,
    });
    expect(capacityButton).toBeDisabled();
    expect(
      screen.getByText("Select at least one inventory group to continue."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /ice cream/i }));
    expect(capacityButton).toBeEnabled();
    await user.click(capacityButton);
    expect(screen.getByLabelText("Current rescue step")).toHaveTextContent(
      "Capacity",
    );
  });
});
