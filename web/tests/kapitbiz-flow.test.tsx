import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";
import { createSeedState, relayReducer } from "@/lib/kapitbiz";

const mapboxTestDouble = vi.hoisted(() => {
  class Map {
    on(event: string, callback: () => void) {
      if (event === "load") queueMicrotask(callback);
      return this;
    }

    addSource() {}
    addLayer() {}
    remove() {}
  }

  class Marker {
    setLngLat() { return this; }
    setPopup() { return this; }
    addTo() { return this; }
  }

  class Popup {
    setText() { return this; }
  }

  return { mapbox: { accessToken: "", Map, Marker, Popup } };
});

const qrcodeTestDouble = vi.hoisted(() => ({ toDataURL: vi.fn() }));

vi.mock("mapbox-gl", () => ({ default: mapboxTestDouble.mapbox }));
vi.mock("qrcode", () => ({ default: qrcodeTestDouble }));

function createCompleteState() {
  let completeState = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
  completeState = relayReducer(completeState, { type: "go-to", step: "capacity" });
  completeState = relayReducer(completeState, { type: "select-host", hostId: "northline" });
  completeState = relayReducer(completeState, { type: "go-to", step: "reservation" });
  completeState = relayReducer(completeState, { type: "select-transport", transportId: "rider" });
  completeState = relayReducer(completeState, { type: "confirm-reservation", at: 1_000_100 });
  return relayReducer(completeState, { type: "confirm-receiver", at: 1_000_200 });
}

