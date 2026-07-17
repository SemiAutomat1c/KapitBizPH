"use client";
import { type AreaConfig, type Answer, type Entry } from "@/lib/core";

function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function toneOf(area: AreaConfig, e: Entry) {
  return area.answer(e.values).tone;
}

function summarize(area: AreaConfig, e: Entry) {
  const v = e.values;
  // KiloKita-friendly summary
  if (area.id === "waste" && v.material) {
    const qty = v.qty ? `${v.qty} kg` : "";
    const price = v.pricePerKg ? `₱${v.pricePerKg}/kg` : "";
    const total =
      v.qty && v.pricePerKg
        ? `₱${Math.round(Number(v.qty) * Number(v.pricePerKg)).toLocaleString()}`
        : "";
    return [v.material, qty, price, total].filter(Boolean).join(" · ");
  }
  return area.fields
    .filter((f) => f.type !== "photo" && e.values[f.key])
    .map((f) => `${e.values[f.key]}${f.unit ? f.unit : ""}`)
    .join(" · ");
}

export default function Dashboard({
  area,
  entries,
  totalImpact,
  totalSecondary,
  lastAnswer,
  onStatus,
  onExport,
}: {
  area: AreaConfig;
  entries: Entry[];
  totalImpact: number;
  totalSecondary: number;
  lastAnswer: Answer | null;
  onStatus: (id: string, status: string) => void;
  onExport: () => void;
}) {
  const hasSecondary = Boolean(area.secondaryImpactLabel && area.secondaryImpact);

  return (
    <div className="panel panel-dash">
      <div className="panel-stamp" aria-hidden>
        YARD LOG
      </div>
      <div className={`tiles ${hasSecondary ? "tiles-3" : ""}`}>
        <div className="tile">
          <div className="v mono">{totalImpact.toLocaleString()}</div>
          <div className="k">{area.impactLabel}</div>
        </div>
        {hasSecondary && (
          <div className="tile tile-gold">
            <div className="v mono">₱{totalSecondary.toLocaleString()}</div>
            <div className="k">{area.secondaryImpactLabel}</div>
          </div>
        )}
        <div className="tile">
          <div className="v mono">{entries.length}</div>
          <div className="k">entries logged</div>
        </div>
      </div>

      {lastAnswer && (
        <div className={`answer ${lastAnswer.tone}`}>
          <div className="answer-label">Ticket / answer</div>
          <h3>{lastAnswer.title}</h3>
          <ul>
            {lastAnswer.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mlabel">Recent buys / entries</div>
      {entries.length === 0 && (
        <p className="hint">No entries yet — log a buy on the left.</p>
      )}
      {entries.slice(0, 8).map((e) => (
        <div className="entry" key={e.id}>
          <div className="t">
            <span>{summarize(area, e)}</span>
            <span className={`pill ${toneOf(area, e)}`}>{e.status}</span>
          </div>
          <div
            className="s"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {e.values.shop || e.values.barangay || ""}
              {e.values.shop && e.values.barangay ? " · " : ""}
              {e.values.shop && e.values.barangay ? e.values.barangay : ""}
              {(e.values.shop || e.values.barangay) && " · "}
              {timeAgo(e.createdAt)}
            </span>
            <select
              className="no-print"
              value={e.status}
              onChange={(ev) => onStatus(e.id, ev.target.value)}
              aria-label="Update status"
            >
              {area.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <button className="btn ghost no-print" style={{ marginTop: 12 }} onClick={onExport}>
        Export / print yard report (PDF)
      </button>
    </div>
  );
}
