# KapitBiz Relay

KapitBiz Relay is a mobile-first hackathon demo for rescuing at-risk MSME inventory during a localized disruption. The submitted app lives in [`web`](web).

This is a frontend-only, seeded business-continuity transaction demo. It does not claim live utility feeds, government hazard feeds, payments, live routing, live capacity, insurance approval, or government-form acceptance.

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
