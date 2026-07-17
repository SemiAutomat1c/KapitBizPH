# Synthesis — Tagum MSME Resilience Concept Debate (Stage: claude-synthesis)

## Where the debate actually landed

Three of four rounds (both openings and the Claude rebuttal) recommend **Resilience Receipt as MVP**; only the Codex rebuttal flips to **narrowed KapitBiz Relay as MVP**, and it does so at lower confidence (64%) than either opening held for Receipt (72%/72%, rising to 75%). Both sides agree on the entire kill list, the DiskarteWatt-as-feature resolution, the danger of seeded marketplaces, and — critically — the *same flip condition*: a passed merchant-plus-host go/no-go tonight makes Relay the hero. The residual disagreement is not about facts; it is about how to weight demo compellingness against dependency honesty *before* that validation runs.

## Agreed evidence base

**Verified facts (uncontested across all four rounds):**
- Feb 2026 flooding: 73,539 people across 11 Tagum barangays; June 2026 Mw 7.8 earthquake damage in Tagum; Davao Light takeover (26 May 2026) with a 13 June extended interruption and rate increase.
- SB Corp ERF exists and requires location, business, and loss documentation. RA 12287 legalizes anticipatory action.
- No public PAGASA API for Tagum-Libuganon; Davao Light publishes its own outage updates.
- Team: three people, one day, working Next.js 16 + localStorage intake→save→impact loop.

**Reasonable inferences (agreed):**
- Perishable-goods merchants suffer real spoilage during flood/outage overlap.
- Micro-firms with informal records plausibly struggle to reconstruct losses; a pre-loss baseline is more credible evidence than post-disaster photos alone.

