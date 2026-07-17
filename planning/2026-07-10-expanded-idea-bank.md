# Expanded Idea Bank — 3 Ideas per Focus Area

Last updated: 2026-07-10
Mockups + full detail: https://claude.ai/code/artifact/31004546-9022-4b7c-9c5a-8dc93976e90b

## Fresh Intel (researched 2026-07-10)

- Circulab is actively granting up to EUR 19,445 (~PHP 1.3M) for Mindanao circular economy ventures (waste-to-value, circular materials, regenerative agri, climate-smart production). Say "Circulab-fundable venture" in the pitch. Source: PIA.
- 2026 MSME Development Week theme: "Navigating the Shift: Building Resilient and Future-Ready MSMEs." Close every pitch with this language. Source: Davao City Gov.
- Feed is ~70% of aquaculture cost; BFAR ADMP 2025-2030 + 2025 aquafeed convergence project target it. National hook for any pond idea.
- BSF (black soldier fly) is PH-proven: Insiklo already converts market/household waste to feed + fertilizer; larvae ~43% protein; APAC market ~14% CAGR.
- PDRF's national MSME preparedness tools are assessment checklists, not generators — BCP Buddy's gap is real.
- 2025 peer-reviewed research validates low-cost edge-AI water quality prediction for tilapia (PMC12526668) — cite for AquaSense scalability.

## Area 1: Circular Agriculture & Agribusiness

1. **BanaLoop Tagum** (top pick) — banana byproduct exchange: pseudostems/leaves/rejects matched to fiber, flour, compost, packaging buyers. Metric: kg diverted + PHP value per barangay cluster.
2. **SakaFeed** — byproduct-to-feed ration formulator (rice bran, reject banana, copra) with least-cost mix + PHP saved vs commercial feed. Rules engine + optional Gemini explainer. Weekend-safe.
3. **KompostKita** — barangay compost credit loop: QR weigh-in, credits redeemable as compost/fertilizer discount at co-op. Metric: tons composted/barangay/month. Stretch: needs co-op story.

## Area 2: Waste-to-Value Innovations

1. **Palengke Loop** (top pick) — Tagum public market food waste → BSF/compost route: vendors flag full bins, operators run pickup routes, dashboard shows kg → feed produced. Weekend-safe.
2. **KiloKita** — reframed to junk-shop-side ops tool (price board, pickup bookings, inventory). Consumer side is crowded: TrashCash (born at a 2019 PH hackathon), ScrapCycle (Butuan), SM trash-to-cash. Weakest card; pivot to Palengke Loop if judges push.
3. **BalotVerde** — compostable packaging supply link (banana-leaf wraps, fiber trays) for food MSMEs; pairs with BanaLoop as one value chain. Metric: plastics displaced/month. Stretch.

## Area 3: Aquaculture & Fisheries Innovation

1. **BantayPond** (top pick; renamed from AquaSense Lite — "Aquasense" is an existing commercial sensor by Aqsen Innovations) — ESP32 water-quality kit (temp/pH/turbidity) + alert dashboard. Rehearse simulated-data fallback twice. Say "blue economy" to BUGSAI; cite BFAR ADMP + edge-AI paper. Edge vs incumbents: price point, Taglish advice layer, SMS alerts, co-op distribution.
2. **PondLog** — offline-first feed/mortality logbook computing FCR + PHP/day; attacks the 70% feed cost with zero hardware. Weekend-safe. Answers "what works offline?"
3. **IsdaLink** — harvest pre-sell board: operators post harvest date/kg, buyers reserve ahead. Metric: % pre-sold + PHP premium vs traders. Stretch: needs buyer personas.

## Area 4: Business Continuity & Disaster Resiliency

1. **BCP Buddy Tagum** (top pick) — Taglish 10-minute BCP generator with risk score, checklist, 1-page PDF, HazardHunterPH hazard framing. Matches 2026 theme verbatim.
2. **DamageSnap MSME** — photos in → claim/aid-ready visible-damage report PDF (Gemini vision drafts, owner confirms, geotag + timestamp). Metric: days shaved off aid filing.
3. **BangonBoard** — post-disaster open/closed/need-help map; "need help" pings Negosyo Center queue; LGU sees recovery heatmap. Pitch as BCP Buddy phase two. Stretch: trust/participation.

## Competitive Scan (2026-07-10)

Judge-proof answer to "doesn't this exist?": existing players serve Manila consumers, large firms, or PHP 50k budgets — none reach a sari-sari store or 500 m² fishpond in Tagum. Our innovation is distribution: Taglish, offline-capable, free at point of use, Negosyo Center pilot in 30 days. Competitors = evidence of demand.

- Genuinely open: BanaLoop (no PH banana byproduct exchange found; WasteX/biochar is closest), BCP Buddy (PDRF tools are checklists, not generators), Palengke Loop (BSF operators exist = proof, not competitor; the routing layer is unbuilt).
- Contested but viable: BantayPond (academic IoT builds + Aqsen commercial sensor — win on price/advice/SMS), SakaFeed (FeedCalculator-type apps exist — win on free local byproducts + PHP framing), DamageSnap/BangonBoard/IsdaLink/KompostKita (global analogues, no local workflow fit).
- Crowded: KiloKita consumer side (TrashCash, ScrapCycle, SM) — shop-side flip only, weakest card.

## Choose-Your-Area Ranking

| Rank | Idea | Build risk | Why |
| --- | --- | --- | --- |
| 1 | BCP Buddy Tagum | Low | Theme match verbatim; easiest to fully finish + polish |
| 2 | BanaLoop Tagum | Low | Strongest local story; Circulab-fundable framing |
| 3 | Palengke Loop | Low-mid | Named route, PH-proven BSF economics |
| 4 | BantayPond | High (hardware) | Best stage demo if sensor behaves; simulated fallback mandatory |

## Sources

- https://pia.gov.ph/news/circulab-to-accelerate-circular-economy-startups-in-mindanao/
- https://davaocity.gov.ph/business-and-industry-support-development/2026-msme-development-week-celebration-starts/
- https://www.imarcgroup.com/philippines-aquafeed-market
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12526668/
- https://ati2.da.gov.ph/ati-main/content/article/jenny-rose-gabao/agri-asenso-revolutionizing-agriculture-black-soldier-fly-farming
- https://www.preventionweb.net/news/digital-tools-msme-disaster-preparedness-launched
- https://flybox.bio/knowledge-centre/bsf-regulations/philippines
