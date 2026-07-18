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

## Judge path

```text
Onboarding -> Merchant setup -> Home -> Start rescue -> Triage -> Network match
-> Reservation -> Rider preview -> QR handoff -> Host confirmation
-> Completion -> Requests/Activity record
```

Use the seeded merchant path and select Northline Cold Storage plus Rider - Logistics Pro. The Host preview confirms the QR-backed receipt; return to Merchant and open `View Custody Record` to show the completed transaction.

This is a frontend-only, seeded, offline-capable, resumable demo. It has no authentication, backend, payment processing, live utility feed, live capacity, or live routing. Versioned browser `localStorage` restores onboarding progress, merchant tab, rescue step, reservation, and custody record after refresh. **Reset demo** is the only full restart: confirm it from Menu to clear both saved stores and start a newly timed incident.

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

Committed screenshots and measurements are in `docs/qa/kapitbiz-complete-demo/`. The QA run is reproducible with the commands above and `git diff --check` from the repository root.

The app is built with Next.js 16, React 19, TypeScript, Vitest, Testing Library, Lucide, Mapbox GL JS, QRCode, and localStorage persistence.
