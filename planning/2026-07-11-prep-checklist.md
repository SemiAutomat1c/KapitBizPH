# Pre-Hackathon Prep Checklist

Last updated: 2026-07-11
Context: focus area is drawn BY LOT at orientation. Prioritize prep that pays off in all 4 areas.

## Tier 0 — Before Monday July 13, 3:00 PM (hard deadline)

- [ ] Confirm team of 3 (all 18+, all enrolled college/university students).
- [ ] Assign roles: Builder 1 = frontend/UI/demo flow; Builder 2 = backend/data/integrations; Builder 3 = research/pitch/business model/judge Q&A.
- [ ] Scan the registration QR and submit. No concept required at registration.
- [ ] Watch for and save the email/SMS confirmation.
- [ ] Confirm all 3 can attend the virtual orientation + both event days in full (mandatory).

## Tier 1 — Reusable core (build ONCE, wins regardless of draw) — DONE 2026-07-11

Built at `web/` (Next.js 16 + Tailwind 4 + Convex). Config-driven; all 4 areas share one loop. Build passes, loop browser-verified.

- [x] Starter repo: Next.js (App Router) + TypeScript + Tailwind + Convex.
- [x] Reusable components:
  - [x] Intake form (dynamic fields from area config)
  - [x] Photo/camera upload (data URL)
  - [x] Location / barangay capture (real Tagum barangay dropdown)
  - [x] Dashboard shell with impact counter (big number tiles)
  - [x] List view with status pills + editable status
  - [x] PDF / shareable report export (browser print, no dependency)
  - [x] Seed data loads instantly; "Reset demo data" button
- [x] Design tokens (green/gold/teal/coral palette, light+dark).
- [x] `.env.local.example` for Convex URL; secrets not committed.
- [ ] Create GitHub repo + give all 3 members push access (Ryan to do).

## Tier 2 — Pitch & business (reusable structure, fill per area) — DONE 2026-07-11

Built in `pitch/`. 12-slide editable deck + printable judge Q&A one-pager.

- [x] Master pitch deck skeleton (8 beats + title/demo/Q&A/closing): `pitch/HackathonChallenge2026-Pitch-Skeleton.pptx`. Area-agnostic with [FILL] markers; 4-area defaults in speaker notes. QA'd (validate + visual render).
- [x] Hook slide with the "one real Tagum story" guidance + 4 default hooks in notes.
- [x] Judge Q&A one-pager (print + hold during Q&A): `pitch/judge-qa-onepager.md` — 9 standard questions incl. the "doesn't this exist?" distribution answer, per-area quick facts.
- [ ] Fill team name / project name / contact once team + area confirmed (Ryan).
- [ ] Partner cheat sheet (already in event-and-partner-brief.md) — know which lens each judge uses.
- [ ] Circular economy 10 Rs talking points for sustainability-heavy Q&A.

## Tier 3 — Per-area thin prep (all 4) — DONE 2026-07-11

Each area now has: (a) pre-loaded demo data in the web app (`web/lib/core.ts` seed, enriched so live impact numbers look substantial), and (b) a fully filled, presentation-ready deck in `pitch/decks/`.

- [x] Circular Agriculture — BanaLoop: `pitch/decks/01-Circular-Agri_BanaLoop.pptx` + seed listings (~585 kg live).
- [x] Waste-to-Value — Palengke Loop: `pitch/decks/02-Waste-to-Value_PalengkeLoop.pptx` + seed bins (~110 kg live).
- [x] Aquaculture — BantayPond: `pitch/decks/03-Aquaculture_BantayPond.pptx` + seed readings (threshold alerts fire).
- [x] Business Resilience — BCP Buddy: `pitch/decks/04-Resilience_BCPBuddy.pptx` + seed BCPs.
- All 4 decks validated + spot-rendered. Still to fill on the day: team/project/contact + a live screenshot.
- Optional deepening (not blocking): BCP Buddy's real 10 Taglish questions, HazardHunterPH lookup, BanaLoop buyer personas.

## Tier 4 — Hardware (ONLY if you want the BantayPond edge)

- [ ] Order ESP32 + pH/temp/turbidity sensors NOW (shipping is the risk, not code).
- [ ] Build dashboard on SIMULATED data first; wire real sensor last.
- [ ] Rehearse the simulated-data fallback twice — a dead sensor on stage loses.
- [ ] If parts won't arrive by Jul 17, drop hardware; demo BantayPond with simulated data.

## Tier 5 — Team & logistics

- [ ] Laptops + chargers + extension cord/power strip.
- [ ] Backup internet (pocket wifi / mobile data) — venue wifi is never reliable.
- [ ] API keys ready: Gemini (Taglish summaries / vision), Roboflow if needed.
- [ ] Phone for live mobile demo (the two-phone moment for KiloKita/dashboards).
- [ ] Printed handouts: sample BCP card, one-pager, business model.

## Tier 6 — Practice (the day before)

- [ ] Run the full demo loop end to end 3x.
- [ ] Time the pitch (usually 3–5 min) — cut to fit.
- [ ] Assign who clicks, who talks, who answers Q&A.
- [ ] Prepare for the "doesn't this already exist?" question (distribution answer).

## Demo rule

One complete loop beats five unfinished features:
user inputs -> app returns practical answer -> app saves/exports -> dashboard shows one quantified impact number.
