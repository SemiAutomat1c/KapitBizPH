import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
});
