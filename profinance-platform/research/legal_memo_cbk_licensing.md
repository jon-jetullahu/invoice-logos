# CBK banking licence: research memo for Pro Finance Home Sh.A.

**Status:** Working research memo, not legal advice. Prepared 25 October 2026.
**Evidence level:** The Kosovo/CBK primary PDFs could not be downloaded from this research environment, because the egress policy blocked `bqk-kos.org`, `gzk.rks-gov.net` and `cps.rks-gov.net`. Every statement below therefore comes from search-engine extracts of the official documents (listed in `cbk_legal_sources.csv`), unless it is marked as background knowledge. Each one must be checked against the article text before it is relied on. The codes used are **[S]** search extract of an official document, **[S2]** secondary source, and **[U]** unverified or background knowledge.

## 1. Which law applies on the filing date

| Item | Finding | Evidence |
|---|---|---|
| New Law No. 08/L-304 on Banks | Published in the Official Gazette, reportedly on 27 Jan 2026. It is aligned with the EU CRR/CRD, covers licensing, prudential supervision, recovery and resolution, and "increases minimum capital requirements". | [S] CBK PDF title; [S2] RPHS Law article |
| Conflicting report | A late-2025 press report said the law was before the Constitutional Court. RPHS reports that the Court annulled most of the Assembly's December-2024 decisions but that the Law on Banks stood. | [S2] Gazeta Express, RPHS |
| Predecessor | Law No. 04/L-093 on Banks, MFIs and NBFIs (2012). It probably still governs Pro Finance's **current** NBFI status if 08/L-304 only replaced the bank provisions. | [S] |
| Implementing regulations | The 2020 Licensing Regulation (amended 23 Dec 2025 per the package), the 2018 Capital Adequacy Regulation, the 2016 Large Exposures Regulation, the 2019 Corporate Governance Regulation and the 2012 Minimum Reserve Regulation. CBK may re-issue some or all of these under 08/L-304, so their status is unknown. | [S] |

**Action:** Obtain the Official Gazette text of 08/L-304. Record its entry-into-force date, its transitional article (whether pending applications fall under the old or the new law), its capital article and its list of repealed instruments. Then re-validate every row of `cbk_requirements.csv`.

## 2. Conversion route: NBFI to bank

No CBK procedure for converting a licensed NBFI into a bank was found in the material that search could reach. There are three possible routes:

1. **Transformation of the same legal entity.** Pro Finance Home Sh.A. would apply for a bank licence and surrender its NBFI licence when the bank licence becomes effective. This preserves contracts and customer relationships, but CBK must accept the existing entity's history, its legacy exposures and its shareholder structure as fit and proper.
2. **New bank subsidiary or sister company, followed by a portfolio transfer.** This is the cleanest legal separation. It needs a transfer agreement, customer consents or a statutory transfer mechanism, a tax analysis, and possibly double running costs.
3. **New bank and orderly run-off of the NBFI.** This avoids transfer issues, but the bank starts with no portfolio.

The platform treats the route as an **open blocking question** (REQ-LIC-001). The opening portfolio transfer is an explicit, editable assumption, and its default is "not transferred" because the roughly EUR 9m legacy portfolio has not been verified.

## 3. Licensing stages (as reported)

1. **Pre-application meetings** with the CBK Licensing Department. This is a supervisory expectation set out in the 2017 Licensing Manual [S].
2. **Application.** It needs the full application form and annexes from Chapter 5 of the Manual, plus proof that the non-refundable licensing fee has been paid. An application without the fee is incomplete and is not reviewed [S]. Older CBK FAQ material puts the fee at EUR 10,000 [S2, stale].
3. **Preliminary approval or refusal** within **3 months** of a complete application, under the 2020 Regulation [S].
4. **Meeting the preliminary-approval conditions.** These include depositing at least the minimum initial capital at CBK, recruiting the board and key function holders (who must be fit-and-proper approved), building systems and premises, and adopting the policy suite [S].
5. **Final licence application and CBK pre-opening on-site examination**, followed by the final licence decision [S]. The preliminary approval is **revoked if the conditions are not met within one year** [S].
6. **Before taking deposits:** membership of the deposit insurance fund (DIFK), payment-system (KIPS) participation and credit-registry connection [U].

