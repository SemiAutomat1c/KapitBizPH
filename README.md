<p align="center">
  <img src="web/public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
</p>

# KapitBiz Relay

KapitBiz Relay is a mobile-first hackathon demo for rescuing at-risk MSME inventory during a localized disruption. The submitted app lives in [`web`](web).

---

## 🏆 Hackathon & Pitch Context

This project was built for the **Resilience Theme** (lot drawn on July 15, 2026). KapitBiz PH focuses on protecting local micro, small, and medium enterprises (MSMEs) from catastrophic inventory losses during localized disruptions (e.g., floods, brownouts) in **Tagum City**.

### Key Pitch Pillars:
1. **Three-Phase Resiliency Loop (AksyonNgayon)**:
   - **HANDA (Readiness)**: Profiling inventory, emergency contacts, and readiness scores.
   - **AKSYON (Trigger Action)**: Live incident alerts triggering same-day rescue matchmaking. Connects at-risk merchants with nearby Good Samaritan hosts offering temporary cold storage or dry capacity.
   - **BANGON (Damage Reporting)**: Compiling a loan-ready loss proof packet to access government calamity finance (e.g., SB Corp Emergency Relief Fund).
2. **Quantified Impact (₱ Protected)**: A platform-wide ledger demonstrating actual inventory value saved rather than just checking off features.
3. **Regulatory Moats**: Built-in compliance mechanisms for:
   - **Price Act (RA 7581)**: "Calamity Mode" enforcing official Suggested Retail Prices (SRP) to block crisis price-gouging.
   - **Internet Transactions Act (RA 11967)**: Platform-verified, anonymous buyer-seller matchmaking.
   - **NPC AI Advisory 2024-04**: Provisional onboarding tiers instead of automated AI rejections.

---

## 📁 Repository Layout

*   [`web/`](web): Reusable core web application (Next.js 16, TS, Vitest).
*   [`pitch/`](pitch): 12-slide editable presentation decks and printable judge Q&A guides.
*   [`planning/`](planning): Prep checklists, master idea lists, and legal compliance deep-dives.
*   [`docs/`](docs): System architecture designs, spec files, and verification walkthroughs.

---

## Deploy to Vercel

Import this repository in Vercel:

```text
https://github.com/SemiAutomat1c/KapitBizPH.git
```

Use these project settings:

```text
Root Directory: web
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
Output Directory: Next.js default
```

Optional environment variable:

```text
NEXT_PUBLIC_MAPBOX_TOKEN=your_public_scoped_mapbox_token
```

Mapbox is presentation-only. The app works without the token and falls back to the bundled offline route schematic.

## PWA Install

The app includes a web manifest, icons, service worker, Android install prompt, and iPhone Add to Home Screen guide. Real mobile install testing should use the Vercel HTTPS URL; laptop `localhost` is only for local development.

## Local Development

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
cd web
npm test
npm run lint
npm run build
```
