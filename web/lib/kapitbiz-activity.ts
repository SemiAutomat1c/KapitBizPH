import {
  calculateReservation,
  deriveSelection,
  expectedFacilityArrivalAt,
  type RelayDemoState,
} from "@/lib/kapitbiz";
import type { KapitBizDemoSession } from "@/lib/kapitbiz-demo";
import {
  buildHazardActivityItems,
  type KapitBizHazardAssistState,
} from "@/lib/kapitbiz-hazard-assist";

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  at: number;
  status: "complete" | "current";
}

export function buildActivityFeed(
  state: RelayDemoState,
  session: KapitBizDemoSession,
  hazardState: KapitBizHazardAssistState,
): ActivityItem[] {
  const hazardItems = buildHazardActivityItems(hazardState, state.scenarioStartedAt)
    .map((item) => ({ ...item, status: "complete" as const }));
  const feed = [...hazardItems, ...candidateEvents(state, session)]
    .filter((item): item is ActivityItem => item !== null)
    .sort((left, right) => left.at - right.at);

  if (state.receiverConfirmedAt === null && feed.length > 0) {
    feed[feed.length - 1] = { ...feed[feed.length - 1], status: "current" };
  }

  return feed;
}

function candidateEvents(
  state: RelayDemoState,
  session: KapitBizDemoSession,
): Array<ActivityItem | null> {
  const selection = deriveSelection(state);
  const reservation = calculateReservation(state);
  const host = state.hosts.find((candidate) => candidate.id === state.selectedHostId);
  const transport = state.transportOptions.find((candidate) => candidate.id === state.selectedTransportId);
  const reservationAt = state.reservationConfirmedAt;
  const facilityArrivalAt = expectedFacilityArrivalAt(state);
  const recordedFacilityArrivalAt = facilityArrivalAt === null
    ? null
    : Math.max(facilityArrivalAt, session.riderArrivedAt ?? facilityArrivalAt);
  const hostLabel = host?.name.replace(" Cold Storage", "") ?? "Storage host";

  return [
    state.step === "incident" ? null : {
      id: "rescue-initiated",
      label: "Rescue initiated",
      detail: `PHP${state.inventory.reduce((total, item) => total + item.totalValue, 0).toLocaleString("en-PH")} at-risk inventory identified at Maya's Frozen Goods.`,
      at: state.scenarioStartedAt,
      status: "complete",
    },
    reservationAt !== null && host ? {
      id: "host-reserved",
      label: `${hostLabel} reserved`,
      detail: `${selection.selectedWeightKg} kg reserved at ${host.name} for PHP${reservation.storageFee.toLocaleString("en-PH")}.`,
      at: reservationAt,
      status: "complete",
    } : null,
    reservationAt !== null && transport ? {
      id: "rider-dispatched",
      label: "Rider dispatched",
      detail: `${transport.name} assigned for PHP${reservation.transportFee.toLocaleString("en-PH")}; PHP${reservation.total.toLocaleString("en-PH")} total rescue cost.`,
      at: reservationAt,
      status: "complete",
    } : null,
    session.riderArrivedAt !== null ? {
      id: "rider-arrived",
      label: "Rider arrived",
      detail: "Rider checked in at Maya's Frozen Goods for collection.",
      at: session.riderArrivedAt,
      status: "complete",
    } : null,
    state.receiverConfirmedAt !== null && recordedFacilityArrivalAt !== null && host ? {
      id: "facility-arrival",
      label: "Arrival at facility",
      detail: `${selection.selectedWeightKg} kg received at ${host.name}.`,
      at: recordedFacilityArrivalAt,
      status: "complete",
    } : null,
    state.receiverConfirmedAt !== null ? {
      id: "transfer-confirmed",
      label: "Transfer confirmed",
      detail: `Custody record ${state.handoffId ?? "RE-4892-X"} confirmed by the facility receiver.`,
      at: state.receiverConfirmedAt,
      status: "complete",
    } : null,
  ];
}
