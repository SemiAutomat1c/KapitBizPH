export const SAGIP_STORAGE_KEY = "kapitbiz-sagip-v1";

export type SagipRequestKind = "need" | "surplus";
export type SagipRequestStatus = "open" | "closed" | "fulfilled";
export type SagipCategory = "dry-ice" | "packaging" | "fuel" | "generator-rental" | "raw-material" | "other";
export type BidderKycStatus = "verified" | "provisional";
export type OfferType = "cash" | "barter";
export type OfferStatus = "pending" | "accepted" | "negotiating" | "rejected" | "fulfilled";
export type SagipDealStage = "locked" | "escrow-funded" | "in-progress" | "delivered" | "fulfilled";
export const SAGIP_COMMISSION_RATE = 0.05;

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
  // Presentation properties
  companyName?: string;
  industry?: string;
  region?: string;
  urgency?: "Urgent" | "Non-Urgent";
  description?: string;
  imageUrl?: string;
  locationMapUrl?: string;
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
  bestOfferRequested: boolean;
  escrowFundedAt: number | null;
  deliveredAt: number | null;
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
  | { type: "request-best-offer"; offerId: string }
  | { type: "fund-escrow"; offerId: string; at: number }
  | { type: "mark-delivered"; offerId: string; at: number }
  | { type: "confirm-received"; offerId: string }
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
  const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
  if (isTest) {
    return { version: 1, requests: [], offers: [] };
  }

  const now = Date.now();
  const seedRequests: SagipRequest[] = [
    {
      id: "sagip-request-1",
      kind: "need",
      title: "Needs backup miller",
      category: "raw-material",
      quantity: 200,
      unit: "Sacks",
      postedAt: now - 3600 * 1000,
      windowHours: 24,
      closesAt: now + 23 * 3600 * 1000,
      status: "open",
      fulfilledQty: 0,
      calamityModeActive: true,
      srpCeilingPhp: 60,
      companyName: "Swift Rice Miller",
      industry: "Agriculture & Milling industry",
      region: "Tagum City",
      urgency: "Urgent",
      description: "The recent earthquake damaged our milling equipment, leaving us with a backlog of 200 sacks of rice waiting to be milled.",
      imageUrl: "/illustrations/listing-miller.jpg",
      locationMapUrl: "/illustrations/listing-map.jpg"
    },
    {
      id: "sagip-request-2",
      kind: "need",
      title: "Needs Freezer Storage",
      category: "dry-ice",
      quantity: 30,
      unit: "kg of Frozen Chicken",
      postedAt: now - 7200 * 1000,
      windowHours: 48,
      closesAt: now + 46 * 3600 * 1000,
      status: "open",
      fulfilledQty: 0,
      calamityModeActive: true,
      srpCeilingPhp: 55,
      companyName: "Den's Poultry Inc.",
      industry: "Agriculture & Milling industry",
      region: "Panabo City",
      urgency: "Urgent",
      description: "The earthquake caused a power outage, and we need a working freezer for our frozen stock ASAP before it spoils.",
      imageUrl: "/illustrations/listing-poultry.jpg",
      locationMapUrl: "/illustrations/listing-map.jpg"
    },
    {
      id: "sagip-request-3",
      kind: "need",
      title: "I need additional logistics",
      category: "other",
      quantity: 1,
      unit: "Tonnes of Corn",
      postedAt: now - 1800 * 1000,
      windowHours: 72,
      closesAt: now + 71.5 * 3600 * 1000,
      status: "open",
      fulfilledQty: 0,
      calamityModeActive: false,
      srpCeilingPhp: null,
      companyName: "Farmers Assoc.",
      industry: "Agriculture & Milling industry",
      region: "Carmen",
      urgency: "Non-Urgent",
      description: "The recent earthquake damaged our milling equipment, leaving us with a backlog of 200 sacks of rice waiting to be milled.",
      imageUrl: "/illustrations/listing-logistics.jpg",
      locationMapUrl: "/illustrations/listing-map.jpg"
    },
    {
      id: "sagip-request-4",
      kind: "surplus",
      title: "Surplus Freezer Space",
      category: "dry-ice",
      quantity: 500,
      unit: "cu ft",
      postedAt: now - 3600 * 1000,
      windowHours: 24,
      closesAt: now + 23 * 3600 * 1000,
      status: "open",
      fulfilledQty: 0,
      calamityModeActive: false,
      srpCeilingPhp: null,
      companyName: "Davao Cold Chain",
      industry: "Logistics & Storage",
      region: "Davao City",
      urgency: "Non-Urgent",
      description: "We have excess cold storage space available for temporary staging of perishable goods.",
      imageUrl: "/illustrations/badge-cold-storage.png",
      locationMapUrl: "/illustrations/listing-map.jpg"
    }
  ];

  const seedOffers = seedRequests.flatMap((req) => generateOffersForRequest(req, req.postedAt));

  return {
    version: 1,
    requests: seedRequests,
    offers: seedOffers
  };
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
    companyName?: string;
    description?: string;
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
    companyName: input.companyName || "Your Company",
    industry: "Milling Industry",
    region: "Tagum City",
    urgency: input.calamityModeActive ? "Urgent" : "Non-Urgent",
    description: input.description || "No description provided.",
    imageUrl: "/illustrations/listing-miller.jpg",
    locationMapUrl: "/illustrations/listing-map.jpg"
  };
}

