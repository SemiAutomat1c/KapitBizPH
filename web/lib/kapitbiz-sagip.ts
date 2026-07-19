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
  sagipIdCounter += 1;
  return `${prefix}-${sagipIdCounter}`;
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
      if (!offer || offer.status !== "pending" && offer.status !== "negotiating") return state;
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
      const offers = state.offers.map((candidate) => {
        if (candidate.id !== action.offerId) return candidate;
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
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, status: "rejected" as const } : candidate,
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
