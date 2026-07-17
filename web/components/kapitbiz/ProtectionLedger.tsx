"use client";

export default function ProtectionLedger({
  protectedValue,
  hoursPreserved,
  atRiskValue,
  pulsing,
}: {
  protectedValue: number;
  hoursPreserved: number;
  atRiskValue: number;
  pulsing: boolean;
}) {
  return (
    <div className={`relay-ledger${pulsing ? " pulse" : ""}`}>
      <div className="relay-ledger-cell">
        <div className="v">₱{protectedValue.toLocaleString()}</div>
        <div className="k">Value protected</div>
      </div>
      <div className="relay-ledger-cell">
        <div className="v">{hoursPreserved % 1 ? hoursPreserved.toFixed(1) : hoursPreserved}h</div>
        <div className="k">Ops preserved</div>
      </div>
      <div className="relay-ledger-cell">
        <div className="v" style={{ color: atRiskValue > 0 ? "var(--bad)" : "var(--ok)" }}>
          ₱{atRiskValue.toLocaleString()}
        </div>
        <div className="k">Still at risk</div>
      </div>
    </div>
  );
}
