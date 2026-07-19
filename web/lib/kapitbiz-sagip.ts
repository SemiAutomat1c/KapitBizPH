export const SAGIP_STORAGE_KEY = "kapitbiz-sagip-v1";

export type SagipRequestKind = "need" | "surplus";
export type SagipRequestStatus = "open" | "closed" | "fulfilled";
export type SagipCategory = "dry-ice" | "packaging" | "fuel" | "generator-rental" | "raw-material" | "other";
export type BidderKycStatus = "verified" | "provisional";
export type OfferType = "cash" | "barter";
export type OfferStatus = "pending" | "accepted" | "negotiating" | "rejected";

export interface SagipRequest {
  id: string;
  kind: SagipRequestKind;
  title: string;
  category: SagipCategory;
  quantity: number;
  unit: string;
  postedAt: number;
  windowHours: number;
  closesAt: number;
  status: SagipRequestStatus;
  fulfilledQty: number;
  calamityModeActive: boolean;
  srpCeilingPhp: number | null;
}

export interface BlindOffer {
  id: string;
  requestId: string;
  bidderLabel: string;
  bidderKycStatus: BidderKycStatus;
  offerType: OfferType;
  pricePhp: number | null;
  barterDescription: string | null;
  barterDeclaredValuePhp: number | null;
  quantityOffered: number;
  submittedAt: number;
  arrivesAt: number;
  status: OfferStatus;
}

export interface SagipBidderProfile {
  id: string;
  name: string;
  kycStatus: BidderKycStatus;
  categories: SagipCategory[];
  priceBandPhpPerUnit: { min: number; max: number };
}

export interface KapitBizSagipState {
  version: 1;
  requests: SagipRequest[];
  offers: BlindOffer[];
}

export type SagipAction =
  | { type: "post-request"; request: SagipRequest }
  | { type: "receive-offers"; offers: BlindOffer[] }
  | { type: "accept-offer"; offerId: string }
  | { type: "negotiate-offer"; offerId: string; counter: { kind: "cash"; pricePhp: number } | { kind: "barter"; description: string; declaredValuePhp: number } }
  | { type: "reject-offer"; offerId: string }
  | { type: "close-request"; requestId: string }
  | { type: "reset" };

export const SAGIP_BIDDER_POOL: SagipBidderProfile[] = [
  { id: "bidder-abc-sarisari", name: "ABC Sari-Sari Supply Co.", kycStatus: "verified", categories: ["dry-ice", "packaging"], priceBandPhpPerUnit: { min: 38, max: 52 } },
  { id: "bidder-tagum-ice", name: "Tagum Ice Traders", kycStatus: "verified", categories: ["dry-ice"], priceBandPhpPerUnit: { min: 40, max: 60 } },
  { id: "bidder-packrite", name: "PackRite Davao", kycStatus: "provisional", categories: ["packaging"], priceBandPhpPerUnit: { min: 6, max: 12 } },
  { id: "bidder-fuelgo", name: "FuelGo Davao Region", kycStatus: "verified", categories: ["fuel"], priceBandPhpPerUnit: { min: 62, max: 78 } },
  { id: "bidder-gensetph", name: "GenSet Rentals PH", kycStatus: "verified", categories: ["generator-rental"], priceBandPhpPerUnit: { min: 900, max: 1_400 } },
  { id: "bidder-northmill", name: "Northmill Trading", kycStatus: "provisional", categories: ["raw-material"], priceBandPhpPerUnit: { min: 45, max: 65 } },
  { id: "bidder-panabo-supply", name: "Panabo Supply Hub", kycStatus: "verified", categories: ["packaging", "raw-material"], priceBandPhpPerUnit: { min: 20, max: 40 } },
  { id: "bidder-crossroad", name: "Crossroad Logistics Co-op", kycStatus: "provisional", categories: ["fuel", "generator-rental"], priceBandPhpPerUnit: { min: 55, max: 90 } },
];

export const SRP_CEILINGS: Record<SagipCategory, number> = {
  "dry-ice": 55,
  packaging: 10,
  fuel: 68,
  "generator-rental": 1_200,
  "raw-material": 60,
  other: 100,
};

