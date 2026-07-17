"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Host, StockItem } from "@/lib/kapitbiz";

export default function QRHandoff({
  item,
  host,
  confirmed,
  onBack,
  onConfirm,
}: {
  item: StockItem;
  host: Host;
  confirmed: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const payload = `KAPITBIZ|${item.id}|${host.id}|${Date.now()}`;
    QRCode.toString(payload, { type: "svg", margin: 0, color: { dark: "#1a1712", light: "#ffffff" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [item.id, host.id]);

  return (
    <div className="relay-screen">
      {!confirmed && (
        <button className="relay-back" onClick={onBack}>
          ← Back
        </button>
      )}
      <div className="relay-qr-screen">
        <h2>{confirmed ? "Handoff confirmed" : "Confirm handoff"}</h2>
        <div className="relay-qr-box" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="relay-qr-caption">
          {item.name} · ₱{item.value.toLocaleString()}
        </div>
        <div className="relay-custody">
          You → <b>{host.name}</b>, vetted since {host.vettedSince}
        </div>
        {confirmed && <div className="relay-confirmed">Custody confirmed</div>}
      </div>

      {!confirmed && (
        <div className="relay-bottom-bar">
          <button className="btn" onClick={onConfirm}>
            Confirm handoff
          </button>
        </div>
      )}
    </div>
  );
}
