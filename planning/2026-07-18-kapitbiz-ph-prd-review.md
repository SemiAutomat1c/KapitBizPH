# KapitBiz Ph PRD v4.0 — Review, Merge Plan, and Legal Deep-Dive

Date: 2026-07-18 · Reviewed against: the working demo in `.worktrees/kapitbiz-relay` + all prior research
Status of PRD: team draft, incomplete — this review feeds the next revision.

---

## 1. The one-sentence verdict

The PRD is a genuinely bigger idea (onboarding + AI profiling + crisis marketplace) but it **drops the four strongest things the existing build already proves** — the time-critical rescue loop, QR custody proof, the ₱-protected impact ledger, and the recovery-evidence angle — and several of its internal mechanics (credits, auto-deduct fee, AI reject gate, blind bidding during calamity) walk into **specific Philippine laws** that need design changes, not just disclaimers.

---

## 2. What to pull IN from the existing build

| # | From existing build | Why the PRD needs it |
| --- | --- | --- |
| 1 | **Rescue Relay loop (minutes–hours path)** | Sagip Center tickets live 24–72h. Frozen stock dies in ~2h. The PRD currently has *no answer for the most urgent case* — the one our whole evidence base (spoilage window, brownouts) is built on. Keep Relay as the "Emergency Rescue" fast path beside the marketplace: marketplace for *supplies in days*, Relay for *capacity in minutes*. |
| 2 | **QR custody handoff + audit timeline** | The PRD has no proof-of-fulfillment at all. A blind marketplace that reveals identities only after payment *needs* a verifiable handoff record — it also re-justifies the 3.5% fee as payment for *verified fulfillment infrastructure* rather than for an introduction (which is both weaker commercially and weaker legally, see §4.3). |
| 3 | **Protection ledger (₱ protected / hours preserved)** | The PRD has zero impact metrics. Judges, LGU partners, and Circulab all buy impact numbers, not feature lists. Every completed ticket should increment a platform-wide "₱ of business continuity delivered." |
| 4 | **Resilience Receipt → SB Corp ERF packet** | The PRD already ingests exactly the right data (inventory baseline via OCR/CSV, BCP, incident cause) — it just never uses it for recovery finance. Auto-compiling a claim/loan-ready loss packet from ticket + fulfillment records is the highest-leverage feature the PRD is missing, and it rides a real, currently-open government rail (SB Corp ERF for calamity-declared areas). |
| 5 | **Offline-first / PWA + SMS fallback** | The PRD's flows assume live connectivity (email OTP, captcha, real-time bid tracker) *during disasters* — the exact moment connectivity fails. Keep the PWA/offline posture; add SMS-based ticket posting/alerts as a stated roadmap item. |
| 6 | **Vetting/trust tiers (Chamber/DTI-verified badges)** | The PRD's trust model is pure anonymity + a 60-second AI audit. The Internet Transactions Act (§4.1) requires marketplaces to verify merchants anyway — so convert the existing "Chamber-Vetted" concept into verification tiers earned at onboarding (DTI/SEC cert checked → badge), shown even on anonymous bids ("Verified supplier · Tier 2"). Anonymity *between parties* can stay; anonymity *from the platform* cannot. |
| 7 | **Local grounding** | Keep the Tagum seed data, barangay-level geography, and PAGASA/RA 12287 anticipatory-action framing for the pilot story. The PRD's "geographically proximate alerting" (3.1) should explicitly hook hazard advisories, not just tickets. |

## 3. Nice to add (new, not in either)

