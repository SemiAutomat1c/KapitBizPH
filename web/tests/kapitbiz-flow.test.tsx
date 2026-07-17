import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";

describe("KapitBiz Relay flow", () => {
  it("opens directly to the simulated incident", () => {
    render(<KapitBizRelayApp />);
    expect(
      screen.getByRole("heading", { name: "KapitBiz Relay" }),
    ).toBeInTheDocument();
    expect(screen.getByText("₱21,800")).toBeInTheDocument();
    expect(screen.queryByText("KiloKita")).not.toBeInTheDocument();
  });
});
