# Islamic banking and product structure: assessment

**Status:** Research assessment only. Specialist legal, Sharia, tax and accounting confirmation is required.

## What was found

* Law 04/L-093 (2012) **defines an "Islamic bank"**, explicitly including an **Islamic banking window** of a non-Islamic bank, as a bank that conducts banking business according to Shariah principles *subject to the Law and CBK regulations* [search extract of the official Gazette PDF].
* **No dedicated CBK regulation on Islamic banking** (Sharia governance, profit-sharing investment accounts, displaced commercial risk, Islamic-specific capital treatment) was found.
* Whether 08/L-304 keeps, expands or removes the Islamic-bank definition has **not been verified**.
* Radio Free Europe and Indeksonline reporting identifies three CBK-licensed NBFIs/MFIs that apply Islamic principles: "Start", "TIMI Invest" and **Pro Finance Home**. CBK confirmed that the first two practise Islamic finance. For Pro Finance, a shareholder said it does, but CBK did not specify it (Alsat).
* The Facilization offer claims the core banking system is "Islamic-ready", supporting goods financing and leasing. The exact modules are an open clarification item in the offer.

## Conclusions for the business plan

1. **An ordinary bank licence should not be assumed to authorise Islamic deposit products.** The legal definition exists, but the permissible activities, disclosure, capital treatment and governance must be confirmed in writing by CBK.
2. Islamic **asset-side products** (Murabaha goods financing and Ijarah leasing) are economically close to instalment credit and finance leases. They can be modelled as yield-bearing amortising assets, with three differences:
   * The **profit rate** is fixed at contract inception. Murabaha typically has no compounding late-payment interest; any late-payment charity is not income.
   * **Asset ownership risk** arises before sale (Murabaha) or during the lease (Ijarah). This affects RWA, insurance and VAT.
   * Under IFRS 9, Murabaha receivables are usually measured at amortised cost, and Ijarah is a lessor finance or operating lease under IFRS 16. This is subject to auditor confirmation.
3. **Deposit-side products** differ materially:
   * *Qard/Wadiah current accounts* carry no return and are capital-guaranteed.
   * *Mudarabah investment accounts* share profit at a profit-sharing ratio (PSR) and are not capital-guaranteed in substance. That raises questions about deposit-insurance eligibility, consumer disclosure, and whether CBK treats them as deposits or as a collective-investment-like product.
4. **Tax:** Murabaha involves a sale of goods, which raises possible VAT on the mark-up and double transfer taxes on vehicles. An Islamic-finance VAT neutrality provision in Kosovo law **has not been found**, and this could make Murabaha structurally more expensive than conventional credit.
5. **Governance:** a Sharia Supervisory Board, Sharia compliance and an annual Sharia audit are needed. These are modelled as optional costs `COST-PRO-006` and `COST-PRO-006S`.

## How the platform models it

* The `islamicMode` switch relabels interest as profit and enables the Sharia governance costs.
* It also switches the **investment-account cost** from a fixed deposit rate to **profit-sharing**: return to account holders = PSR × (portfolio yield − expected-loss rate) × investment-account balance.
* Current accounts can be set at 0% (Qard).
* Murabaha and Ijarah are modelled as the two portfolio products (goods financing 80% and leasing 20%). Each has its own yield, tenor, fees and loss assumptions; the engine does not treat them as identical.
* Every Islamic-mode output carries the flag `ISLAMIC_FRAMEWORK_UNCONFIRMED`.

## Questions for CBK, counsel and auditors

See `cbk_open_questions_for_pre_application_meeting.md`, section D.
