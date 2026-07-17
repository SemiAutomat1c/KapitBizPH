# KiloKita MVP Design

Date: 2026-07-12  
Status: Approved for build (user request: create MVP)  
Area: Waste-to-Value · Hackathon Challenge 2026 Tagum

## Problem

Tagum junkshop owners buy scrap by hand with informal prices. Consumer apps (TrashCash, ScrapCycle) serve households. The shop itself has no free ops tool for buy log + fair price check + kg/₱ tracking.

## First user

One junkshop owner / yard staff in Tagum (e.g. near public market).

## MVP loop (one complete loop)

1. **Intake:** material, kg, ₱/kg paid, source, barangay, optional photo  
2. **Answer:** fair price board range + over/under pay verdict + total ₱ + tip  
3. **Save:** entry with status Bought → Stocked → Sold upstream  
4. **Impact:** headline **kg scrap processed** + secondary **₱ buy volume**

## Non-goals (YAGNI)

- Two-sided marketplace / household app  
- Live market price API  
- Pickup logistics routing  
- Auth / multi-shop accounts  

## Data model

Uses existing `Entry` + `AreaConfig` in `web/lib/core.ts`. Waste area (`id: "waste"`) becomes KiloKita.

Indicative price board (demo ranges, Taglish-labeled as “board estimate”):

| Material | Low–High ₱/kg |
| --- | --- |
| PET bottles | 8–15 |
| Soft plastic | 3–8 |
| Carton / paper | 2–6 |
| Aluminum cans | 40–70 |
| Copper wire | 280–420 |
| Iron / steel | 8–16 |
| Glass bottles | 1–3 |

## UI approach

Reuse config-driven shell. Design direction: **industrial weigh-station ticket** — kraft paper ground, heavy ink borders, brass/amber accent, mono numerals for kg and ₱. Taglish microcopy.

## Success criteria

- Submit buy → answer card with fair price + ₱ total  
- Impact tiles show kg + ₱  
- Seed data looks like a real Tagum yard  
- `npm run build` passes  
- Works offline (localStorage)
