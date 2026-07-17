"use client";
import { useState } from "react";
import { AREAS, areaById, type Answer, type Vals } from "@/lib/core";
import { useEntries } from "@/lib/store";
import IntakeForm from "@/components/IntakeForm";
import Dashboard from "@/components/Dashboard";
import PriceBoard from "@/components/PriceBoard";
import RelayFlow from "@/components/kapitbiz/RelayFlow";

export default function Home() {
  // Default to KapitBiz Relay (resilience) — the drawn hackathon focus area.
  const [areaId, setAreaId] = useState("resilience");
  const area = areaById(areaId);
  const { entries, totalImpact, totalSecondary, addEntry, setStatus, resetDemo } =
    useEntries(areaId);
  const [lastAnswer, setLastAnswer] = useState<Answer | null>(null);

  const submit = (values: Vals) => {
    addEntry(values);
    setLastAnswer(area.answer(values));
  };

  const switchArea = (id: string) => {
    setAreaId(id);
    setLastAnswer(null);
  };

  const isKilo = area.id === "waste";
  const isRelay = area.id === "resilience";

  return (
    <main
      className={`wrap ${isKilo ? "theme-kilo" : ""}`}
      style={{ ["--accent" as string]: area.accent }}
    >
      <header className="top">
        <div className="kicker">
          {isRelay
            ? "Hackathon Challenge 2026 · Business Continuity & Disaster Resiliency"
            : isKilo
              ? "Hackathon Challenge 2026 · Waste-to-Value MVP"
              : "Hackathon Challenge 2026 · Tagum reusable core"}
        </div>
        <h1>{area.name}</h1>
        <p>
          {isRelay
            ? "When an outage or flood advisory hits, rank at-risk stock, reserve nearby vetted freezer/generator/dry-storage capacity, and confirm the handoff by QR — turning a warning into a completed rescue."
            : isKilo
              ? "Junkshop-side ops tool for Tagum: log every buy, check fair board price, track kg diverted and ₱ volume. Not a household recycle app — this is for the yard."
              : `${area.short}. One loop: enter → practical answer → save → impact metric grows.`}
        </p>
      </header>

      <nav className="tabs no-print" aria-label="Focus area">
        {AREAS.map((a) => (
          <button
            key={a.id}
            className="tab"
            aria-pressed={a.id === areaId}
            style={
              a.id === areaId
                ? { background: a.accent, borderColor: a.accent, color: "#fff" }
                : undefined
            }
            onClick={() => switchArea(a.id)}
          >
            {a.name}
            <span className="sub">{a.short}</span>
          </button>
        ))}
      </nav>

      {isRelay && <RelayFlow />}

      {isKilo && <PriceBoard />}

      {!isRelay && (
        <div className="grid">
          <IntakeForm area={area} onSubmit={submit} />
          <Dashboard
            area={area}
            entries={entries}
            totalImpact={totalImpact}
            totalSecondary={totalSecondary}
            lastAnswer={lastAnswer}
            onStatus={setStatus}
            onExport={() => window.print()}
          />
        </div>
      )}

      {!isRelay && (
        <div className="footnote no-print">
          <span>
            {isKilo
              ? "Board prices are demo ranges for pitch — label as indicative. Data stays in this browser."
              : "Demo data is stored in your browser."}
          </span>
          <button className="btn ghost small" onClick={resetDemo}>
            Reset demo data
          </button>
        </div>
      )}
    </main>
  );
}
