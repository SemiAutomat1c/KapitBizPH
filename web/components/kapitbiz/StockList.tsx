"use client";
import type { StockItem } from "@/lib/kapitbiz";

export default function StockList({
  items,
  onRescue,
}: {
  items: (StockItem & { status: "at-risk" | "rescued" })[];
  onRescue: (itemId: string) => void;
}) {
  return (
    <div className="relay-screen">
      <h2>At-risk stock</h2>
      <p className="hint">Ranked by ₱ value × how fast it spoils. Rescue the most urgent first.</p>

      {items.map((item) => (
        <div className={`relay-row${item.status === "rescued" ? " rescued" : ""}`} key={item.id}>
          <span className={`relay-dot ${item.urgency}`} aria-hidden />
          <div className="relay-row-body">
            <div className="t">{item.name}</div>
            <div className="s">{item.reason}</div>
          </div>
          {item.status === "rescued" ? (
            <span className="relay-row-value">₱{item.value.toLocaleString()}</span>
          ) : (
            <button className="btn small" onClick={() => onRescue(item.id)}>
              Rescue
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
