import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KapitBizRelayApp from "@/components/kapitbiz/KapitBizRelayApp";
import { createSeedState } from "@/lib/kapitbiz";

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

vi.mock("mapbox-gl", () => ({ default: mapboxTestDouble.mapbox }));

describe("KapitBiz Relay flow", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
});
