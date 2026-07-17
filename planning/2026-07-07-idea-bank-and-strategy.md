# Idea Bank and Win Strategy

Last updated: 2026-07-07

## Overall Recommendation

Prepare one primary idea per possible focus area, but build reusable parts:

- intake form;
- camera/photo upload;
- location capture;
- simple database;
- admin dashboard;
- impact counter;
- PDF/shareable report;
- pitch deck template.

The hackathon-winning shape is:

> local pain + one working loop + measurable impact + partner pilot path.

## Top 4 Ready-to-Pitch Concepts

### 1. BCP Buddy Tagum

Focus area: Business Continuity and Disaster Resiliency

One-liner:

> A Taglish PWA that helps Tagum MSMEs generate a one-page business continuity plan, hazard checklist, emergency contacts, and printable recovery card in under 10 minutes.

Why it can win:

- Strongly aligned with MSME Development Week.
- Very buildable in a weekend.
- Uses official hazard framing through HazardHunterPH.
- Easy for DTI/Negosyo Center to imagine deploying in trainings.

Demo loop:

1. MSME owner selects business type: sari-sari, eatery, processor, shop, service.
2. Enters location/barangay and key assets.
3. App asks simple preparedness questions.
4. App produces risk score, action checklist, and one-page BCP PDF.
5. Dashboard shows number of MSMEs prepared and common risk gaps.

Tech:

- Next.js PWA.
- Supabase.
- PDF export.
- HazardHunterPH as linked official hazard reference.
- Optional Gemini for summarizing plans in Taglish.

Risk:

- Could feel less "innovative" unless the demo is polished and localized.

Make it memorable:

- Print a sample BCP card.
- Include a post-disaster "open/closed/need help" status button.

### 2. BanaLoop Tagum

Focus area: Circular Agriculture and Agribusiness or Waste-to-Value

One-liner:

> A banana byproduct exchange that connects growers and aggregators with MSMEs who can turn pseudostems, leaves, rejected fruit, and other banana waste into fiber, food products, compost, feedstock, or packaging.

Why it can win:

- Hyper-local: Davao del Norte and Tagum are strongly associated with banana production.
- Circulab cares about value chains that convert waste streams into economic activity.
- Easy to explain to DTI, Chamber, and TCBIC.

Demo loop:

1. Farmer/aggregator lists banana waste stream with photo, quantity, and location.
2. Buyer selects needed material: fiber, compost input, food processing, packaging.
3. App matches them and estimates waste diverted/income.
4. Admin dashboard shows total kg diverted and potential value.

Tech:

- Next.js + Supabase.
- Optional SMS/WhatsApp-style intake mock.
- Optional Gemini image check for "what material is shown?"

Risk:

- Marketplace ideas can look generic if there are no real sample buyers.

Make it credible:

- Use 3 sample buyer personas: banana chips/flour processor, fiber craft maker, compost/BSF operator.
- Show a "first 30-day pilot" with one barangay cluster and one processor.

### 3. AquaSense Lite

Focus area: Aquaculture and Fisheries Innovation

One-liner:

> A low-cost water-quality alert kit and dashboard for small fishpond operators, tracking temperature, pH, turbidity, and optional dissolved oxygen to reduce mortality and improve harvest decisions.

Why it can win:

- BUGSAI TBI is a blue-economy incubator, so aquaculture framing matters.
- A hardware demo stands out.
- BFAR roadmap mentions regular monitoring of dissolved oxygen, pH, and turbidity in tilapia production.

Demo loop:

1. Sensor reads sample water.
2. Dashboard updates live.
3. App warns: "pH too low" or "turbidity rising."
4. Operator logs corrective action.
5. Dashboard shows pond history and risk status.

Tech:

- ESP32.
- pH/temp/turbidity sensors.
- Supabase or Firebase.
- Next.js dashboard.
- Simulated data fallback.

Risk:

- Hardware can fail.
- Dissolved oxygen sensor may be expensive or unavailable.

Make it safe:

