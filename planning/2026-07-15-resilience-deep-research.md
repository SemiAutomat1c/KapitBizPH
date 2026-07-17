# Resilience Area — Deep Research (post lot draw)

Date: 2026-07-15 · Area drawn: **Business Continuity & Disaster Resiliency** · Event: Jul 18–19

## Verdict on the existing list

**AksyonNgayon + StallShield stays the hero — but upgrade it from "alert → action" to the full continuity cycle.** Merge DamageSnap into it as the recovery phase instead of keeping it on the bench. BCP Buddy stays demoted (DTI+SM are already running a nationwide BCP training program — it's a crowded lane, but a good distribution hook). BangonBoard stays stretch. FairFare drop.

### Proposed hero shape: "AksyonNgayon" (working title) — 3 phases, one app

1. **HANDA (before):** business type + barangay → 5-min readiness score (mini-BCP), protection-gap nudge (microinsurance ~₱250/yr for ₱20k coverage exists; most MSMEs don't know)
2. **AKSYON (trigger):** advisory level in → same-day prioritized action cards (elevate stock, pre-sell perishables, GCash float, supplier SMS template) → tick actions → ₱ inventory protected
3. **BANGON (after):** photo + note per damage item → claim-ready damage report PDF aimed at **SB Corp ERF loan applications** and insurance claims → days-to-reopen metric

Why this is stronger: judges get prepare→act→recover in one demo loop; the "who pays / what next" answer is built in (ERF is a real, currently-open government loan rail for calamity-declared areas); it absorbs the DamageSnap bench idea rather than wasting it.

## Fresh evidence (use in the pitch — all from this month/year)

- **RA 12287** — the Philippines' anticipatory-action law (world-first, signed 2025): state of imminent disaster can be declared BEFORE impact, based on pre-disaster risk assessment with ~3-day lead time. **Pitch line: "AksyonNgayon is the MSME layer of RA 12287 — the law now mandates acting early; we give a sari-sari store its early-action checklist."** ([WFP](https://www.wfp.org/news/philippines-passes-landmark-legislation-anticipatory-action-protect-communities-disasters), [UN PH](https://philippines.un.org/en/302099))
- **This month:** habagat enhanced by Super Typhoon Inday → flash floods/landslides across Mindanao, 12 dead; Davao Occidental flash floods Jul 10 (3 dead, 6 missing) ([Davao Today](https://davaotoday.com/headline/12-dead-as-monsoon-rains-trigger-landslides-flood-across-mindanao/), [Inquirer](https://newsinfo.inquirer.net/2262924/3-dead-6-missing-in-davao-occidental-flash-floods))
- **Jun 8, 2026: M7.8 Mindanao earthquake** (Sarangani/GenSan/Davao Occidental calamity declarations) → make action packs **multi-hazard** (flood + quake + fire), not flood-only ([Wikipedia](https://en.wikipedia.org/wiki/2026_Mindanao_earthquake), [CARE](https://www.care.org/media-and-press/philippines-earthquake-four-days-after-access-to-isolated-mindanao-communities-remains-urgent/))
- Feb 20, 2026 Tagum CDRRMO preemptive evacuation, 13 named barangays (already in deck ammo)

## Feasibility check: live data

- PAGASA's [Tagum-Libuganon flood page](https://www.pagasa.dost.gov.ph/flood/tagum-libuganon) is a **daily 9AM text bulletin** (verified live today: "isolated light rains… water level normal"), not station-level data, no public API.
- [ProjectLIGTAS](https://projectligtas.com/flood_monitoring) republishes PAGASA FFWS data every 15 min — possible scrape source, don't depend on it.
- **Decision: demo uses the real Jul bulletin text seeded + a manual advisory-level picker. Say "we ingest PAGASA bulletins; the LGU/CDRRMO feed is the pilot integration." Never claim a live API.**

## Prior art (differentiation confirmed)

| Existing | What it is | Our wedge |
| --- | --- | --- |
| [PDRF PhilPrep tools](https://iadapt.pdrf.org/PHILPREPTools/) | Online risk/BCP **checklists** → index score | Static assessment, not trigger→action→recovery |
| [DTI + SM BCP trainings](https://tribune.net.ph/2026/05/01/business-continuity-training-empowers-local-msmes-through-sm-dti-partnership) (6,000 tenants, 2024–2027) | Workshop-based BCP writing | We're the tool the training hands out — distribution, not competition |
| PAGASA / HazardHunterPH | Warnings & exposure lookup | No MSME action layer |
| GCash [GInsure](https://mynt.com.ph/newsroom/gcash-unlocks-affordable-and-accessible-insurance-for-over-14-million-filipinos-with-ginsure) (14.6M users) | Micro-insurance marketplace | **No MSME typhoon/flood product found** — we surface the protection gap, not sell insurance |
| Parametric insurance wave — fisherfolk product, [World Bank $70M co-insurance pool 2026](https://www.pirainc.com/post/philippines-builds-insurance-buffer-as-climate-shocks-intensify-across-asia) | Payout rails being built now | Our damage reports become the claim evidence layer |

## Recovery money rails (the "who pays / what happens after" answer)

- **[SB Corp ERF](https://sbcorp.gov.ph/erfodette/)** — Enterprise Rehabilitation Financing, opens for MSMEs in NDRRMC calamity-declared areas; roadshows ran Jan 2026
- **[RISE UP](https://sbcorp.gov.ph/riseupmultipurpose/)** — ₱7B PCCI+SB Corp multi-purpose soft loans (Apr 2026)
- Judge answer: "The BANGON report is formatted so an MSME can attach it to an ERF/RISE UP application or microinsurance claim the same week — today that paperwork takes weeks."

## Sponsor check (2026 status)

| Partner | Fresh intel | Resilience-pitch hook |
| --- | --- | --- |
| **Upgrade Innolab / Circulab** | First cohort launched **Jun 2, 2026**; 10 startups, **€15k seed each**, EU Global Gateway €60M; wants climate-resilience ventures too ([PIA](https://pia.gov.ph/news/circulab-to-accelerate-circular-economy-startups-in-mindanao/), [SunStar](https://www.sunstar.com.ph/davao/mindanao-launches-1st-circular-economy-accelerator-program)) | "Post-hackathon path: apply to Circulab's next intake — resilience = climate adaptation counts" |
| **Wadhwani Foundation** | 2026: AI Co-Pilot platform (22k students, 60+ PH partners), PhilDev partnership building a **TBI network**, $1M/yr grants ([Wadhwani](https://wadhwanifoundation.org/news/wadhwani-foundation-enhances-school-to-work-journey-in-ph-with-ai-and-1m-annual-funding/)) | Emphasize AI that helps owners *execute* + jobs protected (₱ protected = wages protected) |
| **BUGSAI TBI / DNSC** | Active 2026: startup roadshow with DOrSU (Jun 11), lecture series; incubation services incl. IP + prototyping ([DNSC](https://dnsc.edu.ph/dnsc-formally-launches-bugsai-tbi-to-boost-blue-economy/)) | Blue-economy lens weaker for resilience; mention fish-vendor/aqua MSMEs are also users (typhoon = harvest loss) |
| **DTI / Negosyo Center** | MSME Week 2026 theme confirmed: **"Navigating the shift: Building resilient and future-ready MSMEs"** ([Davao City Gov](https://davaocity.gov.ph/business-and-industry-support-development/2026-msme-development-week-celebration-starts/)); DTI runs BCP trainings + owns SB Corp rails | We are literally the theme; Negosyo Center = onboarding channel; ERF/RISE UP = recovery rail |
| Tagum Chamber / City BIC / MinDA | No 2026 changes found | Lines from event brief still hold |

## Action items before Jul 18

1. Rewrite resilience deck (BCP Buddy → AksyonNgayon 3-phase) + web `core.ts` resilience config
2. Build the trigger→action loop first; BANGON photo-report second; HANDA score last (cut if time)
3. Seed: 13 Feb-advisory barangays, Jul 2026 Inday bulletin text, multi-hazard action packs (flood/quake)
4. Memorize: RA 12287, ERF/RISE UP, PDRF-tools-are-static, GInsure gap, Circulab €15k