- **Calamity Mode** (see §4.2): when NDRRMC/LGU declares a state of calamity, the platform switches on price-cap guardrails, SRP reference prices, and priority queuing for basic necessities. Turns a legal obligation into a headline feature.
- **Escrowed fee instead of retained fee** (see §4.3).
- **Post-transaction two-way ratings** to make repeated anonymous play safe (the PRD's anti-spam ban handles requesters; nothing handles bad suppliers).
- **Citation for the "56%" statistic** in the exec summary — as written it's unsourced; judges will ask. (PDRF/DTI MSME-resilience surveys are the likely family of sources — find and pin the exact one, or soften to "a majority.")
- **Appeal path for the 48-hour posting ban** — automated penalties without recourse invite the same automated-decision objections as §4.5.

---

## 4. Legal deep-dive — the internal functions that need redesign

### 4.1 The marketplace itself → Internet Transactions Act (RA 11967, 2023)

- The ITA and its 2024 IRR give DTI jurisdiction over e-marketplaces and digital platforms, create an **E-Commerce Bureau** with complaint/investigation powers, and require **registration of online merchants and platforms** ([law text](https://lawphil.net/statutes/repacts/ra_11967_2023.html), [DTI e-commerce](https://ecommerce.dti.gov.ph/internet-transactions-act-of-2023/), [Cruz Marcelo primer](https://cruzmarcelo.com/navigating-the-internet-transactions-act-r-a-no-11967-a-primer-on-opportunities-and-risks-for-digital-economy-players/)).
- Marketplaces escape liability for merchant misrepresentation only if they show **good faith + reasonable effort to verify** merchant documents.
- **Design consequence:** double-blind bidding is fine *between* counterparties, but the platform must KYB-verify every participant (DTI/SEC cert, which the PRD's onboarding already collects — good) and be able to disclose identity when the law requires. Add to PRD: "all bidders are platform-verified; anonymity applies between parties only, pre-acceptance."

### 4.2 Crisis pricing → Price Act (RA 7581)

- Prices of **basic necessities are automatically frozen** in areas declared under a state of calamity, for up to 60 days. **Profiteering** = selling at a price "grossly in excess of true worth," presumed when the price rose **>10% over the preceding month** ([Official Gazette](https://www.officialgazette.gov.ph/1992/05/27/republic-act-no-7581/), [digest](https://www.digest.ph/laws/the-price-act?tab=summary)). Applies to online sellers.
- **This is the PRD's sharpest landmine**: Sagip Center is *by design* a bidding market for emergency supplies during calamities — the exact scenario where price freezes apply to basic necessities (food, water, candles, fuel, some construction materials). An unconstrained bid tracker could make the platform an instrument of documented profiteering, with the receipts stored on our own servers.
- **Design consequence (Calamity Mode):** when a calamity declaration covers the ticket's area and the item is a basic necessity/prime commodity, (a) cap acceptable bids at the frozen/reference price, (b) show DTI SRP reference data beside bids, (c) log compliance. Reframed positively: *"the only crisis marketplace with built-in anti-profiteering protection"* — a judge-friendly line and a genuine moat.

### 4.3 Credits, auto-deduction, and the 3.5% retention → BSP + consumer protection

- **"1 Credit = ₱1.00" purchased stored value is e-money territory.** Non-bank e-money issuers need a BSP EMI license with **₱100M minimum capital**, and float must be fully backed in trust ([BSP EMI framework](https://www.bsp.gov.ph/SitePages/PaymentsAndSettlements/PaymentsAndSettlements.aspx), Circular 649 as amended by 1049). Separately, operators of payment systems must **register with BSP as OPS** under RA 11127 ([FAQs](https://www.bsp.gov.ph/PaymentAndSettlement/FAQ_OPS_Registration.pdf)).
- **Realistic paths for a startup:** (a) partner with a licensed EMI (GCash/Maya) so they hold the value and we never touch the float; (b) don't sell credits at all — charge fees per transaction through a payment gateway; or (c) make credits non-purchasable (earned/promo only), which keeps them outside stored-value rules. Holding users' prepaid pesos ourselves is not viable at this stage.
- **The 3.5% retention on cancellation** (§4.3 of the PRD) is the weakest clause: a fee auto-deducted for a transaction that *never happened*, with no refund, invites unfair-terms scrutiny under the Consumer Act and, if a payment method is auto-charged, consent requirements under the Financial Consumer Protection Act (RA 11765). **Better design:** hold the 3.5% in escrow at acceptance; release it to the platform only on *verified fulfillment* (the QR handoff from the existing build closes this loop); on cancellation, refund minus a small fixed processing fee. The existing **50-credit pre-acceptance reveal is actually the cleaner monetization** — lean on it harder instead of the retention.

### 4.4 Barter engine → DTI/BIR

- Barter is legal, but **when done in the course of business it must be registered and is taxable** (VAT/income tax — each party is simultaneously seller and buyer); only personal, non-livelihood barter is tax-free ([Philstar, DTI/BIR statements](https://www.philstar.com/business/2020/07/15/2028167/dti-bir-online-barter-not-taxable-so-long-not-business)). KapitBiz is B2B by definition, so **every barter on the platform is a taxable event for both parties**.
- **Design consequences:** (a) every barter offer must carry a **₱ peso valuation** — also needed anyway to compute the 3.5% fee, which the PRD currently leaves undefined for barter; (b) the platform should generate a transaction record both parties can use for BIR compliance (this folds neatly into the Resilience Receipt evidence packet); (c) ToS must state parties are responsible for their own tax treatment.

### 4.5 AI audit "Registered/Rejected" gate + profiling → Data Privacy Act (RA 10173) & NPC AI rules

- **NPC Advisory 2024-04** (Dec 2024) applies the DPA to AI systems: automated decisions with legal/significant effects require **consent when automation is the sole basis**, **meaningful human intervention**, transparency about the logic, and a way to **contest the decision**. Systems doing automated decision-making/profiling must **register with the NPC** (Circular 2022-04) ([NPC advisory PDF](https://privacy.gov.ph/wp-content/uploads/2025/02/Advisory-2024.12.19-Guidelines-on-Artificial-Intelligence-w-SGD.pdf), [summary](https://securiti.ai/philippines-data-privacy-act-application-to-ai-systems-processing-personal-data/)).
- A 60-second AI audit that outputs a definitive **"Rejected"** is exactly the pattern the rules target — and it's also bad product (why bounce a distressed MSME?). **Redesign:** AI assigns a *verification tier* (e.g., "Verified" / "Provisional — docs needed"), never a rejection; a human reviews edge cases; users can contest. Provisional accounts can browse but not transact.
- Onboarding also ingests **business plans and inventory** — commercially sensitive data. Needs: privacy notice + consent at upload, confidentiality terms (uploaded BCPs are trade secrets), NPC registration, retention/deletion policy, and security controls. Say this in the PRD explicitly.

### 4.6 Smaller items

- **OTP/e-signatures**: fine under the E-Commerce Act (RA 8792); no change needed.
- **Platform's own registration**: SEC (it will be a corporation) + BIR + LGU permits + ITA-era DTI platform registration when the E-Commerce Bureau's registry applies.
- **Reverse-auction quality risk** (product, not legal): a live lowest-bid tracker optimizes for cheapest, and in emergencies cheapest ≠ reliable. Mitigate with the trust tiers (§2.6) and by showing bidder tier + fulfillment history beside price.

---

## 5. Concrete PRD amendments (priority order)

1. **Add the Relay fast path** back as a first-class module beside Sagip Center (minutes-scale capacity rescue vs days-scale supply sourcing) — with QR custody + audit trail as the shared fulfillment layer for both.
2. **Replace "Registered/Rejected" AI gate** with verification tiers + human review + contest path; register the processing system with NPC.
3. **Add Calamity Mode** (price-cap guardrails + SRP reference + compliance log) — legal necessity converted into the pitch's best differentiator.
4. **Rework §4.3**: escrow the 3.5% until QR-verified fulfillment; refund minus fixed fee on cancellation; keep the 50-credit reveal as the skepticism monetization.
5. **Rework §4.1**: credits via EMI partner or per-transaction gateway fees; do not self-issue purchasable stored value (₱100M EMI capital wall).
6. **Define barter mechanics**: mandatory ₱ valuation per barter offer (fee basis + BIR record); platform-generated transaction records.
7. **Add the Resilience Receipt module**: onboarding data + ticket + fulfillment record → ERF/insurance-ready loss packet.
8. **Add impact metrics** (₱ protected platform-wide) and **two-way ratings**; cite the 56% statistic or soften it.

## 6a. Addendum — PRD §5: AI-Driven Detection & Early Warning (added 2026-07-18)

### Verdict

The *product logic* is the strongest new thinking in the PRD — Safety Check → pre-filled ticket, and the Good Samaritan alert, are excellent and demo beautifully. But §5.1's API list is largely **fictional as written**: most of the named agencies publish bulletins, PDFs, and advisories, not APIs. The section survives if rebuilt on an honest data-adapter architecture; it embarrasses the team if pitched as-is to a technical judge.

### API reality check (verified 2026-07-18)

| PRD claims | Reality | Honest substitute |
| --- | --- | --- |
| "PAGASA API" | **No public API** — bulletins/PDFs; scraping is how every third-party app does it ([evidence](https://github.com/topics/pagasa)) | Open-source `pagasa-parser` (parses typhoon bulletins), or commercial weather APIs (OpenWeather etc.) |
| "PODS" as a gov data source | **Real, but not government and not an API** — it's a community JSON *spec* by the pagasa-parser project ([PODS site](https://pagasa-parser.github.io/pods/resources/)) | Use as the internal data format — correct usage, wrong citation in PRD |
| "PHIVOLCS API" | **No public API** — earthquake bulletins on their site ([PHIVOLCS](https://earthquake.phivolcs.dost.gov.ph/)) | **USGS FDSN event API** — real, free, global, covers PH quakes ([docs](https://earthquake.usgs.gov/fdsnws/event/1/)) |
| "NDRRMC API" (incl. armed-conflict alerts) | No API; situational reports/advisories. A conflict-alert data product does not exist | Manual LGU/CDRRMO liaison entry; admin console posts advisories into the feed |
| "PSA & BSP APIs" | **PSA OpenSTAT is real** — open-license statistical API ([OpenSTAT](https://openstat.psa.gov.ph/)). BSP publishes statistics; confirm API access directly | Keep — the economic module has a real leg to stand on |
| "DOE & NGCP" | DOE: no official API, but the picture is workable — weekly [Oil Monitor](https://doe.gov.ph/articles/group/liquid-fuels?category=Oil+Monitor&display_type=Card) PDFs on a **predictable every-Tuesday cadence**, a [community-built fuel-price API on GitHub](https://github.com/harrychristianx/doe-fuel-price-api), aggregators ([fuelprice.ph](https://fuelprice.ph/), [GasWatch PH](https://gaswatchph.com/)), and news outlets publish the *projected* adjustment days early ([Philstar price tracker](https://www.philstar.com/headlines/2026/07/01/2538637/price-tracker-oil-fuel-monitor-june-30-july-6)) — so the "impending hike next Tuesday" alert is genuinely buildable via scraping. Global crude-price APIs (e.g., U.S. EIA, free) supply the trend signal. NGCP: advisories only, no API | Weekly DOE scraper + news-projection parser; community API as bootstrap; EIA for trend |
| "DOH PIDSR" | Weekly surveillance reports (PDF), no public API found | Manual/scraped; treat as slow-refresh signal |

**Recommended architecture line for the PRD:** a `HazardFeed` adapter layer — each source is an adapter (parser, scraper, real API, or manual LGU entry) normalized into one internal event format (PODS is a fine choice). Pitch line: *"We normalize PAGASA bulletins, USGS seismic data, and PSA statistics today, and are API-ready for each agency as government feeds come online."* True, defensible, and still impressive.

### Legal flags specific to §5

1. **The fuel advisory nudges hoarding.** "Advise maxing out fuel reserves now" before a price hike — the Price Act criminalizes **hoarding** (holding stocks beyond normal inventory) during emergencies, and the platform would hold logs proving it *advised* the stockpiling. Reword to logistics guidance ("schedule deliveries before Tuesday; review fuel budget"), never bulk-buying advice.
2. **"Adjusting your B2B marketplace pricing" is anticipatory price-hike advice.** Combined with the profiteering presumption (>10% raise), the platform's own push-notification history becomes evidence it coached sellers to raise prices ahead of a crisis. Frame as *cost hedging and margin analysis*, never as "adjust pricing upward before impact."
3. **The conflict-zone matching freeze creates a duty of care.** Good feature — but once promised, a failure that routes a driver into a danger zone is platform exposure. Implement as conservative default-off (matching *pauses* unless the requester explicitly overrides with a warning), and log it.
4. **Never claim to replace official warnings.** Carry over the earlier finding: the app relays advisories, PAGASA/PHIVOLCS/LGU remain the authority. One disclaimer line in-app and in the ToS.
5. **Automated freezes/targeting are automated decisions** affecting businesses — same NPC family as §4.5: notify affected users, provide an override/contest path.

### Keep / change list for §5

- **Keep as-is:** Safety Check push → "No/Need Help" → pre-filled Sagip ticket (best UX idea in the PRD); Good Samaritan adjacent-area alert; typhoon → warehouse-suggestion loop (this is literally the existing Relay build — §2.1 merge does it).
- **Change:** every "API" claim per the table; fuel/pricing advisory wording per legal flags; conflict module to default-off pause + override.
- **Demo note:** seeded/simulated feeds with a visible "SIMULATED DEMO EVENT" label (the worktree build already does this pattern) — judges respect labeled simulation far more than a claimed integration that can't survive one question.

## 6. Sources

- RA 11967 Internet Transactions Act: https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html · https://ecommerce.dti.gov.ph/internet-transactions-act-of-2023/ · https://cruzmarcelo.com/navigating-the-internet-transactions-act-r-a-no-11967-a-primer-on-opportunities-and-risks-for-digital-economy-players/
- RA 7581 Price Act: https://www.officialgazette.gov.ph/1992/05/27/republic-act-no-7581/ · https://www.digest.ph/laws/the-price-act?tab=summary
- BSP e-money / payments: https://www.bsp.gov.ph/SitePages/PaymentsAndSettlements/PaymentsAndSettlements.aspx · https://www.bsp.gov.ph/PaymentAndSettlement/FAQ_OPS_Registration.pdf · https://www.bsp.gov.ph/PaymentAndSettlement/RA11127.pdf
- Barter legality/tax: https://www.philstar.com/business/2020/07/15/2028167/dti-bir-online-barter-not-taxable-so-long-not-business
- NPC AI guidance: https://privacy.gov.ph/wp-content/uploads/2025/02/Advisory-2024.12.19-Guidelines-on-Artificial-Intelligence-w-SGD.pdf · https://securiti.ai/philippines-data-privacy-act-application-to-ai-systems-processing-personal-data/

*Not legal advice — a scoping map of which laws touch which feature, for prioritizing questions to bring to an actual PH lawyer (DLSU/AdDU legal aid clinics or a startup-law firm can review a ToS draft cheaply).*
