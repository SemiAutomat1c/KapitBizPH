"use client";
import { KILOKITA_BOARD } from "@/lib/core";

const rows = Object.entries(KILOKITA_BOARD);

export default function PriceBoard() {
  return (
    <section className="price-board no-print" aria-label="Indicative scrap price board">
      <div className="price-board-head">
        <div>
          <div className="price-board-kicker">Today&apos;s board · Tagum demo</div>
          <h2>Scrap price board</h2>
        </div>
        <p className="price-board-note">
          Indicative ₱/kg ranges for the pitch — not a live exchange. Junkshop compares what they
          paid vs this board.
        </p>
      </div>
      <div className="price-board-grid">
        {rows.map(([material, p]) => (
          <div className="price-chip" key={material}>
            <div className="price-mat">{material}</div>
            <div className="price-nums mono">
              <span>₱{p.low}</span>
              <span className="price-mid">₱{p.mid}</span>
              <span>₱{p.high}</span>
            </div>
            <div className="price-scale">
              <span>low</span>
              <span>mid</span>
              <span>high</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
