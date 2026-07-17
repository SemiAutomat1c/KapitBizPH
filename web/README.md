# Hackathon Challenge 2026 — Tagum Reusable Core

A config-driven starter for a random-draw hackathon. All four focus areas share **one loop**:

> intake form → practical answer → save → impact metric grows.

On event day you find out your area, then customize **one file** (`lib/core.ts`) instead of building from scratch.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Seed data loads automatically (stored in your browser). "Reset demo data" restores it.

## How it's built (so you can extend it in 5 minutes)

| File | What it does |
| --- | --- |
| `lib/core.ts` | **The one file that matters.** Defines the 4 areas: intake fields, the `answer()` logic, and the `impact()` metric. Edit this to change an idea. |
| `lib/store.ts` | Data layer. localStorage by default (offline-safe demo). Swap to Convex — see below. |
| `components/IntakeForm.tsx` | Renders fields from the area config. Handles text, number, select, barangay, photo. |
| `components/Dashboard.tsx` | Impact tiles, the answer card, recent entries with status pills + PDF export. |
| `app/page.tsx` | Tabs + wires the two panels together. |

### Add or change an area

Edit the `AREAS` array in `lib/core.ts`. Each area is:

```ts
{
  id, name, short, accent,          // identity + accent color
  intakeTitle, fields, statuses,    // the intake form
  impactLabel,                      // dashboard tile label
  impact: (v) => number,            // what each entry contributes
  answer: (v) => { title, lines, tone },  // the practical answer returned
}
```

That's the whole extension surface. No other file needs touching for a new idea.

## Switch localStorage → Convex (live sync, real backend)

The Convex backend is already written in `convex/` (`schema.ts`, `entries.ts`). To go live:

1. `npx convex dev` — logs in, creates your deployment, writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`, and generates `convex/_generated/`.
2. Wrap the app in a Convex provider (`app/providers.tsx` with `ConvexProvider`), and replace the body of `useEntries` in `lib/store.ts` with `useQuery(api.entries.list, { areaId })` / `useMutation(api.entries.add)` / `api.entries.setStatus`.
3. Remove `"convex"` from the `exclude` array in `tsconfig.json` once `_generated` exists.

The localStorage default is intentional: it runs with zero setup and **survives bad venue wifi during the demo**. Switch to Convex only if you need multi-device live sync on stage.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind 4 · Convex 1.42 · localStorage demo store.

Note: this project runs on a pre-release Next.js 16 with breaking changes — see `AGENTS.md`.