The platform's model timeline uses an editable **pre-operating period of 15 months** by default. That is an assumption, not a statutory figure.

## 4. Capital

* **Legal minimum (historical regime):** paid-in initial capital of **EUR 7,000,000** or more, deposited at CBK before the final licence. Source: Art. 15 of 04/L-093, the 2020 Licensing Regulation and the 2018 Capital Adequacy Regulation [S]. Law **08/L-304 reportedly raises this figure, and the new amount has NOT been verified.** The model shows a minimum-capital test against the EUR 7m threshold labelled `HISTORICAL_UNVERIFIED`. It returns UNDETERMINED rather than PASS until the user enters a verified threshold.
* **Ratios:** a total capital adequacy ratio of at least **12%** of RWA is corroborated by CBK sources from 2022 and 2025 [S]. The Tier 1/CET1 minima, buffers, leverage ratio and Pillar 2 add-ons were **not obtained**. A CRR-aligned law could change the whole stack, for example to CET1 4.5%, T1 6% and Total 8%, plus buffers and P2R. CBK can also set bank-specific add-ons for a de-novo bank. The model therefore separates the **legal minimum** from an editable **management target CAR**, which defaults to 16%.
* **Pro Finance's EUR 11.4m** is *nominal ordinary share capital*. It is not verified cash, net equity or eligible regulatory capital. The amount that is eligible depends on:
  * accumulated losses or profits;
  * intangible assets and other deductions;
  * whether the capital is fully paid up;
  * whether it is held as cash or as loans that would themselves be risk-weighted;
  * and, under route 2, how much of it is actually injected into the new bank.

  The model asks for the **cash capital contributed to the bank** as a separate input.

## 5. Prudential limits (as reported)

| Rule | Threshold | Status |
|---|---|---|
| Liquid assets / short-term liabilities | ≥ 25% | [S] CBK 2022; LCR/NSFR under 08/L-304 unknown |
| Minimum reserve | 10% of liabilities with maturity under 1 year; up to 50% may be held as vault cash | [S] 2012 regulation, amendments unknown |
| Single or connected exposure | ≤ 15% of Tier 1; above 10% needs board approval | [S] 2016 regulation |
| Net open FX position | ≤ 15% of Tier 1 | [S] FSR |
| Related-party limits | not obtained | — |
| Deposit insurance | DIFK membership; annual premium 0.3%–1.5% of average insured deposits; coverage EUR 5,000, planned increase to EUR 10,000 | [S] Law 03/L-216, IMF 2026; rate applied not obtained |

## 6. Governance (as reported)

* Board of Directors under the Corporate Governance Regulation: an **odd number of at least 5 members**, a **majority of independent non-executive directors**, and **at least one Kosovo resident**. The CEO sits ex officio without a vote and is not counted. Independent directors and their related persons may hold at most 1% of voting shares [S].
* The board must have an **audit committee and a risk committee** [S].
* CBK prior approval is required for qualifying shareholders (Art. 37 of 04/L-093) and for senior managers [S]. The qualifying-holding threshold under 08/L-304 has not been verified.
* Independent internal audit, risk, compliance and AML functions are required [S/U].

## 6a. Other provisions found in Law 08/L-304 (Albanian Gazette text, search extracts)

* No person may conduct banking or financial activity without a valid licence issued by the CBK under this or another applicable law.
* Income from non-financial services is limited to **10% of the previous year's total net interest income**. Murabaha sale margins and Ijarah rentals must be checked against this cap.
* The law defines a "deposit equivalent to capital" (the cash part of minimum initial capital paid by a parent bank, relevant to branches).
* The **minimum capital article and the transitional provisions have still not been obtained.**

## 7. Professional confirmations required

1. Legal opinion on the conversion route and the transitional regime under 08/L-304.
2. Written CBK position on the minimum capital, the add-ons expected for a de-novo bank, and the treatment of the existing EUR 11.4m.
3. Tax opinion on the transfer of portfolio and contracts (CIT, VAT and stamp duties).
4. Accounting opinion on the IFRS 9 classification of goods financing and leasing, IFRS 16 for leases, and the capitalisation of CBS costs.
5. Sharia and legal opinion on the Islamic product structures (see `islamic_banking_assessment.md`).
6. Outsourcing notification and approval for the fully managed Facilization platform, covering data location, CBK audit rights and the exit plan.
