# ML-capable idea widen — Hackathon Tagum

Last updated: 2026-07-12  
Context: Team can ship complex apps + ML (proof: Tagum Tricycle Fare Predictor — RF, map, live API).  
Does **not** remove hard filters or the 4 lot-drawn areas.

## Rules when you *can* do ML

| Do | Don't |
| --- | --- |
| Use ML when it improves a **decision** (price, risk, grade, time-to-spoil, diversion value) | Use ML just to say "we used AI" |
| Prefer **tabular models** (like your fare RF) — train on public/seed data offline, ship weights | Depend on live GPU / heavy cloud for the venue demo |
| Keep intake → answer → save → **one metric** | Build a research notebook with no pilot story |
| Show factors (like fare app transparency) | Black-box "trust us" scores |
| Rules engine as fallback if model fails | No offline path |

**Demo pattern you already proved:** inputs → model predicts number/class → explain factors → user acts. Reuse that shape in every area.

---

## Widened bench by area (rules-only → ML-upgraded)

### 1. Circular Agriculture

| Tier | Idea | Complexity | ML angle | Notes |
| --- | --- | --- | --- | --- |
| **Default** | **SagingWorth** | Low–mid | Optional: classify reject grade from photo (scar/size/ripe) → ₱ path | Best Tagum story; ML is garnish |
| Strong alt | **SagingWorth + price RF** | Mid | Predict ₱/kg by reject type, season, volume (tabular like fare model) | Closest reuse of your ML skill |
| Alt | WiltNext | Mid | Rank recovery options; optional yield risk score | Longer horizon |
| Avoid | Full banana marketplace | High | Matching model | Cold-start; hard filter break |

### 2. Waste-to-Value

| Tier | Idea | Complexity | ML angle | Notes |
| --- | --- | --- | --- | --- |
| **Default (Ryan preference)** | **KiloKita junkshop ops** | Mid | Predict fair buy price by material/kg/day; stock sell-through days | MSME-first; beats DiverTrack |
| Strong alt | BasuraBill | Low–mid | Estimate diversion ₱ + tipping avoided | Vendor-side, simpler |
| ML flash | Waste photo → material class + kg estimate | Mid | Vision or simple classifier | Cool demo; keep shop log as core |
| Weak | DiverTrack LGU dashboard | Mid | Forecast diversion % | Wrong first user for MSME Week |

### 3. Aquaculture & Fisheries

| Tier | Idea | Complexity | ML angle | Notes |
| --- | --- | --- | --- | --- |
| **Default** | **FreshTrack** | Mid | Spoilage risk model (hours, species, ice, temp/weather) → ₱ at risk | Software-only; post-harvest wedge |
| Strong alt | PondLog + FCR predictor | Mid | Predict FCR / overfeed risk from daily logs | No hardware; feed = 70% cost story |
| High risk | BantayPond + ML water anomaly | High | Anomaly detection on sensor stream | Hardware weekend risk |
| Stretch | Harvest-timing advisor | Mid | Predict best harvest window vs market | Needs price seed data |

### 4. Business Continuity & Disaster Resiliency

| Tier | Idea | Complexity | ML angle | Notes |
| --- | --- | --- | --- | --- |
| **Default** | **AksyonNgayon + StallShield** | Mid | Risk score by barangay + business type; rank actions | Live anticipatory > static BCP |
| Strong alt | BCP Buddy + risk RF | Low–mid | Risk score from 10 answers + barangay hazard | Theme match; easier polish |
| Stretch only | FairFare Tagum (tricycle) | Mid–high | **You already built this** | Theme fit weak; only if Resilience drawn *and* mentors buy "mobility resilience" |
| Alt | DamageSnap | Mid | Vision → claim-ready damage report | Photo ML flex |

---

## Highest-leverage ML reuse from your fare project

Your fare stack already has: feature encoding, RF regressor, explainable factors, web UX, API.

| Transfer | Into idea |
| --- | --- |
| Tabular RF predicting a ₱ number | SagingWorth ₱/kg · KiloKita buy price · FreshTrack ₱ spoilage · FairFare (only if forced) |
| Factor transparency UI | Every pitch ("why this number") |
| Weather + time features | FreshTrack, AksyonNgayon, FairFare |
| Distance / location | AksyonNgayon barangay risk; market cluster for KiloKita |
| Offline-trained `.pkl` + API | Same pattern as `tagum-tricycle-fare-backend` |

You do **not** need a new architecture. You need a new **label** (what ₱ or risk means) and Tagum seed data.

---

## Recommended four defaults (ML-capable team)

Still one per area for the lot draw:

| Area | Lock | ML level for weekend | Why |
| --- | --- | --- | --- |
| Circular Agri | **SagingWorth** | Rules first; optional grade/₱ model if time | Strongest local story |
| Waste-to-Value | **KiloKita (junkshop)** | Price board + optional buy-price RF | You like it; MSME-first; ML fits prices |
| Aquaculture | **FreshTrack** | Spoilage risk RF or rules+weights | Differentiates from pond-sensor teams |
| Resilience | **AksyonNgayon + StallShield** | Risk score + ranked actions | Theme + Tagum floods; BCP Buddy fallback |

**Complexity budget:** pick **one** area to put real ML (the drawn one). Pre-train tiny models for all four offline so whichever is drawn, you can plug weights in. Don't train four production-grade models during the weekend.

---

## What "widen options" does *not* mean

- Tricycle fare becomes a free fifth area — **no** (still wrong theme for Agri/Waste/Aqua)
- Marketplace matching with "AI" — still cold-start
- Sensor IoT + ML on stage without hardware backup — still risky
- Bigger model = more points — judges reward **finished loop + local impact**

---

## Weekend ML playbook (3 people)

1. **Builder ML:** train 4 tiny models offline (or 1 shared tabular pipeline) on seed CSVs; export joblib  
2. **Builder full-stack:** core loop already in `hackathontagum/web`; swap answer engine to rules|model  
3. **Research/pitch:** Tagum stories, partner path, impact metric, "why not ScrapCycle/PDRF" answers  

If model is shaky on stage → fall back to **transparent rules** (you still look smart, not broken).
