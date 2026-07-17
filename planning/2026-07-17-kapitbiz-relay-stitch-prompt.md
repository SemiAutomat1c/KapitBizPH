# KapitBiz Relay — Google Stitch Prompt

Use for design exploration before the real Next.js build. Matches the direction validated by the ui-ux-designer + mobile-developer subagent consults: keep the app's existing parchment/paper-ledger visual language, single-column task-flow layout (not a generic form), urgency color system, vetted-cluster trust signals.

---

## Prompt

```
Design a mobile-first web app called "KapitBiz Relay" — a disaster-continuity rescue dispatch tool for small business owners (sari-sari stores, carinderias, fish stalls) in Tagum City, Philippines, used during a power outage or flood advisory to save perishable stock before it spoils.

VISUAL STYLE: Warm parchment/paper-ledger aesthetic, like an official form or market receipt — not a generic Material Design or flat SaaS look. Cream/parchment background (#F3EFE4). Cards with solid dark ink borders (#2A241C) and a hard offset drop shadow (like a stamped paper card lifted off the page, shadow offset ~4-6px down-right, no blur, no soft glassmorphism). Typography: a bold geometric grotesque display font for headings, a monospace font for small uppercase labels, timestamps, and numbers (tabular figures). Small rotated "stamp" badges (like a rubber ink stamp, ~3-4 degrees rotated, bordered box) used for status markers. Urgency-driven color system: red-brown (#A33A2A) for critical/at-risk, amber (#9A6B12) for warning, forest green (#1F6B3A) for safe/confirmed/rescued. Accent color for this app is the red-brown urgency tone, not gold.

LAYOUT: Single-column, mobile-first, one full-screen step at a time (not modals or bottom sheets) — this is a linear task flow under time pressure, not a browsing app. A persistent bar pinned at the top of every screen shows two live numbers: "₱ Value Protected" and "Hours of Operation Preserved" — styled like a small ledger/receipt summary strip. Primary action button is always in a sticky bar at the bottom of the screen, full-width, thumb-reachable.

SCREENS TO DESIGN:

1. AT-RISK STOCK — A ranked list of 3-5 inventory items threatened by the outage/flood, each row showing: item name, a short reason ("chest freezer · spoils in ~2 hrs"), a ₱ value, and an urgency dot/pill (red = critical, amber = soon). Each row has a "Rescue" button. Top bar shows the live ₱-protected / hours-preserved ledger.

2. HOST PICKER — After tapping Rescue, show a capped list of exactly 4 nearby vetted hosts with spare capacity (a neighbor's freezer on a working power feeder, a Chamber-run generator-backed cold room, elevated dry storage, a courier/pickup option). Each host card has: an icon, name, one-line distance/capacity detail, a small "Chamber-Vetted" badge, and a short "why available now" reason (e.g. "on a different feeder — still has power"). Show a small counter like "4 of 4 pilot partners available." No search bar, no filters — this is a closed, pre-approved cluster, not an open marketplace. Back button top-left.

3. QR HANDOFF CONFIRMATION — Full-screen, centered QR code representing the custody handoff, with a caption showing the item name, ₱ value, and destination host. Below it, a named custody line like "You → Aling Rosa's Store, vetted since Jan 2026." A "Confirm Handoff" button in the sticky bottom bar. On confirm, show a rotated ink-stamp badge that reads "CUSTODY CONFIRMED."

4. HOME/LEDGER SUMMARY — A dashboard-style screen showing the running total of ₱ value protected across all rescued items, hours of business operation preserved, and a short history list of completed handoffs (item, host, timestamp), styled as receipt-like entries.

TONE: Practical, urgent, trustworthy — like an official emergency-response tool built for real MSME owners, not a flashy startup app. Should feel calm and authoritative under pressure, not playful.
```

---

## Notes for using the output

- Stitch output is inspiration/reference only — the actual build reuses the existing codebase's CSS (`web/app/globals.css`: `.entry`, `.pill`, `.panel-stamp`, `.price-board`, `--ok`/`--warn`/`--bad` tokens) rather than starting a new design system from scratch.
- If Stitch's output pulls too far toward glassmorphism/soft shadows/rounded Material style, that's a prompt-adherence miss — the hard offset shadow + ink border + stamp-badge language is the load-bearing detail that keeps it "paper-ledger," not "generic app."

---

## Open variant — let Stitch pick the visual direction

The prompt above encodes a specific recommendation (reuse the app's existing parchment/paper-ledger system) that came from consulting ui-ux-designer + mobile-developer subagents, not from Stitch itself. Use this version instead if the goal is genuine open exploration — seeing what an AI design tool proposes on its own, unprompted by our existing direction — rather than validating the direction we already picked.

```
Design a mobile-first web app called "KapitBiz Relay" — a disaster-continuity rescue dispatch tool for small business owners (sari-sari stores, carinderias, fish stalls) in Tagum City, Philippines, used during a power outage or flood advisory to save perishable stock before it spoils.

CONTEXT: Users are MSME owners acting under real time pressure — often one-handed on a phone, sometimes with unreliable connectivity. The tool must feel practical, urgent, and trustworthy, like a serious emergency-response utility for real local business owners — not a playful consumer app, and not a generic flat SaaS dashboard. This is a Philippine local-business context, not a Silicon Valley startup context — avoid generic "tech startup" visual clichés (soft gradients, glassmorphism, stock-photo hero sections).

Propose and apply whatever visual style — color palette, typography, shadow/elevation treatment, overall design language — you believe best fits this context and these users. Briefly explain your visual choice and why it fits before showing the screens.

SCREENS TO DESIGN:

1. AT-RISK STOCK — a ranked list of 3-5 inventory items threatened by the outage/flood, each row showing item name, a short reason ("chest freezer · spoils in ~2 hrs"), a ₱ value, and an urgency indicator (critical vs soon). Each row has a "Rescue" action. A persistent summary strip stays visible showing two live numbers: "₱ Value Protected" and "Hours of Operation Preserved."

2. HOST PICKER — after tapping Rescue, a capped list of exactly 4 nearby vetted hosts with spare capacity (a neighbor's freezer on a working power feeder, a Chamber-run generator-backed cold room, elevated dry storage, a courier/pickup option). Each host card shows an icon, name, one-line distance/capacity detail, a vetted/trusted indicator, and a short "why available now" reason. No search bar or filters — this is a closed, pre-approved cluster, not an open marketplace, and the design should make that read clearly without needing to say so in a paragraph of copy.

3. QR HANDOFF CONFIRMATION — a screen showing a QR code representing the custody handoff, with the item name, ₱ value, and destination host. A named custody line ("You → [Host name], vetted since [date]"). A confirm action, and a clear "confirmed" state once tapped.

4. LEDGER SUMMARY — running total of ₱ value protected, hours of business operation preserved, and a short history of completed handoffs.

LAYOUT: Mobile-first, one full task-flow step at a time (not modals or bottom sheets) — this is a linear task under time pressure, not a browsing app. Primary action always thumb-reachable at the bottom of the screen.

Generate the screens in whatever visual language you believe genuinely serves an urgent, trustworthy, locally-grounded MSME tool.
```