describe("KapitBiz Relay flow", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    qrcodeTestDouble.toDataURL.mockResolvedValue("data:image/png;base64,kapitbiz-test-qr");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    qrcodeTestDouble.toDataURL.mockReset();
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

  it("shows complete ranked capacity matches in the usable list view", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /find rescue capacity/i }),
    );

    expect(screen.getByText("Northline Cold Storage")).toBeInTheDocument();
    expect(screen.getByText("28 km away")).toBeInTheDocument();
    expect(screen.getByText("38 min transfer")).toBeInTheDocument();
    expect(screen.getByText("Only 20 kg free")).toBeInTheDocument();
    expect(screen.getByText("Capacity gap")).toBeInTheDocument();
    expect(screen.getByText("Long route")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /select northline cold storage/i }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /select south market freezer/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps eligible host selection available in the offline map schematic", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /find rescue capacity/i }),
    );
    await user.click(screen.getByRole("button", { name: "Map" }));

    expect(screen.getByText(/offline route schematic/i)).toBeInTheDocument();
    const selectNorthline = screen.getByRole("button", {
      name: /select northline cold storage/i,
    });
    expect(selectNorthline).toBeEnabled();

    await user.click(selectNorthline);
    expect(screen.getByLabelText("Current rescue step")).toHaveTextContent(
      "Reserve",
    );
  });

  it("keeps eligible host selection available in configured Mapbox presentation", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "test-public-token");
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(
      screen.getByRole("button", { name: /start inventory rescue/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /find rescue capacity/i }),
    );
    await user.click(screen.getByRole("button", { name: "Map" }));

    const mapPresentation = screen.getByRole("region", {
      name: "Seeded Mapbox capacity map",
    });
    expect(
      within(mapPresentation).queryByRole("button", {
        name: /select south market freezer/i,
      }),
    ).not.toBeInTheDocument();
    const selectNorthline = within(mapPresentation).getByRole("button", {
      name: /select northline cold storage/i,
    });
    expect(
      within(mapPresentation).getByRole("button", {
        name: /select tagum north cold chain/i,
      }),
    ).toBeEnabled();

    await user.click(selectNorthline);
    expect(screen.getByLabelText("Current rescue step")).toHaveTextContent(
      "Reserve",
    );
  });

  it("reserves Northline capacity and confirms an eligible rider dispatch", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));

    const reservation = screen.getByRole("region", { name: /confirm reservation/i });
    expect(within(reservation).getByText("42 kg")).toBeInTheDocument();
    expect(within(reservation).getByText("12 hours")).toBeInTheDocument();
    expect(within(reservation).getByText("Storage fee").nextElementSibling).toHaveTextContent("₱300.00");
    expect(within(reservation).getByText("5 kg | 11 tubs")).toBeInTheDocument();
    const confirmButton = within(reservation).getByRole("button", { name: /confirm rescue reservation/i });
    expect(confirmButton).toBeDisabled();

    const chooseTransport = screen.getByRole("button", { name: /choose transport/i });
    await user.click(chooseTransport);
    const dialog = screen.getByRole("dialog", { name: "Transport Selection" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("radio", { name: /rider - logistics pro/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /refrigerated van/i })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
    await user.click(screen.getByRole("button", { name: /use selected transport/i }));

    expect(screen.getByText("₱450.00")).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);
    expect(screen.getByLabelText("Current rescue step")).toHaveTextContent("Handoff");
  });

  it("completes the rescue through QR handoff confirmation", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));
    await user.click(screen.getByRole("button", { name: /choose transport/i }));
    await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
    await user.click(screen.getByRole("button", { name: /use selected transport/i }));
    await user.click(screen.getByRole("button", { name: /confirm rescue reservation/i }));

    expect(screen.getByText(/waiting for receiver confirmation/i)).toBeInTheDocument();
    expect(await screen.findByAltText("KapitBiz handoff QR code")).toBeInTheDocument();
    expect(qrcodeTestDouble.toDataURL).toHaveBeenCalledWith(
      JSON.stringify({
        id: "RE-4892-X",
        sender: "Maya's Frozen Goods",
        receiver: "Northline Cold Storage",
        value: 16_500,
        weightKg: 42,
      }),
      expect.objectContaining({ width: 320, margin: 2 }),
    );
    await user.click(screen.getByRole("button", { name: /confirm inventory received/i }));
    expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
    expect(screen.getByText("Chain of custody verified")).toBeInTheDocument();
    expect(screen.getByText("₱450 rescue cost")).toBeInTheDocument();
  });

  it("keeps manual confirmation available when QR generation fails", async () => {
    qrcodeTestDouble.toDataURL.mockRejectedValueOnce(new Error("renderer unavailable"));
    const user = userEvent.setup();
    let handoffState = relayReducer(createSeedState(1_000_000), { type: "start-rescue" });
    handoffState = relayReducer(handoffState, { type: "go-to", step: "capacity" });
    handoffState = relayReducer(handoffState, { type: "select-host", hostId: "northline" });
    handoffState = relayReducer(handoffState, { type: "go-to", step: "reservation" });
    handoffState = relayReducer(handoffState, { type: "select-transport", transportId: "rider" });
    handoffState = relayReducer(handoffState, { type: "confirm-reservation", at: 1_000_100 });
    window.localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(handoffState));
    render(<KapitBizRelayApp />);

    expect(await screen.findByText("QR unavailable")).toBeInTheDocument();
    expect(screen.getByText(/manual receiver confirmation/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm inventory received/i }));
    expect(screen.getByRole("heading", { name: "₱16,500 inventory protected" })).toBeInTheDocument();
  });

  it("copies the exact recovery record when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(window.navigator, "clipboard", { configurable: true, value: { writeText } });
    window.localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(createCompleteState()));
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await screen.findByRole("heading", { name: "₱16,500 inventory protected" });
    await user.click(screen.getByRole("button", { name: /share recovery record/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Recovery record copied to clipboard."));
    expect(screen.getByRole("status")).toHaveTextContent("Recovery record copied to clipboard.");
  });

  it("resets a completed rescue to a fresh persisted incident", async () => {
    vi.spyOn(Date, "now").mockReturnValue(9_000_000);
    window.localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(createCompleteState()));
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await screen.findByRole("heading", { name: "₱16,500 inventory protected" });
    await user.click(screen.getByRole("button", { name: /reset demo/i }));
    expect(screen.getByRole("button", { name: /start inventory rescue/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("kapitbiz-relay-v2") ?? "null")).toMatchObject({
        step: "incident",
        scenarioStartedAt: 9_000_000,
        handoffId: null,
        receiverConfirmedAt: null,
      });
    });
  });

  it("closes the transport sheet with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));

    const chooseTransport = screen.getByRole("button", { name: /choose transport/i });
    await user.click(chooseTransport);
    expect(screen.getByRole("dialog", { name: "Transport Selection" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Transport Selection" })).not.toBeInTheDocument();
    expect(chooseTransport).toHaveFocus();
  });

  it("traps keyboard focus within the transport sheet", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));
    await user.click(screen.getByRole("button", { name: /choose transport/i }));

    const dialog = screen.getByRole("dialog", { name: "Transport Selection" });
    const closeButton = within(dialog).getByRole("button", { name: /close transport selection/i });
    const lastEligibleTransport = within(dialog).getByRole("radio", { name: /refrigerated van/i });
    expect(dialog).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastEligibleTransport).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it("hides primary navigation during reservation and handoff only", async () => {
    const user = userEvent.setup();
    const activeFlow = render(<KapitBizRelayApp />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /choose transport/i }));
    await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
    await user.click(screen.getByRole("button", { name: /use selected transport/i }));
    await user.click(screen.getByRole("button", { name: /confirm rescue reservation/i }));
    expect(screen.getByLabelText("Current rescue step")).toHaveTextContent("Handoff");
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).not.toBeInTheDocument();

    activeFlow.unmount();
    window.localStorage.setItem("kapitbiz-relay-v2", JSON.stringify(createCompleteState()));
    render(<KapitBizRelayApp />);

    await waitFor(() => {
      expect(screen.getByLabelText("Current rescue step")).toHaveTextContent("Complete");
    });
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
  });

  it("restores the selected rider and PHP 450 reservation after remounting", async () => {
    const user = userEvent.setup();
    const firstVisit = render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));
    await user.click(screen.getByRole("button", { name: /choose transport/i }));
    await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
    await user.click(screen.getByRole("button", { name: /use selected transport/i }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("kapitbiz-relay-v2") ?? "null")).toMatchObject({
        step: "reservation",
        selectedHostId: "northline",
        selectedTransportId: "rider",
      });
    });
    firstVisit.unmount();
    render(<KapitBizRelayApp />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Rider - Logistics Pro" })).toBeInTheDocument();
      expect(screen.getByText("₱450.00")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm rescue reservation/i })).toBeEnabled();
    });
  });

  it("clears the selected transport when a different eligible host is chosen", async () => {
    const user = userEvent.setup();
    render(<KapitBizRelayApp />);

    await user.click(screen.getByRole("button", { name: /start inventory rescue/i }));
    await user.click(screen.getByRole("button", { name: /find rescue capacity/i }));
    await user.click(screen.getByRole("button", { name: /select northline cold storage/i }));
    await user.click(screen.getByRole("button", { name: /choose transport/i }));
    await user.click(screen.getByRole("radio", { name: /rider - logistics pro/i }));
    await user.click(screen.getByRole("button", { name: /use selected transport/i }));
    expect(screen.getByText("₱450.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm rescue reservation/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Go back" }));
    await user.click(screen.getByRole("button", { name: /select tagum north cold chain/i }));

    expect(screen.getByRole("heading", { name: "Tagum North Cold Chain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose transport/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm rescue reservation/i })).toBeDisabled();
  });
});
