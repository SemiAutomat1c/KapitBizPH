"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  generateOffersForRequest,
  postSagipRequest,
  remainingQuantity,
  type KapitBizSagipState,
  type SagipAction,
  type SagipCategory,
  type SagipRequest,
  type SagipRequestKind,
} from "@/lib/kapitbiz-sagip";
import HazardAssistDialog from "./HazardAssistDialog";
import SagipOfferBoard from "./SagipOfferBoard";
import SagipRequestForm from "./SagipRequestForm";
import SupplierPreviewDialog from "./SupplierPreviewDialog";
import styles from "./KapitBizRelay.module.css";

type SagipSurface =
  | { kind: "closed" }
  | { kind: "post-request" }
  | { kind: "offer-board"; requestId: string }
  | { kind: "supplier-preview"; requestId: string }
  | { kind: "offer-help-modal"; requestId: string };

export default function SagipCenterScreen({
  state,
  dispatch,
}: {
  state: KapitBizSagipState;
  dispatch: (action: SagipAction) => void;
}) {
  const [segment, setSegment] = useState<SagipRequestKind>("need");
  const [now, setNow] = useState(() => Date.now());
  const [surface, setSurface] = useState<SagipSurface>({ kind: "closed" });

  // Track the selected listing for desktop split pane
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Form states for the "What can you offer" panel
  const [offerText, setOfferText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("");
  const [isCash, setIsCash] = useState(true);
  const [isTrade, setIsTrade] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const requests = state.requests.filter((request) => request.kind === segment);
  const postLabel = segment === "need" ? "Post a request" : "Post surplus";

  const activeRequest = requests.find((request) => request.id === selectedRequestId);

  const submitRequest = (input: {
    title: string;
    category: SagipCategory;
    quantity: number;
    unit: string;
    windowHours: number;
    calamityModeActive: boolean;
    description?: string;
  }) => {
    const request = postSagipRequest({ ...input, kind: segment }, now);
    dispatch({ type: "post-request", request });
    dispatch({ type: "receive-offers", offers: generateOffersForRequest(request, now) });
    setSurface({ kind: "closed" });
  };

  const acceptOffer = (offerId: string) => dispatch({ type: "accept-offer", offerId });
  const rejectOffer = (offerId: string) => dispatch({ type: "reject-offer", offerId });
  const negotiateOffer = (offerId: string, counter: { kind: "cash"; pricePhp: number }) =>
    dispatch({ type: "negotiate-offer", offerId, counter });
  const barterOffer = (offerId: string, description: string, declaredValuePhp: number) =>
    dispatch({ type: "negotiate-offer", offerId, counter: { kind: "barter", description, declaredValuePhp } });

  const handleOfferHelpSubmit = (request: SagipRequest) => {
    const price = Number(offerPrice);
    const qty = Number(offerQty) || request.quantity;

    const newOffer = {
      id: `sagip-offer-user-${now}`,
      requestId: request.id,
      bidderLabel: "Maya's Frozen Goods",
      bidderKycStatus: "verified" as const,
      offerType: isTrade ? ("barter" as const) : ("cash" as const),
      pricePhp: isTrade ? null : price,
      barterDescription: isTrade ? offerText : null,
      barterDeclaredValuePhp: isTrade ? price : null,
      quantityOffered: qty,
      submittedAt: now,
      arrivesAt: now,
      status: "pending" as const,
    };

    dispatch({ type: "receive-offers", offers: [newOffer] });
    setOfferSuccess(true);

    setTimeout(() => {
      setOfferSuccess(false);
      setOfferText("");
      setOfferPrice("");
      setOfferQty("");
    }, 2500);
  };

  const renderOfferHelpPane = (request: SagipRequest) => {
    const offersCount = state.offers.filter((o) => o.requestId === request.id).length;
    const initialLogo = request.companyName
      ? request.companyName.split(" ").map((n) => n[0]).join("")
      : "YC";

    return (
      <div className={styles.sagipRightPaneContent}>
        <div className={styles.sagipDetailHeader}>
          <div className={styles.companyLogo}>{initialLogo}</div>
          <div className={styles.sagipDetailHeaderInfo}>
            <h2>{request.companyName || "Your Company"}</h2>
            <p>{request.industry || "Milling Industry"}</p>
          </div>
          <span className={request.urgency === "Urgent" ? styles.badgeUrgent : styles.badgeNonUrgent}>
            {request.urgency === "Urgent" ? "Urgent" : "Non-Urgent"}
          </span>
          <span className={styles.offersCountBadge}>{offersCount} Kasalukuyang Alok</span>
        </div>

        <div className={styles.sagipDetailImage}>
          <img src={request.imageUrl || "/illustrations/listing-miller.jpg"} alt={request.title} />
        </div>

        <div className={styles.sagipDetailBody}>
          <h3>{request.title}</h3>
          <p className={styles.qtyPending}>{remainingQuantity(request)} {request.unit} natitira</p>
          <p className={styles.descText}>{request.description || "Walang deskripsyong ibinigay."}</p>
        </div>

        <div>
          <h4 className={styles.sagipDetailSectionHeader}>Lokasyon</h4>
          <div className={styles.sagipDetailMap}>
            <img src={request.locationMapUrl || "/illustrations/listing-map.jpg"} alt="Location satellite map" />
          </div>
        </div>

        <form
          className={styles.offerForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleOfferHelpSubmit(request);
          }}
        >
          <h4 className={styles.sagipDetailSectionHeader}>Ano ang maaari mong i-alok</h4>
          <label>
            Deskripsyon ng alok
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              placeholder={isTrade ? "Ilarawan ang ipapalit (hal. 20 bags of flour)" : "Kaya kong mag-supply ng kapasidad na ito."}
              required
            />
          </label>

          <div className={styles.offerFormInputs}>
            <label>
              Presyo ng Alok (PHP)
              <input
                type="number"
                min="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="250.00"
                required
              />
            </label>
            <label>
              Yunit
              <input type="text" value={request.unit} disabled />
            </label>
            <label>
              Dami
              <input
                type="number"
                min="1"
                max={remainingQuantity(request)}
                value={offerQty}
                onChange={(e) => setOfferQty(e.target.value)}
                placeholder={String(remainingQuantity(request))}
              />
            </label>
          </div>

          <div className={styles.offerOptionsGroup}>
            <label className={styles.offerOptionLabel}>
              <input
                type="checkbox"
                checked={isCash}
                onChange={(e) => {
                  setIsCash(e.target.checked);
                  if (e.target.checked) setIsTrade(false);
                }}
              />
              Cash
            </label>
            <label className={styles.offerOptionLabel}>
              <input
                type="checkbox"
                checked={isTrade}
                onChange={(e) => {
                  setIsTrade(e.target.checked);
                  if (e.target.checked) setIsCash(false);
                }}
              />
              Trade / Palit
            </label>
            <span className={styles.processingFee}>10% Processing Fee</span>
          </div>

          {offerSuccess && (
            <div className={styles.offerSuccessAlert} role="status">
              Matagumpay na naipadala ang iyong alok!
            </div>
          )}

          <button className={styles.primaryButton} type="submit" style={{ background: "#ce1126" }}>
            Mag-alok ng Tulong
          </button>
        </form>
      </div>
    );
  };

  const isUserOwnRequest = (req: SagipRequest) => {
    return !req.companyName || req.companyName === "Your Company";
  };

  return (
    <section className={styles.sagipScreen} aria-labelledby="sagip-heading">
      <header className={styles.screenIntro}>
        <p className={styles.eyebrow}>Sagip Center</p>
        <h2 id="sagip-heading">Sagip Center</h2>
        <p>Mag-post ng Sagip (pangangailangan) o Tulong (sobrang stock) at kumuha ng mga alok mula sa partner network.</p>
      </header>

      <div className={styles.segmentedControl} role="group" aria-label="Sagip Center mode">
        <button
          type="button"
          data-active={segment === "need"}
          aria-pressed={segment === "need"}
          aria-label="Requesting"
          onClick={() => setSegment("need")}
        >
          Sagip
        </button>
        <button
          type="button"
          data-active={segment === "surplus"}
          aria-pressed={segment === "surplus"}
          aria-label="Offering surplus"
          onClick={() => setSegment("surplus")}
        >
          Tulong
        </button>
      </div>

      <button 
        className={styles.primaryButton} 
        type="button" 
        aria-label={postLabel} 
        onClick={() => setSurface({ kind: "post-request" })}
      >
        <Plus aria-hidden="true" />
        {segment === "need" ? "Mag-post ng Sagip" : "Mag-post ng Tulong"}
      </button>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{segment === "need"
            ? "Wala pang bukas na Sagip (No open requests yet). Mag-post para makakuha ng alok."
            : "Wala pang bukas na Tulong (No surplus posted yet). Mag-post para makapag-alok ng tulong."}</p>
        </div>
      ) : (
        <div className={styles.sagipLayout}>
          {/* LEFT COLUMN: List of cards */}
          <div className={styles.sagipLeftPane}>
            <p className={styles.sagipDetailSectionHeader} style={{ margin: 0 }}>
              {segment === "need" ? "Mga negosyong nangangailangan ng Sagip" : "Mga alok na Tulong sa malapit"}
            </p>
            <ul className={styles.sagipCardList} aria-label={segment === "need" ? "Posted requests" : "Posted surplus"}>
              {requests.map((request) => {
                const initialLogo = request.companyName
                  ? request.companyName.split(" ").map((n) => n[0]).join("")
                  : "YC";
                return (
                  <li key={request.id}>
                    <button
                      type="button"
                      className={styles.sagipCard}
                      data-selected={activeRequest?.id === request.id}
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        if (isMobile) {
                          if (isUserOwnRequest(request)) {
                            // For own requests, mobile opens offer board modal
                            setSurface({ kind: "offer-board", requestId: request.id });
                          } else {
                            // For seeded requests, mobile opens offer help modal
                            setSurface({ kind: "offer-help-modal", requestId: request.id });
                          }
                        }
                      }}
                    >
                      <div className={styles.sagipCardImageContainer}>
                        <img src={request.imageUrl || "/illustrations/listing-miller.jpg"} alt="" />
                        {request.calamityModeActive && <span className={styles.disasterBadge}>Disaster</span>}
                      </div>
                      <div className={styles.sagipCardContent}>
                        <div className={styles.sagipCardHeader}>
                          <div className={styles.companyLogo}>{initialLogo}</div>
                          <div className={styles.companyInfo}>
                            <h3>{request.companyName || "Your Company"}</h3>
                            <p>{request.industry || "Milling Industry"}</p>
                          </div>
                          <span
                            className={request.urgency === "Urgent" ? styles.badgeUrgent : styles.badgeNonUrgent}
                          >
                            {request.urgency || "Non-Urgent"}
                          </span>
                        </div>
                        <h2 className={styles.sagipCardTitle}>{request.title}</h2>
                        <p className={styles.sagipCardQty}>{remainingQuantity(request)} {request.unit} natitira</p>
                        <p className={styles.sagipCardDesc}>{request.description || "Walang deskripsyong ibinigay."}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT COLUMN: Selected listing details (visible on desktop) */}
          <div className={styles.sagipRightPane}>
            {activeRequest && surface.kind === "closed" ? (
              isUserOwnRequest(activeRequest) ? (
                // If own request, show the original Offer Board inline
                <div role="dialog" aria-label={activeRequest.title} style={{ display: "grid", gap: "12px" }}>
                  <SagipOfferBoard
                    request={activeRequest}
                    allOffers={state.offers}
                    now={now}
                    onAccept={acceptOffer}
                    onReject={rejectOffer}
                    onNegotiate={negotiateOffer}
                    onBarter={barterOffer}
                    onClose={() => setSelectedRequestId(null)}
                    onPreviewSupplier={() => setSurface({ kind: "supplier-preview", requestId: activeRequest.id })}
                  />
                </div>
              ) : (
                // If other business request, show the "Offer Help" submission form
                renderOfferHelpPane(activeRequest)
              )
            ) : (
              <p style={{ color: "#526163", textAlign: "center", padding: "40px 0" }}>
                Select a listing from the list to view details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* MOBILE POPUPS & MODALS */}
      {surface.kind === "post-request" ? (
        <HazardAssistDialog label={postLabel} focusKey="post-request" onClose={() => setSurface({ kind: "closed" })}>
          <SagipRequestForm kind={segment} onSubmit={submitRequest} onClose={() => setSurface({ kind: "closed" })} />
        </HazardAssistDialog>
      ) : surface.kind === "offer-board" && activeRequest ? (
        <HazardAssistDialog
          label={activeRequest.title}
          focusKey={activeRequest.id}
          onClose={() => setSurface({ kind: "closed" })}
        >
          <SagipOfferBoard
            request={activeRequest}
            allOffers={state.offers}
            now={now}
            onAccept={acceptOffer}
            onReject={rejectOffer}
            onNegotiate={negotiateOffer}
            onBarter={barterOffer}
            onClose={() => setSurface({ kind: "closed" })}
            onPreviewSupplier={() => setSurface({ kind: "supplier-preview", requestId: activeRequest.id })}
          />
        </HazardAssistDialog>
      ) : surface.kind === "supplier-preview" && activeRequest ? (
        <HazardAssistDialog
          label="Preview as supplier"
          focusKey={`supplier-${activeRequest.id}`}
          onClose={() => setSurface({ kind: "closed" })}
        >
          <SupplierPreviewDialog request={activeRequest} onClose={() => setSurface({ kind: "closed" })} />
        </HazardAssistDialog>
      ) : surface.kind === "offer-help-modal" && activeRequest ? (
        <HazardAssistDialog
          label={activeRequest.title}
          focusKey={`help-${activeRequest.id}`}
          onClose={() => setSurface({ kind: "closed" })}
        >
          <div style={{ padding: "0" }}>{renderOfferHelpPane(activeRequest)}</div>
        </HazardAssistDialog>
      ) : null}
    </section>
  );
}
