# KapitBiz Relay — Implementation Design

Date: 2026-07-17 · Validated via brainstorming + ui-ux-designer/mobile-developer subagent consults.

## What we're building

The resilience area's hero loop: a rescue-dispatch flow for a Tagum MSME during a power outage/flood advisory. Not a form-and-answer app (the existing `AreaConfig` pattern doesn't fit) — a linear, multi-step task flow with real state transitions.

## Visual approach

**Reuse the existing parchment/paper-ledger system, don't fork it.** The "feels like a webpage" complaint that killed the original Aksyon Ngayon UI came from the two-column form+dashboard *layout*, not the visual material itself. Keep:

- `globals.css` tokens: `--paper`, `--card`, `--ink`, `--line`, hard offset shadows, `.panel-stamp`, `.entry`, `.pill`, `.price-board`
- Archivo (display) + IBM Plex Mono (labels/numbers)

Change:

- **Layout**: single-column, one full-screen step at a time — not the existing intake-form grid.
- **Accent**: this area uses `--bad` (urgency red-brown) as its primary accent, not gold. `--ok` marks rescued/confirmed, `--warn` marks soon-to-spoil.

## Data model

New dedicated store (not `Entry`/`AreaConfig`/`useEntries` — that shape is for single-form logging, this is stateful multi-step rescue):

- `StockItem`: id, name, reason, spoilSpeed label, ₱ value, urgency (hi/md/lo), status (at-risk → reserved → rescued), reservedHostId
- `Host`: id, name, icon, meta (distance/capacity), whyAvailable, vetted (always true — closed cluster)
- Persisted to localStorage (new key), seeded on first load like the existing pattern in `lib/store.ts`
- Derived: `protectedValue` (sum of rescued item values), `hoursPreserved` (rescued count × assumed hours/item)
- History log of completed handoffs (item, host, timestamp) for the ledger summary screen

## Flow — 4 screens, one component tree

1. **Stock list** — ranked rows, urgency pill, "Rescue" button per row. Persistent ledger bar pinned above.
2. **Host picker** — capped at 4 fixed vetted hosts, "Chamber-Vetted" badge on every card, "X of 4 pilot partners available" counter, no search/filter. Back top-left.
3. **QR handoff** — real QR generation (client-side lib, no camera scanning — confirm is a tap), named custody line, "CUSTODY CONFIRMED" stamp on confirm, auto-return to step 1 with ledger pulse.
4. **Ledger summary** (folded into step 1's top state, not a separate route) — running ₱ protected + hours preserved + recent handoff history.

State machine lives in one `RelayFlow` orchestrator component; each screen is a child, swapped via local state (not Next.js routes — keeps it simple, avoids URL/back-button complexity for a kiosk-style demo flow).

## Trust signal implementation

- Host list is a fixed array of exactly 4, never filtered/searched
- Every host card carries a vetted badge, not just a top-of-list disclaimer
- Confirm screen states custody as "You → [Host name], vetted since [date]"

## Scope for tonight

Build and verify the full Relay loop (screens 1–3 + ledger) end to end. PWA manifest + minimal service worker included (cheap, real demo credibility). Resilience Receipt (recovery tab) is phase 2 — only attempted if the Relay loop is solid with time to spare.

## Files touched

- `web/lib/kapitbiz.ts` (new) — data model, seed, store hook
- `web/app/globals.css` (extend) — new layout classes
- `web/components/kapitbiz/` (new dir) — ProtectionLedger, StockList, HostPicker, QRHandoff, RelayFlow
- `web/app/page.tsx` (edit) — special-case resilience area to render RelayFlow
- `web/public/manifest.json`, `web/public/sw.js` (new), `web/app/layout.tsx` (edit) — PWA
