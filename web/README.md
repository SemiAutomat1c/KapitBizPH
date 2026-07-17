# KapitBiz Relay

KapitBiz Relay is a mobile-first hackathon demo for rescuing at-risk MSME inventory during a localized disruption. The seeded scenario follows Maya's Frozen Goods from a Tagum power interruption through cold-storage matching, transport reservation, QR custody handoff, and a completed rescue record.

This is a simulated business-continuity transaction, not a preparedness checklist and not a live utility, routing, or food-safety service.

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

## Demo flow

1. Open the simulated localized power interruption.
2. Start inventory rescue and triage 42 kg worth PHP 16,500.
3. Review ranked cold-storage capacity and select Northline Cold Storage.
4. Reserve 12 hours of storage for PHP 300 and a rider for PHP 150.
5. Confirm the QR handoff using record `RE-4892-X`.
6. Show the protected inventory, PHP 450 rescue cost, and custody timeline.

Progress is stored in versioned browser `localStorage`, so refreshing resumes the current rescue step. **Reset demo** on the completion screen creates a fresh incident and clears the active transaction.

## Verify

```bash
npm test
npm run lint
npm run build
```

The app is built with Next.js 16, React 19, TypeScript, Vitest, Testing Library, Lucide, Mapbox GL JS, QRCode, and localStorage persistence.