- Build the dashboard with simulated readings first.
- Use real sensor only for one or two readings on demo day.

### 4. WasteXchange Tagum

Focus area: Waste-to-Value Innovations

One-liner:

> A waste sorting and pickup coordination app that helps households, vendors, and MSMEs route recyclables and organics to junk shops, composters, or BSF operators.

Why it can win:

- Directly responds to the circular economy problem.
- Easy to demo with a photo and a routing recommendation.
- Can connect citizens/MSMEs to local waste buyers.

Demo loop:

1. User uploads photo of waste.
2. App suggests category: plastic, paper, metal, glass, organic, hazardous.
3. App recommends destination: junk shop, compost/BSF, special handling.
4. Pickup request is logged.
5. Dashboard shows kg diverted and reward points.

Tech:

- Next.js PWA.
- Supabase.
- Roboflow or Gemini vision.
- Manual category fallback.

Risk:

- Waste apps are common. Needs a unique Tagum pilot angle.

Make it stronger:

- Focus on one route: market food waste -> BSF/compost -> feed/fertilizer.
- Or one route: plastic/cardboard -> junk shop pickup -> rewards.

## Secondary Ideas

### LeafWatch Banana

Banana disease photo scout for field agents using Roboflow banana disease model or Gemini. Strong tech story, but harder to validate without local disease images and agronomy guidance.

### Damage-Snap MSME

Photo-based disaster damage report generator for small businesses. Strong for disaster resilience; use Gemini to draft a structured report and export PDF. Needs careful wording: "visible damage report," not official structural assessment.

### Storefront Status Map

Post-disaster map where MSMEs mark open/closed/need help. Very useful, but must solve trust and participation. Best as a module inside BCP Buddy.

### Pond Market Link

Direct-to-buyer marketplace for small fishpond operators. Good business idea, but marketplaces are hard to prove in 48 hours unless the demo is extremely scoped.

## Ranking by Win Potential

| Rank | Idea | Why |
| --- | --- | --- |
| 1 | BCP Buddy Tagum | Most aligned with MSME Development Week and easiest to finish/polish. |
| 2 | BanaLoop Tagum | Strongest circular economy/local banana story. |
| 3 | AquaSense Lite | Best stage demo if hardware is ready. |
| 4 | WasteXchange Tagum | Strong but needs narrow local route to avoid generic waste-app feel. |

## Pre-Hackathon Prep

### Must prepare before orientation

- Team of 3 and role split.
- One PRD template per focus area.
- Starter Next.js + Supabase repo.
- Pitch deck skeleton.
- Demo data for Tagum MSMEs, banana waste, water quality, and disaster readiness.
- API key handling through `.env.local`; never commit secrets.

### Role split

- Builder 1: frontend, UI, pitch demo flow.
- Builder 2: backend/data/API integrations.
- Builder 3: research, pitch deck, business model, user interviews, judge Q&A.

### Demo rule

One complete loop beats five unfinished features.

Minimum winning demo:

1. User enters/upload something.
2. App returns a practical answer.
3. App saves or exports the result.
4. App shows one quantified impact metric.

## Pitch Structure

1. Hook: one local story from Tagum/Davao del Norte.
2. Problem: who suffers and what it costs.
3. Solution: show the working loop.
4. Circular/resilience angle: explain the partner-relevant frame.
5. Business model: who pays or supports it.
6. Pilot: first 30 days in Tagum.
7. Impact metric: kg waste diverted, MSMEs prepared, fish mortality risk reduced, income gained.
8. Ask: partner pilot, data access, onboarding support.

## Current Best Bet

If focus areas are assigned randomly, prepare these as the team's defaults:

- Business resilience: BCP Buddy Tagum.
- Circular/agriculture: BanaLoop Tagum.
- Aquaculture: AquaSense Lite.
- Waste-to-value: WasteXchange with a market-waste-to-BSF/compost route.

If the team can choose freely, my recommendation is:

> BanaLoop Tagum if the event leans circular economy; BCP Buddy Tagum if the event leans MSME Development Week and business resilience.

