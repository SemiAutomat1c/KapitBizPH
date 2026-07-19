import { cleanup, render, screen } from "@testing-library/react";
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

describe("Sagip Center tab", () => {
  it("is reachable from the bottom nav and shows the empty state", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);

    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    expect(await screen.findByRole("heading", { name: "Sagip Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Requesting" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Offering surplus" })).toBeInTheDocument();
    expect(screen.getByText(/No open requests yet/)).toBeInTheDocument();
  });
});
