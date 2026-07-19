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

describe("Sagip Center offer board", () => {
  it("shows offers sorted lowest price first for a need request", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    const prices = (await within(board).findAllByTestId("sagip-offer-price", {}, { timeout: 6_000 }))
      .map((node) => Number(node.textContent?.replace(/\D/g, "")));
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });
});

describe("Sagip Center multi-accept", () => {
  it("accepting an offer updates the fulfilled-meter and disables Accept once demand is met", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 1kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "1");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 1kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 1kg" });
    expect(within(board).getByText("0 of 1 kg secured")).toBeInTheDocument();

    let acceptButtons: HTMLElement[] = [];
    await waitFor(() => {
      acceptButtons = within(board).getAllByRole("button", { name: "Accept" });
      expect(acceptButtons.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 10_000 });
    const [firstAccept, secondAccept] = acceptButtons;
    expect(secondAccept).not.toBe(firstAccept);
    await user.click(firstAccept);
    expect(await within(board).findByText("1 of 1 kg secured")).toBeInTheDocument();

    expect(secondAccept).toBeDisabled();
  }, 15_000);
});

describe("Sagip Center negotiate", () => {
  it("lets the requester submit a cash counter-offer", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    let negotiateButtons: HTMLElement[] = [];
    await waitFor(() => {
      negotiateButtons = within(board).getAllByRole("button", { name: "Negotiate" });
      expect(negotiateButtons.length).toBeGreaterThan(0);
    }, { timeout: 10_000 });
    await user.click(negotiateButtons[0]);
    const priceInput = within(board).getAllByLabelText("Counter price (PHP)")[0];
    await user.clear(priceInput);
    await user.type(priceInput, "30");
    await user.click(within(board).getAllByRole("button", { name: "Send counter-offer" })[0]);

    expect(await within(board).findByText(/negotiating/)).toBeInTheDocument();
  }, 15_000);

  it("closes a counter-offer form when its offer is accepted", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    let negotiateButtons: HTMLElement[] = [];
    await waitFor(() => {
      negotiateButtons = within(board).getAllByRole("button", { name: "Negotiate" });
      expect(negotiateButtons.length).toBeGreaterThan(0);
    }, { timeout: 10_000 });

    const offerRow = negotiateButtons[0].closest("li");
    expect(offerRow).not.toBeNull();
    await user.click(negotiateButtons[0]);
    expect(within(offerRow!).getByLabelText("Counter price (PHP)")).toBeInTheDocument();

    await user.click(within(offerRow!).getByRole("button", { name: "Accept" }));

    await waitFor(() => expect(within(offerRow!).getByText(/accepted/)).toBeInTheDocument());
    expect(within(offerRow!).queryByLabelText("Counter price (PHP)")).not.toBeInTheDocument();
    expect(within(offerRow!).queryByRole("button", { name: "Send counter-offer" })).not.toBeInTheDocument();
    expect(within(offerRow!).queryByText(/negotiating/)).not.toBeInTheDocument();
  }, 15_000);
});

describe("Sagip Center barter", () => {
  it("lets the requester propose a barter counter with a declared value", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    let barterButtons: HTMLElement[] = [];
    await waitFor(() => {
      barterButtons = within(board).getAllByRole("button", { name: "Propose barter" });
      expect(barterButtons.length).toBeGreaterThan(0);
    }, { timeout: 10_000 });
    await user.click(barterButtons[0]);
    await user.type(within(board).getAllByLabelText("Goods offered")[0], "10 sacks of rice");
    await user.type(within(board).getAllByLabelText("Declared value (PHP)")[0], "900");
    await user.click(within(board).getAllByRole("button", { name: "Send barter proposal" })[0]);

    expect(await within(board).findByText(/Barter: 10 sacks of rice/)).toBeInTheDocument();
  }, 15_000);
});

describe("Supplier preview and Calamity Mode price ceiling", () => {
  it("blocks a supplier price above the SRP ceiling when Calamity Mode is active", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Post a request" }));
    const postDialog = screen.getByRole("dialog", { name: "Post a request" });
    await user.type(within(postDialog).getByLabelText("Title"), "Dry ice, 40kg");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "dry-ice");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "40");
    await user.type(within(postDialog).getByLabelText("Unit"), "kg");
    await user.click(within(postDialog).getByLabelText("Calamity Mode is active for this request"));
    await user.click(within(postDialog).getByRole("button", { name: "Post request" }));

    await user.click(await screen.findByText("Dry ice, 40kg"));
    const board = await screen.findByRole("dialog", { name: "Dry ice, 40kg" });
    await user.click(within(board).getByRole("button", { name: "Preview as supplier" }));
    const preview = await screen.findByRole("dialog", { name: "Preview as supplier" });

    expect(within(preview).getByText(/Price Act ceiling: PHP55/)).toBeInTheDocument();
    const priceInput = within(preview).getByLabelText("Your price (PHP)");
    await user.type(priceInput, "80");
    const submit = within(preview).getByRole("button", { name: "Submit offer" });
    expect(submit).toBeDisabled();
  });
});

describe("KYC status", () => {
  it("shows a Verified badge on the business profile", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Business profile" }));
    const dialog = screen.getByRole("dialog", { name: "Business profile" });
    expect(within(dialog).getByText("Verified")).toBeInTheDocument();
  });
});

describe("Nearby Tulong (surplus segment)", () => {
  it("posts surplus, receives Buyer-labeled offers, and sorts highest price first", async () => {
    const user = userEvent.setup();
    render(<KapitBizDemoApp />);
    await user.click(screen.getByRole("button", { name: "Sagip Center" }));
    await user.click(screen.getByRole("button", { name: "Offering surplus" }));
    await user.click(screen.getByRole("button", { name: "Post surplus" }));
    const postDialog = screen.getByRole("dialog", { name: "Post surplus" });
    await user.type(within(postDialog).getByLabelText("Title"), "50 sacks of flour nearing expiration");
    await user.selectOptions(within(postDialog).getByLabelText("Category"), "raw-material");
    await user.clear(within(postDialog).getByLabelText("Quantity"));
    await user.type(within(postDialog).getByLabelText("Quantity"), "50");
    await user.type(within(postDialog).getByLabelText("Unit"), "sacks");
    await user.click(within(postDialog).getByRole("button", { name: "Post surplus" }));

    await user.click(await screen.findByText("50 sacks of flour nearing expiration"));
    const board = await screen.findByRole("dialog", { name: "50 sacks of flour nearing expiration" });
    await waitFor(() => {
      expect(within(board).getAllByTestId("sagip-offer-price")).toHaveLength(2);
      expect(within(board).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    }, { timeout: 10_000 });

    const offers = within(board).getAllByTestId("sagip-offer-price");
    const buyerNames = within(board).getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(buyerNames.every((name) => name?.startsWith("Buyer "))).toBe(true);

    const prices = offers.map((node) => Number(node.textContent?.replace(/\D/g, "")));
    const sortedDescending = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sortedDescending);
  }, 12_000);
});
