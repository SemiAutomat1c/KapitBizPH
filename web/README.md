<p align="center">
  <img src="public/illustrations/kapitlogo.png" alt="KapitBizPH Logo" width="400" />
</p>

# KapitBiz Relay

KapitBiz Relay is a mobile-first hackathon demo for rescuing at-risk MSME inventory during a localized disruption.

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

## 🧭 Judge Demo Walkthrough

To experience the entire business-continuity flow end-to-end, follow this seeded judge path:

```text
Onboarding -> Merchant Home -> Run Safety Check -> Stock at risk
-> generator PHP714 vs Relay PHP450 -> Ask nearby hosts
-> Use Northline Cold Storage in Relay -> Reservation -> Rider dispatch
-> QR handoff -> Host confirmation -> PHP protected record
-> Recovery packet preview -> Activity audit trail
```

### Step-by-Step Interactive Guide:
1. **Start**: Complete the onboarding flow as Maya (Maya's Frozen Goods).
2. **Trigger Safety Check**: On the Merchant Home, run a safety check during a simulated Tagum power/flood incident.
3. **Analyze & Match**: Compare the cost of running a local generator vs. using the Relay network. Select **Ask nearby hosts**.
4. **Reserve Capacity**: Choose **Northline Cold Storage** and make a capacity reservation.
5. **Simulate Rider Dispatch**: Hand off the inventory to the volunteer rider using the **QR custody verification**.
6. **Host Confirmation**: Toggle/preview the Host confirmation panel to seal the QR-backed receipt.
7. **Verify Audit Trail**: Return to the Merchant dashboard and open **View Custody Record** or **Recovery Packet Preview** to view the completed transaction evidence and SB Corp-ready loan document.

*Note: The demo is fully client-side and resumable (persisted via versioned browser `localStorage`). Use the **Reset Demo** button in the Menu to clear the session and start fresh.*

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To use the dedicated QA port:

```bash
npm run dev -- --port 3017
```

## Optional Mapbox view

The complete rescue flow works without Mapbox. List view is the default, and the Map tab falls back to a bundled offline route schematic when the token or tiles are unavailable.

To enable the Mapbox presentation, create `web/.env.local`:

```text
NEXT_PUBLIC_MAPBOX_TOKEN=your_public_scoped_token
```

Use a least-privilege public token restricted to the deployed origin. Do not commit the token.

Mapbox is presentation-only. Host availability, affected-area status, route shape, distance, and travel time remain seeded demo data. The app does not call Directions, Geocoding, Traffic, or Optimization APIs.

## Deploy to Vercel

Import `https://github.com/SemiAutomat1c/KapitBizPH.git` and set:

```text
Root Directory: web
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

Leave **Output Directory** on Auto / blank — do not type anything into it. Vercel's dashboard shows "Next.js default" as greyed-out placeholder text meaning "leave this empty, we'll detect `.next` automatically." Typing that placeholder text in as a literal value breaks the build with `Error: The Next.js output directory "Next.js default" was not found`.

Set `NEXT_PUBLIC_MAPBOX_TOKEN` only if you want the optional Mapbox presentation. The PWA install flow should be tested on the deployed HTTPS URL, not only on local network URLs.

## Verify

```bash
npm test
npm run lint
npm run build
```

For the full browser QA pass, serve the built app at `http://localhost:3017`:

```bash
npm run start -- --port 3017
```

Committed screenshots and measurements are in `docs/qa/kapitbiz-complete-demo/` and `docs/qa/kapitbiz-hazard-assist/`. The QA run is reproducible with the commands above and `git diff --check` from the repository root.

The app is built with Next.js 16, React 19, TypeScript, Vitest, Testing Library, Lucide, Mapbox GL JS, QRCode, and localStorage persistence.
