export const HAZARD_ASSIST_STORAGE_KEY = "kapitbiz-hazard-assist-v1";

export type SafetyCheckAnswer = "unknown" | "safe" | "need-help" | "stock-at-risk";
export type ContinuityRecommendation = "generator" | "relay";

export interface KapitBizHazardAssistState {
  version: 1;
  alertAcknowledged: boolean;
  safetyCheckAnswer: SafetyCheckAnswer;
  generatorEstimatePhp: number;
  relayEstimatePhp: number;
  calamityModePreviewOpen: boolean;
  goodSamaritanAskedAt: number | null;
  selectedGoodSamaritanPartnerId: string | null;
  relayStartedFromHazardAssist: boolean;
  recoveryPacketPreviewOpen: boolean;
}

export interface GeneratorEstimateInputs {
  durationHours: number;
  burnRateLitersPerHour: number;
  fuelPricePhpPerLiter: number;
}

export interface HazardAssistResponder {
  id: string;
  partnerId: "northline" | "tagum-north" | "rider";
  partnerName: string;
  kind: "storage" | "transport";
  offer: string;
  availability: string;
  trustLabel: "Verified demo partner" | "KYC preview";
  demoOnly: true;
}

export interface HazardRelayContext {
  sourceLabel: "Started from Safety Check";
  eventLabel: "Simulated brownout + flood-risk alert";
  decisionNote: "Relay chosen over generator estimate: PHP714";
}

export interface HazardActivityItem {
  id: string;
  label: string;
  detail: string;
  at: number;
}

export type HazardAssistAction =
  | { type: "acknowledge-alert" }
  | { type: "answer-safety-check"; answer: Exclude<SafetyCheckAnswer, "unknown"> }
  | { type: "set-calamity-mode-preview"; open: boolean }
  | { type: "ask-good-samaritans"; at: number }
  | { type: "select-good-samaritan"; partnerId: string }
  | { type: "start-relay" }
  | { type: "set-recovery-packet-preview"; open: boolean }
  | { type: "reset" };

export const SEEDED_HAZARD_EVENT = {
  id: "tagum-feeder-flood-demo",
  title: "Simulated brownout + flood-risk alert",
  detail: "Feeder outage expected for 6 hours. Low-lying routes may delay deliveries.",
  location: "Tagum central market area",
  atRiskInventoryPhp: 21_800,
  durationHours: 6,
  burnRateLitersPerHour: 1.75,
  fuelPricePhpPerLiter: 68,
} as const;

export const GOOD_SAMARITAN_RESPONDERS: HazardAssistResponder[] = [
  {
    id: "good-samaritan-northline",
    partnerId: "northline",
    partnerName: "Northline Cold Storage",
    kind: "storage",
    offer: "120 kg temporary freezer capacity",
    availability: "Available for the next 12 hours",
    trustLabel: "Verified demo partner",
    demoOnly: true,
  },
  {
    id: "good-samaritan-tagum-north",
    partnerId: "tagum-north",
    partnerName: "Tagum North Micro-Cold Room",
    kind: "storage",
    offer: "60 kg temporary freezer capacity",
    availability: "Available for the next 8 hours",
    trustLabel: "KYC preview",
    demoOnly: true,
  },
  {
    id: "good-samaritan-rider",
    partnerId: "rider",
    partnerName: "Rider - Logistics Pro",
    kind: "transport",
    offer: "Refrigerated pickup window",
    availability: "Estimated pickup in 30 minutes",
    trustLabel: "Verified demo partner",
    demoOnly: true,
  },
];

export function calculateGeneratorEstimate(inputs: GeneratorEstimateInputs): number {
  const estimate = inputs.durationHours * inputs.burnRateLitersPerHour * inputs.fuelPricePhpPerLiter;
  return Math.round(estimate * 100) / 100;
}

export function createHazardAssistState(): KapitBizHazardAssistState {
  return {
    version: 1,
    alertAcknowledged: false,
    safetyCheckAnswer: "unknown",
    generatorEstimatePhp: calculateGeneratorEstimate(SEEDED_HAZARD_EVENT),
    relayEstimatePhp: 450,
    calamityModePreviewOpen: false,
    goodSamaritanAskedAt: null,
    selectedGoodSamaritanPartnerId: null,
    relayStartedFromHazardAssist: false,
    recoveryPacketPreviewOpen: false,
  };
}

