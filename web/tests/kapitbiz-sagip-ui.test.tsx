import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

describe("Posting a Sagip Center request", () => {
  it("adds a new request to the Requesting list", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));

    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const dialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(dialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(dialog).getByLabelText("Quantity"));
    await user.type(within(dialog).getByLabelText("Quantity"), "40");
    await user.type(within(dialog).getByLabelText("Unit"), "kg");
    await user.click(within(dialog).getByRole("button", { name: "Post request" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Post a request" })).not.toBeInTheDocument());
    expect(screen.getByText("Dry ice, 40kg")).toBeInTheDocument();
  });
});
