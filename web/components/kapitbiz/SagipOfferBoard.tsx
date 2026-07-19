"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { remainingQuantity, sortOffers, visibleOffers, type BlindOffer, type SagipRequest } from "@/lib/kapitbiz-sagip";
import styles from "./KapitBizRelay.module.css";

function formatCurrency(value: number): string {
  return `PHP${value.toLocaleString("en-PH")}`;
}

function offerSummary(offer: BlindOffer): string {
  return offer.offerType === "cash"
    ? formatCurrency(offer.pricePhp ?? 0)
    : `Barter: ${offer.barterDescription} (declared ${formatCurrency(offer.barterDeclaredValuePhp ?? 0)})`;
}

function canNegotiate(offer: BlindOffer): boolean {
  return offer.status === "pending" || offer.status === "negotiating";
}

export interface SagipOfferBoardProps {
  request: SagipRequest;
  allOffers: BlindOffer[];
  now: number;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string, counter: { kind: "cash"; pricePhp: number }) => void;
  onClose: () => void;
  onPreviewSupplier: () => void;
}

export default function SagipOfferBoard({
  request,
  allOffers,
  now,
  onAccept,
  onReject,
  onNegotiate,
  onClose,
  onPreviewSupplier,
}: SagipOfferBoardProps) {
  const [negotiatingOfferId, setNegotiatingOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const offers = sortOffers(request, visibleOffers(allOffers, request.id, now));
  const remaining = remainingQuantity(request);

  const clearCounterForm = (offerId: string) => {
    if (negotiatingOfferId === offerId) {
      setNegotiatingOfferId(null);
      setCounterPrice("");
    }
  };

  const sendCounter = (offer: BlindOffer) => {
    if (!canNegotiate(offer)) return;
    const pricePhp = Number(counterPrice);
    if (!Number.isFinite(pricePhp) || pricePhp <= 0) return;
    onNegotiate(offer.id, { kind: "cash", pricePhp });
    clearCounterForm(offer.id);
  };

  const acceptOffer = (offerId: string) => {
    onAccept(offerId);
    clearCounterForm(offerId);
  };

  const rejectOffer = (offerId: string) => {
    onReject(offerId);
    clearCounterForm(offerId);
  };

  return (
    <>
      <header className={styles.hazardDialogHeader}>
        <span>{request.title}</span>
        <button className={styles.iconButton} type="button" onClick={onClose} aria-label={`Close ${request.title}`} title={`Close ${request.title}`}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className={styles.hazardDialogBody}>
        <h2 data-hazard-initial-focus tabIndex={-1}>{request.title}</h2>
        <p>{request.fulfilledQty} of {request.quantity} {request.unit} secured</p>
        <button className={styles.secondaryButton} type="button" onClick={onPreviewSupplier}>Preview as supplier</button>

        {offers.length === 0 ? (
          <p>No offers yet. Offers arrive within moments of posting.</p>
        ) : (
          <ul className={styles.responderList} aria-label="Blind offers">
            {offers.map((offer) => (
              <li className={styles.responderRow} key={offer.id}>
                <div>
                  <h3>{offer.bidderLabel}</h3>
                  <p data-testid="sagip-offer-price">{offerSummary(offer)}</p>
                  <small>{offer.quantityOffered} {request.unit} offered - {offer.status}</small>
                </div>
                <div className={styles.responderTrust}>
                  <span>{offer.bidderKycStatus === "verified" ? "Verified Business" : "Provisional - pending review"}</span>
                  {canNegotiate(offer) ? (
                    <div className={styles.sagipOfferActions}>
                      <button className={styles.responderAction} type="button" disabled={remaining <= 0} onClick={() => acceptOffer(offer.id)}>
                        Accept
                      </button>
                      <button className={styles.responderAction} type="button" onClick={() => setNegotiatingOfferId(offer.id)}>
                        Negotiate
                      </button>
                      <button className={styles.responderAction} type="button" onClick={() => rejectOffer(offer.id)}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                  {canNegotiate(offer) && negotiatingOfferId === offer.id ? (
                    <div className={styles.sagipNegotiateForm}>
                      <label>
                        Counter price (PHP)
                        <input type="number" min="1" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} />
                      </label>
                      <button className={styles.secondaryButton} type="button" onClick={() => sendCounter(offer)}>
                        Send counter-offer
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