let sagipIdCounter = 0;
function nextSagipId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  sagipIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${sagipIdCounter}`;
}

export function createSagipState(): KapitBizSagipState {
  return { version: 1, requests: [], offers: [] };
}

export function postSagipRequest(
  input: {
    kind: SagipRequestKind;
    title: string;
    category: SagipCategory;
    quantity: number;
    unit: string;
    windowHours: number;
    calamityModeActive: boolean;
  },
  now: number,
): SagipRequest {
  return {
    id: nextSagipId("sagip-request"),
    kind: input.kind,
    title: input.title,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    postedAt: now,
    windowHours: input.windowHours,
    closesAt: now + input.windowHours * 60 * 60 * 1000,
    status: "open",
    fulfilledQty: 0,
    calamityModeActive: input.calamityModeActive,
    srpCeilingPhp: input.calamityModeActive ? SRP_CEILINGS[input.category] : null,
  };
}

export function remainingQuantity(request: SagipRequest): number {
  return Math.max(0, request.quantity - request.fulfilledQty);
}

export function sagipReducer(state: KapitBizSagipState, action: SagipAction): KapitBizSagipState {
  switch (action.type) {
    case "post-request":
      return { ...state, requests: [...state.requests, action.request] };
    case "receive-offers":
      return { ...state, offers: [...state.offers, ...action.offers] };
    case "accept-offer": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      const request = offer ? state.requests.find((candidate) => candidate.id === offer.requestId) : undefined;
      if (!offer || !request || request.status !== "open" || remainingQuantity(request) <= 0 || offer.status !== "pending" && offer.status !== "negotiating") return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, status: "accepted" as const } : candidate,
      );
      const requests = state.requests.map((request) => {
        if (request.id !== offer.requestId) return request;
        const fulfilledQty = Math.min(request.quantity, request.fulfilledQty + offer.quantityOffered);
        return { ...request, fulfilledQty, status: fulfilledQty >= request.quantity ? "fulfilled" as const : request.status };
      });
      return { ...state, offers, requests };
    }
    case "negotiate-offer": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      const request = offer ? state.requests.find((candidate) => candidate.id === offer.requestId) : undefined;
      const invalidCounter = action.counter.kind === "cash"
        ? !Number.isFinite(action.counter.pricePhp) || action.counter.pricePhp <= 0
        : !action.counter.description.trim() || !Number.isFinite(action.counter.declaredValuePhp) || action.counter.declaredValuePhp <= 0;
      if (!offer || !request || request.status !== "open" || offer.status !== "pending" && offer.status !== "negotiating" || invalidCounter) return state;
      const offers = state.offers.map((candidate) => {
        if (candidate.id !== offer.id) return candidate;
        if (action.counter.kind === "cash") {
          return { ...candidate, status: "negotiating" as const, offerType: "cash" as const, pricePhp: action.counter.pricePhp };
        }
        return {
          ...candidate,
          status: "negotiating" as const,
          offerType: "barter" as const,
          barterDescription: action.counter.description,
          barterDeclaredValuePhp: action.counter.declaredValuePhp,
        };
      });
      return { ...state, offers };
    }
    case "reject-offer": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      const request = offer ? state.requests.find((candidate) => candidate.id === offer.requestId) : undefined;
      if (!offer || !request || request.status !== "open" || offer.status !== "pending" && offer.status !== "negotiating") return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === offer.id ? { ...candidate, status: "rejected" as const } : candidate,
      );
      return { ...state, offers };
    }
    case "close-request": {
      const requests = state.requests.map((request) =>
        request.id === action.requestId && request.status === "open"
          ? { ...request, status: "closed" as const }
          : request,
      );
      return { ...state, requests };
    }
    case "reset":
      return createSagipState();
  }
}

function offerPrice(offer: BlindOffer): number {
  return offer.offerType === "cash" ? offer.pricePhp ?? 0 : offer.barterDeclaredValuePhp ?? 0;
}

export function generateOffersForRequest(request: SagipRequest, now: number): BlindOffer[] {
  const matchingBidders = SAGIP_BIDDER_POOL.filter((bidder) => bidder.categories.includes(request.category));
  const labelPrefix = request.kind === "need" ? "Supplier" : "Buyer";
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const totalOfferedQuantity = Math.max(request.quantity, matchingBidders.length);
  const baseQuantity = Math.floor(totalOfferedQuantity / matchingBidders.length);
  const remainderQuantity = totalOfferedQuantity - baseQuantity * matchingBidders.length;

  return matchingBidders.map((bidder, index) => {
    const spread = bidder.priceBandPhpPerUnit.max - bidder.priceBandPhpPerUnit.min;
    const rawPrice = bidder.priceBandPhpPerUnit.min + spread * ((index + 1) / (matchingBidders.length + 1));
    const pricePhp = request.srpCeilingPhp !== null ? Math.min(rawPrice, request.srpCeilingPhp) : rawPrice;

    return {
      id: nextSagipId("sagip-offer"),
      requestId: request.id,
      bidderLabel: `${labelPrefix} ${letters[index] ?? String(index + 1)}`,
      bidderKycStatus: bidder.kycStatus,
      offerType: "cash",
      pricePhp: Math.round(pricePhp),
      barterDescription: null,
      barterDeclaredValuePhp: null,
      quantityOffered: baseQuantity + (index === 0 ? remainderQuantity : 0),
      submittedAt: now,
      arrivesAt: now + (index + 1) * 4_000,
      status: "pending",
    };
  });
}

export function visibleOffers(offers: BlindOffer[], requestId: string, now: number): BlindOffer[] {
  return offers.filter((offer) => offer.requestId === requestId && offer.arrivesAt <= now);
}

export function sortOffers(request: SagipRequest, offers: BlindOffer[]): BlindOffer[] {
  const direction = request.kind === "need" ? 1 : -1;
  return [...offers].sort((a, b) => (offerPrice(a) - offerPrice(b)) * direction);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const SAGIP_CATEGORIES: readonly SagipCategory[] = ["dry-ice", "packaging", "fuel", "generator-rental", "raw-material", "other"];
const SAGIP_WINDOW_HOURS = [24, 48, 72] as const;
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSagipRequest(value: unknown): value is SagipRequest {
  if (!isRecord(value)) return false;
  if (!SAGIP_CATEGORIES.includes(value.category as SagipCategory)) return false;
  if (!SAGIP_WINDOW_HOURS.includes(value.windowHours as typeof SAGIP_WINDOW_HOURS[number])) return false;
  const category = value.category as SagipCategory;
  const windowHours = value.windowHours as typeof SAGIP_WINDOW_HOURS[number];

  return isNonEmptyString(value.id)
    && (value.kind === "need" || value.kind === "surplus")
    && isNonEmptyString(value.title)
    && isFinitePositiveNumber(value.quantity)
    && isNonEmptyString(value.unit)
    && isTimestamp(value.postedAt)
    && isTimestamp(value.closesAt)
    && value.closesAt === value.postedAt + windowHours * HOUR_IN_MILLISECONDS
    && (value.status === "open" || value.status === "closed" || value.status === "fulfilled")
    && typeof value.fulfilledQty === "number" && Number.isFinite(value.fulfilledQty) && value.fulfilledQty >= 0 && value.fulfilledQty <= value.quantity
    && (value.status === "fulfilled" ? value.fulfilledQty === value.quantity : value.fulfilledQty < value.quantity)
    && typeof value.calamityModeActive === "boolean"
    && (value.calamityModeActive ? value.srpCeilingPhp === SRP_CEILINGS[category] : value.srpCeilingPhp === null);
}

function isBlindOffer(value: unknown): value is BlindOffer {
  if (!isRecord(value)) return false;
  const isCashOffer = value.offerType === "cash" && isFinitePositiveNumber(value.pricePhp);
  const isBarterOffer = value.offerType === "barter" && isNonEmptyString(value.barterDescription) && isFinitePositiveNumber(value.barterDeclaredValuePhp);
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.requestId)
    && isNonEmptyString(value.bidderLabel)
    && (value.bidderKycStatus === "verified" || value.bidderKycStatus === "provisional")
    && (isCashOffer || isBarterOffer)
    && (value.pricePhp === null || isFinitePositiveNumber(value.pricePhp))
    && (value.barterDescription === null || typeof value.barterDescription === "string")
    && (value.barterDeclaredValuePhp === null || isFinitePositiveNumber(value.barterDeclaredValuePhp))
    && isFinitePositiveNumber(value.quantityOffered)
    && isTimestamp(value.submittedAt)
    && isTimestamp(value.arrivesAt) && value.arrivesAt >= value.submittedAt
    && (value.status === "pending" || value.status === "accepted" || value.status === "negotiating" || value.status === "rejected");
}

export function parseSagipState(value: unknown): KapitBizSagipState {
  if (!isRecord(value) || value.version !== 1) return createSagipState();
  if (!Array.isArray(value.requests) || !value.requests.every(isSagipRequest)) return createSagipState();
  if (!Array.isArray(value.offers) || !value.offers.every(isBlindOffer)) return createSagipState();
  const ids = [...value.requests, ...value.offers].map((item) => item.id);
  if (new Set(ids).size !== ids.length) return createSagipState();
  const requestIds = new Set(value.requests.map((request) => request.id));
  if (!value.offers.every((offer) => requestIds.has(offer.requestId))) return createSagipState();
  return { version: 1, requests: value.requests, offers: value.offers };
}
