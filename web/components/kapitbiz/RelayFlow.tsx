"use client";
import { useState } from "react";
import { useKapitBiz } from "@/lib/kapitbiz";
import ProtectionLedger from "./ProtectionLedger";
import StockList from "./StockList";
import HostPicker from "./HostPicker";
import QRHandoff from "./QRHandoff";

type Step =
  | { kind: "list" }
  | { kind: "hosts"; itemId: string }
  | { kind: "qr"; itemId: string; hostId: string; confirmed: boolean };

export default function RelayFlow() {
  const { items, hosts, history, protectedValue, hoursPreserved, atRiskValue, confirmHandoff, resetDemo } =
    useKapitBiz();
  const [step, setStep] = useState<Step>({ kind: "list" });
  const [pulsing, setPulsing] = useState(false);

  const confirm = (itemId: string, hostId: string) => {
    confirmHandoff(itemId, hostId);
    setStep({ kind: "qr", itemId, hostId, confirmed: true });
    setTimeout(() => {
      setStep({ kind: "list" });
      setPulsing(true);
      setTimeout(() => setPulsing(false), 550);
    }, 1300);
  };

  return (
    <div className="relay">
      <ProtectionLedger
        protectedValue={protectedValue}
        hoursPreserved={hoursPreserved}
        atRiskValue={atRiskValue}
        pulsing={pulsing}
      />

      {step.kind === "list" && (
        <>
          <StockList items={items} onRescue={(itemId) => setStep({ kind: "hosts", itemId })} />
          {history.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="mlabel">Recent handoffs</div>
              {history.slice(0, 5).map((h) => (
                <div className="relay-history-item" key={h.id}>
                  <span className="l">{h.itemName} → {h.hostName}</span>
                  <span className="r">₱{h.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <button className="btn ghost small no-print" style={{ marginTop: 14 }} onClick={resetDemo}>
            Reset demo data
          </button>
        </>
      )}

      {step.kind === "hosts" && (
        <HostPicker
          item={items.find((i) => i.id === step.itemId)!}
          hosts={hosts}
          onBack={() => setStep({ kind: "list" })}
          onPick={(hostId) => setStep({ kind: "qr", itemId: step.itemId, hostId, confirmed: false })}
        />
      )}

      {step.kind === "qr" && (
        <QRHandoff
          item={items.find((i) => i.id === step.itemId)!}
          host={hosts.find((h) => h.id === step.hostId)!}
          confirmed={step.confirmed}
          onBack={() => setStep({ kind: "hosts", itemId: step.itemId })}
          onConfirm={() => confirm(step.itemId, step.hostId)}
        />
      )}
    </div>
  );
}
