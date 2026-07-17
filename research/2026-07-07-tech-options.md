# Technology Options for Hackathon Challenge 2026

Last updated: 2026-07-07

## Recommendation

Do not anchor the whole strategy on one research model. Keep a modular "input -> classify/assess -> recommend -> record/report" flow, then pick the best technology for the assigned focus area.

The strongest default stack for a weekend:

- Frontend: Next.js PWA for fast web demo and offline-ish access.
- Backend/data: Supabase for auth, database, storage, and realtime if needed.
- AI: Gemini API for flexible vision/reasoning and structured JSON.
- Domain model fallback: Roboflow hosted models for banana disease or waste classification where accuracy matters.
- Hardware option: ESP32 + water quality sensors for aquaculture if the team can source parts.
- Government data: HazardHunterPH for disaster/business continuity ideas.

## Option 1: Gemini Vision

Best for:

- fast prototypes;
- image understanding;
- object detection / bounding boxes;
- turning photos into structured JSON;
- report drafting;
- mixed reasoning where the model must explain what it sees.

Why it is strong:

- Gemini is a production API, not a research demo.
- Official docs list image captioning, classification, visual Q&A, object detection, and segmentation.
- It can return structured outputs, which is useful for dashboards and reports.

Risks:

- Needs internet and API key.
- May be less accurate than a fine-tuned model for specific banana diseases or waste categories.
- Need strong prompts and validation to avoid confident but wrong claims.

Best uses:

- Damage-Snap: photo -> visible damage checklist -> draft report.
- WasteXchange: photo -> likely material -> segregation guidance -> pickup route.
- BCP Buddy: photo or business details -> risk checklist suggestions.

Source: https://ai.google.dev/gemini-api/docs/image-understanding

## Option 2: Roboflow Hosted Models

Best for:

- banana leaf disease detection;
- waste/recyclable classification;
- quick demos using ready-made computer vision models.

Why it is strong:

- Some models are already trained for the exact domain.
- Hosted inference avoids training during the hackathon.
- Easier to explain as "we used a domain model" rather than forcing a generic model.

Relevant examples:

- Banana leaf disease YOLOv8 model can identify cordana, sigatoka, pestalotiopsis, and healthy leaves.
- Roboflow Universe has waste/recyclable datasets and object detection models for plastic, paper, metal, glass, and other categories.

Risks:

- Public model quality varies.
- API/inference limits may apply.
- Need to test before the event with local-like images.

Best uses:

- LeafWatch: banana disease scout for field agents.
- WasteXchange: waste sorting camera flow.

Sources:

- https://universe.roboflow.com/banana-al4eq/banana-leaf-disease-qesr2
- https://universe.roboflow.com/search?q=class%3Awaste
- https://universe.roboflow.com/search?q=class%3Arecyclable

## Option 3: LocateAnything

Best for:

- "wow" demo around open-vocabulary grounding;
- dense object detection;
- natural-language visual queries;
- OCR or document/GUI grounding.

Why it is interesting:

- NVIDIA Research describes LocateAnything as a unified vision-language grounding/detection model.
- It supports diverse localization tasks: object detection, document understanding, GUI grounding, referring expressions, text localization.
- It was designed for faster bounding-box decoding through parallel box decoding.

Risks:

- It is a research model, not the safest production dependency.
- Hosted demo endpoints may be flaky during a live hackathon.
- It may not beat domain-specific models for banana disease or waste sorting.

Best use:

- Treat as optional bonus or fallback experimentation, not the core product dependency.

Source: https://research.nvidia.com/labs/lpr/locate-anything/

## Option 4: ESP32 + Sensors

Best for:

- aquaculture/fisheries;
- physical demo impact;
- water quality monitoring;
- showing something judges can touch.

Core sensors:

- temperature;
- pH;
- turbidity;
- dissolved oxygen if available;
- optional water level.

Why it is strong:

- BFAR's tilapia roadmap describes water management as a regular farm activity, including monitoring dissolved oxygen, pH, and turbidity.
- A live cup-of-water demo is more memorable than another dashboard.
- BUGSAI judges will likely appreciate blue-economy hardware/software integration.

Risks:

- Sensor sourcing and calibration can be painful.
- Dissolved oxygen sensors can be more expensive than pH/temp/turbidity.
- Hardware failure is stressful in a weekend, so always have simulated data fallback.

Best uses:

- AquaSense Lite: low-cost water quality alert kit for small fishponds.
- PondOps: water readings + feeding/reminder log + harvest notes.

Source: https://www.bfar.da.gov.ph/wp-content/uploads/2022/11/Tilapia-Industry-Roadmap-1.pdf

## Option 5: HazardHunterPH + PWA

Best for:

- business continuity and disaster resiliency;
- location-based hazard checks;
- MSME preparedness plans.

Why it is strong:

- HazardHunterPH is the Philippines' official hazard assessment platform.
- It provides seismic, volcanic, and hydrometeorologic hazard assessment and can generate reports.
- Its data comes from government agencies.

Risks:

- API availability is unclear; may need to link users out or manually attach generated reports.
- Do not scrape aggressively during a hackathon.
- Build the core BCP wizard so the app remains useful even if HazardHunterPH is used as an external reference.

Best uses:

- BCP Buddy: hazard-aware MSME continuity plan builder.
- Storefront Status Map: self-reported business status after earthquake/flood.

Source: https://hazardhunter.georisk.gov.ph/

## Tech Decision by Assigned Focus Area

| Focus area | Best default tech | Backup |
| --- | --- | --- |
| Circular Agriculture | Next.js + Supabase + Gemini or Roboflow | No-AI marketplace loop |
| Waste-to-Value | Next.js + Supabase + Roboflow/Gemini | Manual material categories |
| Aquaculture/Fisheries | ESP32 sensor demo + Supabase dashboard | Simulated sensor readings + market ledger |
| Business Continuity | Next.js PWA + HazardHunterPH link/report + PDF export | Offline checklist wizard |

## Implementation Rule

Build one complete loop:

1. User submits input.
2. System gives a useful recommendation.
3. User saves/shares/exports something.
4. Dashboard shows the measurable impact.

Avoid:

- too many roles;
- untested AI chains;
- marketplace features without any working transaction;
- dashboards with fake charts but no user action;
- claims that cannot be measured.

