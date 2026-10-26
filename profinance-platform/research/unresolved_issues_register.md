# Unresolved issues register

Status as of 25 Oct 2026. Severity levels:

* **B**: blocks a regulatory or feasibility conclusion.
* **H**: high impact on the numbers.
* **M**: medium.

| # | Issue | Sev. | Type | Current treatment in the platform | Resolution path |
|---|---|---|---|---|---|
| 1 | Primary Kosovo sources (CBK, Official Gazette, bank sites, Wayback) were blocked by the build environment's egress policy | B | Retrieval | Every document is registered with status BLOCKED_BY_ENVIRONMENT; search extracts are labelled | Allow these hosts, or run `collection/collector.py --discover --wayback` elsewhere |
| 2 | Entry into force and transitional regime of Law 08/L-304 (conflicting press reports) | B | Legal | Rules marked HISTORICAL_UNVERIFIED or REPORTED_UNVERIFIED | Official Gazette text; legal opinion |
| 3 | New minimum initial capital under 08/L-304, reported to be above €7m | B | Regulatory | €7m threshold flagged historical; test stays UNDETERMINED | Article text; CBK confirmation |
| 4 | NBFI-to-bank route: same entity vs new bank with portfolio transfer | B | Legal | Optional portfolio-transfer module, off by default | CBK pre-application meeting; counsel |
| 5 | Eligible capital: how much of the €11.4m nominal capital is cash, and what is deductible | B | Data | Not used unless entered as a capital injection (demo preset labelled) | Audited FS of Pro Finance; CBK view |
| 6 | Tier 1/CET1 minima, buffers, leverage ratio, Pillar 2, de-novo add-ons | B | Regulatory | Thresholds null → UNDETERMINED | Current capital adequacy regulation |
| 7 | Liquidity regime (25% ratio vs LCR/NSFR) and reserve requirement (10%, 2012) | H | Regulatory | Reported values, unverified | Current regulations |
| 8 | Risk weights for Murabaha/goods financing, leasing and government securities | H | Regulatory | Basel standardised placeholders (75% / 100% / 0%) | CBK capital regulation |
| 9 | Islamic window permissibility, deposit-insurance coverage of investment accounts, VAT on Murabaha | H | Legal / Tax | Islamic mode optional and flagged | CBK, tax authority, Sharia advisor |
| 10 | Board rule reported (odd ≥5, independent majority, ≥1 Kosovo resident) but not verified against the article; mandatory key-function list and combinable roles still unknown | H | Governance | Boards of 5–7 in all scenarios; lean scenario flagged as not confirmed | CG Regulation article text; Regulation on directors and senior managers |
| 11 | Outsourcing rules for the fully managed, offshore-delivered core banking system (data location, audit rights, exit) | H | Regulatory | Requirement REQ-OUT-001 open | CBK guidance; contract clauses |
| 12 | Role-level Kosovo bank salaries (no verified market data) | H | Market data | ESTIMATE_NOT_MARKET_VERIFIED bands anchored to KAS averages | Bank FS personnel cost ÷ FTE; job adverts; salary survey |
| 13 | Pro Finance pricing (yields), credit-loss history, existing ~€9m portfolio | H | Internal data | Editable assumptions; transfer off | Not available (per instruction); use market benchmarks |
| 14 | Facilization: billing start, milestones, escalation, DR, migration, card-management overlap, Islamic modules | M | Vendor | Billing at go-live, annual in advance, 30/40/30 milestones; DR and migration costed separately | Detailed bill of materials after NDA |
| 15 | Facilization 5-year total arithmetic (5.4 vs 5.45; 6.1 vs 6.02) | M | Vendor | Flagged; components used | Vendor confirmation |
| 16 | Visa: affiliate vs principal, sponsorship, variable fees, acquiring platform; package high-case arithmetic (829.5k vs 830.5k) | M | Vendor | Unpriced items flagged; FX explicit | Formal Visa proposal; processor RFP |
| 17 | DIFK premium rate within the legal 0.3%–1.5% band; insured-deposit share | M | Regulatory | 0.5% of 50% of deposits (assumption inside the legal band) | DIFK rate decision |
| 18 | CBK licensing fee (€10k figure is stale) and supervisory fees | M | Regulatory | Placeholders | CBK fee schedule |
| 19 | Office rent and fit-out benchmarks for Prishtina | M | Market data | Estimates | Broker quotes |
| 20 | CIT loss carry-forward period | M | Tax | 4 tax periods (PwC Tax Summaries) – secondary source | Law 06/L-105 article text |
| 21 | PriBank comparator figures (assets €155.6m, 176 FTE, 2025) come from a secondary profile with units unstated | M | Data | Shown as secondary only | PriBank 2022–2025 audited FS |
| 22 | Historical roster lineage (NLB predecessors, Kasabank, Credit Bank of Prishtina, Private Business Bank, BKT branch to subsidiary) | M | Research | Candidates with verification status | CBK/BPK historical lists |
| 23 | Go-live calendar date | M | Planning | Relative periods | Management decision after CBK meeting |
| 24 | Whether Murabaha sale margins and Ijarah rentals count as non-financial income under the 10% cap in Law 08/L-304 | H | Legal / Islamic | Requirement REQ-ACT-001 open | CBK written position (question D18) |
| 25 | 1-year deadline from preliminary approval to meeting licence conditions | M | Timeline | 15-month pre-op period fits only if implementation starts promptly after approval | Confirm under 08/L-304 |
