# KapitBiz Ph — Everything We Found, In Plain Words

For the whole team. No legal or tech jargon. 2026-07-18.
(Detailed version with sources: `2026-07-18-kapitbiz-ph-prd-review.md`)

---

## The short version

Your PRD is a good, bigger idea. But:

1. It **forgot the four best things we already built and proved working**.
2. **Five of its money/marketplace features would break Philippine laws** as currently written — all fixable with design changes.
3. The new early-warning section is built on **government APIs that mostly don't exist** — but the ideas are good and there are honest substitutes.

Nothing here kills the concept. Every problem has a fix, and some fixes actually make the pitch stronger.

---

## Part 1 — Four things the PRD forgot (that we already built)

**1. The "right now" emergency path.**
Your marketplace posts last 24–72 hours. But frozen fish spoils in 2 hours. Someone whose freezer just lost power can't wait a day for bids. Keep our existing rescue flow (find a neighbor with a working freezer NOW) as the emergency button, and use the marketplace for things that can wait days.

**2. Proof that the handoff happened.**
Right now the PRD has no way to prove goods were actually delivered. Our QR scan does exactly that — the receiver scans, and there's a record of who gave what to whom, when. This also protects YOUR 3.5% fee: you're charging for a *verified completed transaction*, not just for introducing two strangers.

**3. The "₱ protected" counter.**
Judges and future partners don't remember feature lists — they remember "this platform protected ₱2.3M of small-business inventory." The PRD has no numbers like this anywhere. Our build already counts it.

**4. Turning records into recovery money.**
The government (SB Corp) offers loans to disaster-hit small businesses — but owners must PROVE what they lost, and most can't. Your onboarding already collects their inventory. After a disaster, the app can auto-assemble that into a ready-to-submit proof packet. This is the single most valuable missing feature, and the data for it is already in your design.