export function hazardAssistReducer(
  state: KapitBizHazardAssistState,
  action: HazardAssistAction,
): KapitBizHazardAssistState {
  switch (action.type) {
    case "acknowledge-alert":
      return { ...state, alertAcknowledged: true };
    case "answer-safety-check":
      return { ...state, alertAcknowledged: true, safetyCheckAnswer: action.answer };
    case "set-calamity-mode-preview":
      return { ...state, calamityModePreviewOpen: action.open };
    case "ask-good-samaritans":
      return {
        ...state,
        alertAcknowledged: true,
        goodSamaritanAskedAt: state.goodSamaritanAskedAt ?? action.at,
      };
    case "select-good-samaritan":
      return GOOD_SAMARITAN_RESPONDERS.some((responder) => responder.partnerId === action.partnerId)
        ? { ...state, selectedGoodSamaritanPartnerId: action.partnerId }
        : state;
    case "start-relay":
      return { ...state, relayStartedFromHazardAssist: true };
    case "set-recovery-packet-preview":
      return { ...state, recoveryPacketPreviewOpen: action.open };
    case "reset":
      return createHazardAssistState();
  }
}

export function selectContinuityRecommendation(
  state: KapitBizHazardAssistState,
): ContinuityRecommendation {
  return state.relayEstimatePhp < state.generatorEstimatePhp ? "relay" : "generator";
}

export function buildHazardRelayContext(
  state: KapitBizHazardAssistState,
): HazardRelayContext | null {
  return state.relayStartedFromHazardAssist
    ? {
        sourceLabel: "Started from Safety Check",
        eventLabel: "Simulated brownout + flood-risk alert",
        decisionNote: "Relay chosen over generator estimate: PHP714",
      }
    : null;
}

export function buildHazardActivityItems(
  state: KapitBizHazardAssistState,
  scenarioStartedAt: number,
): HazardActivityItem[] {
  const items: HazardActivityItem[] = [];
  if (state.alertAcknowledged) items.push({
    id: "hazard-alert-received",
    label: "Simulated alert received",
    detail: "Seeded feeder outage and flood-risk route context recorded. Demo data only.",
    at: scenarioStartedAt - 50_000,
  });
  if (state.safetyCheckAnswer !== "unknown") items.push({
    id: "safety-check-answered",
    label: "Safety Check answered",
    detail: `Operational status recorded: ${state.safetyCheckAnswer.replaceAll("-", " ")}.`,
    at: scenarioStartedAt - 40_000,
  });
  if (state.safetyCheckAnswer === "stock-at-risk") items.push({
    id: "fuel-comparison-generated",
    label: "Fuel comparison generated",
    detail: "PHP714 generator estimate compared with the PHP450 seeded Relay estimate.",
    at: scenarioStartedAt - 30_000,
  });
  if (state.goodSamaritanAskedAt !== null) items.push({
    id: "good-samaritan-opened",
    label: "Good Samaritan capacity opened",
    detail: "Voluntary seeded partner capacity was shown; no live notification was sent.",
    at: Math.min(state.goodSamaritanAskedAt, scenarioStartedAt - 20_000),
  });
  if (state.relayStartedFromHazardAssist) items.push({
    id: "relay-started-from-safety-check",
    label: "Relay started from Safety Check",
    detail: "Relay chosen over the PHP714 generator estimate.",
    at: scenarioStartedAt - 10_000,
  });
  return items;
}

export function parseHazardAssistState(value: unknown): KapitBizHazardAssistState {
  if (!isRecord(value) || value.version !== 1) return createHazardAssistState();
  if (typeof value.alertAcknowledged !== "boolean") return createHazardAssistState();
  if (!isSafetyCheckAnswer(value.safetyCheckAnswer)) return createHazardAssistState();
  if (!isFiniteNumber(value.generatorEstimatePhp) || !isFiniteNumber(value.relayEstimatePhp)) return createHazardAssistState();
  if (typeof value.calamityModePreviewOpen !== "boolean") return createHazardAssistState();
  if (!isNullableFiniteNumber(value.goodSamaritanAskedAt)) return createHazardAssistState();
  if (!isNullableResponderId(value.selectedGoodSamaritanPartnerId)) return createHazardAssistState();
  if (typeof value.relayStartedFromHazardAssist !== "boolean") return createHazardAssistState();
  if (typeof value.recoveryPacketPreviewOpen !== "boolean") return createHazardAssistState();
  return value as unknown as KapitBizHazardAssistState;
}

function isSafetyCheckAnswer(value: unknown): value is SafetyCheckAnswer {
  return value === "unknown" || value === "safe" || value === "need-help" || value === "stock-at-risk";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableResponderId(value: unknown): value is string | null {
  return value === null || (
    typeof value === "string"
    && GOOD_SAMARITAN_RESPONDERS.some((responder) => responder.partnerId === value)
  );
}