export function remainingQuantity(request: SagipRequest): number {
  return Math.max(0, request.quantity - request.fulfilledQty);
}

const CLOSING_SOON_MS = 60 * 60 * 1_000;

export function formatTimeRemaining(closesAt: number, now: number): string {
  const msLeft = closesAt - now;
  if (msLeft <= 0) return "Closed";

  const totalMinutes = Math.floor(msLeft / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function isClosingSoon(closesAt: number, now: number): boolean {
  const msLeft = closesAt - now;
  return msLeft > 0 && msLeft <= CLOSING_SOON_MS;
}

export function isClosed(closesAt: number, now: number): boolean {
  return closesAt - now <= 0;
}

export function computeDealStage(offer: BlindOffer): SagipDealStage {
  if (offer.status === "fulfilled") return "fulfilled";
  if (offer.deliveredAt !== null) return "delivered";
  if (offer.escrowFundedAt !== null) return "in-progress";
  return "locked";
}

export function computeOfferTotal(offer: BlindOffer): number {
  const unitPrice = offer.offerType === "cash" ? offer.pricePhp ?? 0 : offer.barterDeclaredValuePhp ?? 0;
  return unitPrice * offer.quantityOffered;
}

export function computeCommission(total: number): number {
  return Math.round(total * SAGIP_COMMISSION_RATE);
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
        return { ...request, fulfilledQty };
      });
      return { ...state, offers, requests };
    }
    case "request-best-offer": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      if (!offer || offer.status !== "pending" && offer.status !== "negotiating") return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, bestOfferRequested: true } : candidate,
      );
      return { ...state, offers };
    }
    case "fund-escrow": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      if (!offer || offer.status !== "accepted" || offer.escrowFundedAt !== null) return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, escrowFundedAt: action.at } : candidate,
      );
      return { ...state, offers };
    }
    case "mark-delivered": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      if (!offer || offer.status !== "accepted" || offer.escrowFundedAt === null || offer.deliveredAt !== null) return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, deliveredAt: action.at } : candidate,
      );
      return { ...state, offers };
    }
    case "confirm-received": {
      const offer = state.offers.find((candidate) => candidate.id === action.offerId);
      const request = offer ? state.requests.find((candidate) => candidate.id === offer.requestId) : undefined;
      if (!offer || !request || offer.status !== "accepted" || offer.deliveredAt === null) return state;
      const offers = state.offers.map((candidate) =>
        candidate.id === action.offerId ? { ...candidate, status: "fulfilled" as const } : candidate,
      );
      const requests = state.requests.map((candidate) =>
        candidate.id === request.id && remainingQuantity(request) <= 0
          ? { ...candidate, status: "fulfilled" as const }
          : candidate,
      );
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
      bestOfferRequested: false,
      escrowFundedAt: null,
      deliveredAt: null,
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
    && (value.status === "pending" || value.status === "accepted" || value.status === "negotiating" || value.status === "rejected" || value.status === "fulfilled")
    && typeof value.bestOfferRequested === "boolean"
    && (value.escrowFundedAt === null || isTimestamp(value.escrowFundedAt))
    && (value.deliveredAt === null || isTimestamp(value.deliveredAt));
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