Also keep: the app working without internet (disasters kill internet — your OTP/live-bidding features assume it's up), and the Tagum pilot grounding.

---

## Part 2 — The law problems, explained simply

**Problem 1: You can't secretly sell to strangers — the platform must know who everyone is.**
A 2023 law (Internet Transactions Act) says marketplaces must check who their sellers really are, or the platform itself gets blamed when a seller scams someone.
✅ *Fix is easy:* bidders stay anonymous **to each other**, but the platform verifies everyone at signup (you already collect DTI/SEC papers — just actually check them and show a "Verified" badge on anonymous bids).

**Problem 2: During disasters, prices of basic goods are frozen by law.**
The moment a state of calamity is declared, prices of food, water, and other essentials are locked, and raising a price more than 10% counts as illegal profiteering. Your marketplace runs *exactly* during calamities — an open bidding war on rice after a flood could literally document crimes on your own servers.
✅ *Fix that becomes a selling point:* build a "Calamity Mode" that caps bids at the legal price and shows the official suggested retail price next to every offer. Now your pitch line is: **"the only crisis marketplace with built-in anti-price-gouging protection."** Judges will love that.

**Problem 3: You can't hold people's money without a bank-level license.**
"1 Credit = ₱1" that people buy and store in your app = you're holding their money. Companies that do that (like GCash) need a central bank license requiring **₱100 million in capital**. You don't have ₱100M.
✅ *Fix:* don't hold the money. Either partner with GCash/Maya (they hold it), charge the fee per transaction through a normal payment gateway, or make credits earn-only (rewards, not purchases).

**Problem 4: Keeping the 3.5% fee when a deal is cancelled will get you in trouble.**
Charging someone for a transaction that never happened, with no refund, is the kind of "unfair fine print" consumer regulators go after.
✅ *Fix:* hold the 3.5% aside when someone accepts, but only actually take it once the QR scan proves delivery happened. If cancelled, refund it minus a small fixed processing fee. (And your ₱50 "reveal who's bidding" feature is honestly the cleaner way to make money — lean on that more.)

**Problem 5: Business barter is taxed.**
Swapping goods between two businesses isn't a tax-free trick — the tax office treats both sides as a sale. Also, your 3.5% fee currently has nothing to compute from when there's no cash price.
✅ *Fix:* every barter offer must state a peso value (solves both the fee math and gives both businesses the record they need for taxes).

**Problem 6: A robot can't just reject someone's registration.**
Your "60-second AI audit → Approved or Rejected" screen: privacy rules (updated for AI in late 2024) say when a machine alone makes a decision that seriously affects someone, the person must consent, be able to ask a human to review it, and be able to challenge it. Also — why would we reject a struggling business owner at all?
✅ *Fix:* the AI never says "Rejected." It says "Verified" or "Provisional — we need one more document." Provisional users can look around but not transact yet. A human reviews unclear cases.

---

## Part 3 — The early-warning section (§5): great ideas, imaginary plumbing

**The good news:** the two best ideas in your whole PRD are here.
- After an earthquake, the app asks every business in the area *"Are you safe?"* — tapping "Need Help" instantly creates a pre-filled help request. Excellent.
- The "Good Samaritan" alert tells businesses in the NEXT town "your neighbors got hit — open your dashboard and help." Very Filipino, very demoable.

**The bad news:** the section lists six government APIs as data sources. We checked each one. **Most don't exist.**

| You wrote | What's actually true |
| --- | --- |
| "PAGASA API" | No API. They publish bulletins as text/PDF. Everyone who builds weather apps scrapes these. |
| "PODS" | Real — but it's a file format made by a volunteer open-source project, not a government service. (Still useful! Use it as our internal format.) |
| "PHIVOLCS API" | No API. **But the US Geological Survey has a real, free earthquake API that covers the Philippines** — use that. |
| "NDRRMC API" for war/conflict alerts | Doesn't exist at all. |
| "PSA & BSP APIs" | **PSA's is real!** (OpenSTAT — free statistics data.) The inflation-tracking idea genuinely works. |
| "DOE, NGCP, DOH APIs" | None found — they publish announcements and weekly PDF reports. |

✅ *Fix:* build one internal "hazard feed" that accepts events from anywhere — a real API where one exists (USGS, PSA), a bulletin-reader where one doesn't (PAGASA), and a manual entry screen for our LGU/city-hall contact for everything else. In the demo, use clearly-labeled simulated events (our current build already does this — judges respect honest simulation; they punish fake integrations that crumble under one question).

**Two dangerous sentences to delete from §5:**
1. *"Advise maxing out fuel reserves"* — telling users to stockpile before an emergency is coaching them toward **hoarding**, which is a crime during calamities. Say "schedule your deliveries early" instead.
2. *"Adjust your marketplace pricing"* before a price hike — that's coaching sellers to raise prices before a crisis, which is the profiteering problem again, recorded in our own notification logs. Say "review your costs" instead.

And one safety rule: always state the app *relays* official warnings — PAGASA and the city government stay the authority. Never claim to be the warning system.

---

## Part 4 — Your to-do list, in priority order

1. Put the emergency rescue path (our existing build) back in as the fast lane; marketplace = slow lane. QR scan = proof layer for both.
2. Change "AI Approve/Reject" → "Verified / Provisional" tiers with human review.
3. Add Calamity Mode (price caps + official price display) — legal shield AND best pitch line.
4. Change the 3.5%: hold it, only collect after QR-proven delivery, refund (minus small fixed fee) on cancel.
5. Don't sell stored credits — partner with GCash/Maya or charge per transaction.
6. Every barter offer gets a peso value.
7. Add the recovery-proof packet (onboarding data → loan-ready loss documentation).
8. Fix §5's API claims per the table; delete the two dangerous advisory sentences.
9. Find the source for "56% of businesses lack BCP" or soften the claim.
10. Before any real pilot: one cheap terms-of-service review by a startup-law clinic. (Everything above is a map of which laws touch which feature — not legal advice.)

---

## Part 5 — Solutions for under-the-table transactions (added after team discussion)

The rule for all of these: **never police, always price.** Make the honest path obviously worth more. Twelve concrete mechanisms, grouped by how they work:

### A. Keep the deal on-platform in the first place
1. **Reveal gate (already in the PRD — keep).** Contact details release only after the fee is escrowed. Before that, all communication is in-app chat with phone numbers/emails auto-masked in messages (Airbnb does exactly this).
2. **Low fee + minimum fixed fee.** 3.5% with a ~₱50 floor means dodging saves pennies on small deals and is never worth the lost protections on big ones.
3. **Non-refundable pieces.** The ₱50 reveal and a small fixed cancellation-processing fee mean every "reveal, cancel, deal offline" attempt costs real money.

### B. Make on-platform the only source of value
4. **"Off-platform deals don't count."** Only on-platform transactions produce the QR custody proof, the recovery/loan evidence packet, and BIR-usable records. This is the strongest single lever.
5. **Declared value = protected value.** Disputes, claims, and evidence are capped at what you declared. (Also solves under-declaring the price to shrink the fee.)
6. **Loyalty pricing.** Higher trust tier = lower fee (e.g., 3.5% → 2.5% at Tier 3). The more you transact honestly, the cheaper the platform gets — directly attacks the reason to leak.
7. **Partner perks.** On-platform history unlocks Chamber/Negosyo Center recognition, priority in pilot programs, and grant eligibility. Records only exist if the deal was on-platform.

### C. Detect quietly
8. **Pattern watch.** Flag pairs who repeatedly reveal-then-cancel, and declarations far below market (the Calamity Mode price data does double duty here). Lower their matching priority; human review at the extreme.
9. **Public completion rate.** Show "98% completion" on profiles. Serial cancellers look risky to everyone — the community does the enforcement.

### D. Priced deterrence
10. **Escrow, not retention.** Fee held at acceptance, collected only on QR-verified completion, refunded minus the fixed fee on cancellation. Fair to honest users, costly to gamers.
11. **Rematch cool-down.** After a cancelled deal, the same two parties can't rematch for X days — blocks "cancel, then redo cheaply."

### E. Make paying feel good
12. **Community slice.** Publicly commit a visible slice of every fee (e.g., 1 of the 3.5 points) to shared disaster infrastructure — like the Chamber emergency cold room. Paying the fee = contributing to the bayanihan fund; dodging it = freeloading on your neighbors. Very Filipino, very judge-friendly.

**Honest scale note:** in the closed Tagum pilot (Chamber-vetted members who know each other), leakage barely matters — reputation inside a small community is its own enforcement. These mechanisms matter when you scale to strangers. For the pitch, mention #4, #5, and #12; build the rest later.