**Unsupported assumptions (agreed, load-bearing):**
- Merchants will transfer custody of stock to another business under a QR record (Relay's core transaction — zero interviews).
- Hosts will accept outside stock with acceptable liability/incentive terms.
- SB Corp/insurers/lenders will accept or weigh a generated packet (Receipt's value claim — Claude's label correction stands: "ERF-style packet maps to what evaluators weigh" is an inference at best, and the pitch must never say "ERF-compliant").
- Merchants will maintain baselines without immediate benefit (Receipt's adoption risk — both sides now agree this must be a kill criterion, per the Claude rebuttal's Challenge 3, which Codex's own rebuttal kill list adopted).

**Where prior research confused problem with demand (agreed):** flood counts and Reddit posts about generator-equipped spaces prove disruption, not demand for custody transfer; "ERF requires documents" proves a requirement, not that documentation is the binding constraint on recovery. Both concepts remain demand-unvalidated; Receipt simply has fewer unverified links (one) than Relay (three), and Receipt's one link is checkable tonight while Relay's three mostly are not.

## Unresolved disagreements (preserved, not papered over)

1. **Compellingness vs. honesty as the tiebreaker.** Codex's rebuttal: "saving stock before loss is more compelling than organizing evidence after loss," and keeping the hardest question inside the pitch is more honest about continuity. Claude: a seeded Relay demo *is* the manufactured-participant demo the brief penalizes, and Receipt's hardest dependency sitting after the demo loop is a feature, not evasion. This is a genuine values disagreement about what judges reward; it cannot be settled from the shared evidence base. It is, however, *mooted by the go/no-go*: with a real named host, Relay's demo stops being seeded and the disagreement dissolves in Relay's favor; without one, Codex's own kill criteria ("no plausible host with terms") kill Relay as hero.

2. **Relay one-day feasibility.** Codex rates Medium ("the hard part is not code, it is framing"); Claude rates Medium-Low (reservation states, host flows, QR handoff, matching = a day of plumbing for three people). Unresolved; empirically it only matters if the go/no-go passes, at which point the team should budget for Claude's pessimistic estimate and cut scope (drop matching logic, hardcode the one real host).

3. **Whether Receipt's process-only impact metric is fatal.** Codex's rebuttal calls "packet completeness" theater of a different kind — a clean PDF nobody agreed to accept. Claude holds it is the only honest metric available. Both are right: it is honest *and* weak. The synthesis position: keep the process metric, and let the DiskarteWatt module supply the peso-denominated number honestly ("PHP X of inventory value documented/at risk"), which is a real recorded quantity, not a modeled outcome.

4. **Codex's demo step 6 ("Relay action attempted" preview).** Claude's rebuttal argues it smuggles the seeded marketplace into Receipt's demo and invites the "who are these hosts?" question into the clean loop. Codex's rebuttal never defended step 6 — it abandoned Receipt-as-MVP entirely instead. Treat the challenge as unanswered: **cut step 6 unless the go/no-go passes with a nameable host.**

## Ranked recommendation

**1. MVP — Resilience Receipt ("business flight recorder" / Bangon Evidence Loop).** Demo steps 1–5 only: baseline scan (Codex's "2 minutes so you're not reconstructing from memory" hook, adopted by both sides) → seeded, clearly-labeled Feb 2026 flood scenario → protective-action log (RA 12287 framing) → damage/downtime evidence → packet with owner attestation. DiskarteWatt's spoilage/downtime valuation as one screen inside the packet. Never claim ERF compliance or acceptance; state the pilot path (Negosyo Center/SB Corp format review) as the first unvalidated step, on stage.

**2. Conditional hero-swap — narrowed KapitBiz Relay**, activated *only* if tonight's go/no-go passes in full: ≥2 merchants describe a recent real loss *and* endorse a transfer workflow, *and* ≥1 real host confirms spare capacity with acceptable custody/incentive terms. With a nameable host it becomes the strongest story in the room; without one it is the demo the brief penalizes. This resolves Codex's internal inconsistency (its opening named DiskarteWatt-in-Receipt as "fallback" while its confidence section treated Relay as the contingent alternative — the latter is coherent, per Claude's Challenge 1, which Codex's rebuttal effectively conceded by making Relay its MVP).

**3. Kill (unanimous):** DiskarteWatt standalone; open KapitBiz marketplace; Lifeline Router; parametric/insurance fund; generic checklist/portal/BCP generator; any live-utility-feed claim; generic damage-photo PDF without a pre-loss baseline.

## Kill criteria

**Receipt (merged list from both sides):**
- ≥2 of 3 interviewed merchants say documentation was *not* what blocked recovery help (e.g., awareness or eligibility was).
- Merchants refuse baseline logging even at 30-second photo/receipt level (the pre-loss component dies → product collapses into the killed generic damage app).
- A Negosyo Center/SB Corp-facing contact says the packet format is irrelevant or misleading to how applications are decided.
- The built demo collapses into "upload photos, export PDF."

**Relay (as hero-swap):**
- Any leg of the go/no-go fails (merchant loss+willingness, or host capacity+terms).
- The pitch cannot avoid depending on anonymous marketplace liquidity or city-wide capacity sharing (covariance kills flood-wide sharing; only feeder-level/localized/pre-impact framing survives).

## Confidence and next validation action

**Confidence: 76%** that Receipt-as-MVP with Relay-as-gated-swap is the correct plan. This is above either side's individual number because the plan absorbs both rebuttals' strongest points: it doesn't require settling the compellingness-vs-honesty dispute — the go/no-go settles it empirically — and it hardens Receipt against Codex's "organized folder" objection with the honest peso-documented metric and the merged kill list.

**Next validation action (sequenced, tonight):**
1. Ask three perishable merchants: "What actually blocked or delayed recovery help after the Feb flood / June outages?" This tests the binding-constraint assumption *both* sides depend on — if the answer is "we never applied / didn't know," both openings were wrong together and Receipt weakens sharply.
2. Then run the Relay host go/no-go. A pass with a nameable host is the single result that flips the hero to Relay; a documentation-was-the-barrier answer in step 1 pushes Receipt toward ~85%.
