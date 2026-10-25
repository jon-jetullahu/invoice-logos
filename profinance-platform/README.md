# Pro Finance Home: Banking Transformation Intelligence Platform

This platform supports the feasibility study for converting **Pro Finance Home Sh.A.**, a CBK-licensed non-bank financial institution, into a licensed commercial bank in Kosovo. It has four parts:

* a **research repository** covering the Kosovo bank roster, a document and coverage tracker, CBK legal sources and requirements, HR roles and salary evidence, and a cost database;
* a **reproducible collection and extraction pipeline**;
* a **deterministic 10-year monthly bank model** with automated tests;
* a **web application** with 16 modules plus an assumptions register.

> **Status (25 Oct 2026): research-grade prototype. Results are ILLUSTRATIVE.**
> There is no audited opening balance sheet. CBK thresholds come from search extracts and have not been verified against the current official texts. Primary Kosovo PDFs could not be downloaded from the build environment, because the egress policy blocked the hosts. The model never reports a regulatory PASS on unverified inputs.

## Quick start

```bash
npm install
npm test               # engine acceptance tests (vitest)
npm run test:py        # collection pipeline tests (pytest; needs `pip install pytest pymupdf requests beautifulsoup4`)
npm run report         # CLI: low/base/high + stress summary
npm run build && npm start   # UI + API on http://localhost:8787 (Node ≥ 22.5, uses node:sqlite)
npm run dev            # UI with hot reload on :5173 (start `npm start` too for persistence)
```

To acquire the source documents on a machine with open internet:

```bash
cd collection
pip install -r requirements.txt
python collector.py --research ../research --out ../data/original_documents --discover --wayback   # PriBank first: --institution pribank
python extract_pdf.py --input ../data/original_documents --out ../data/raw_extracted
python build_coverage.py --research ../research
```

## Repository layout

| Path | Contents |
|---|---|
| `source_package/` | The original ZIP and its extracted files, untouched. The Facilization PDF SHA-256 matches the package manifest. |
| `research/` | **Canonical research data** in CSV, plus memos (see the data dictionary) |
| `collection/` | Collector (robots.txt, retrieval log, Wayback fallback, checksums), PDF extractor, coverage builder, pytest suite |
| `src/engine/` | Pure TypeScript model: no I/O, deterministic |
| `src/app/` | React UI with 16 modules |
| `server/` | Node API: versioned scenarios, audit trail, checklist state, demo RBAC |
| `tests/` | Engine acceptance tests, mapped to `source_package/07_Quality_Assurance/acceptance_tests.md` |
| `docs/` | Implementation guide, findings, test results, changelog |

## Evidence classes (always kept separate)

| Class | Examples |
|---|---|
| Verified facts | none yet from primary bank or CBK PDFs; only the Facilization PDF has been checksum-verified |
| Management-provided projections | Y1–Y3 accounts, portfolio, deposits, CBS seats, €11.4m nominal capital |
| Third-party estimates | Facilization (vendor estimate), Visa (private preliminary estimate, USD) |
| Search-derived regulatory and market data | €7m minimum capital (historical), 12% CAR, 25% liquidity, 10% reserve, 15% large exposure, sector statistics |
| Model assumptions | yields, NPLs, tenors, salaries, premises, professional fees and others, all editable |
| Unresolved interpretations and missing information | see `research/unresolved_issues_register.md` |

## Languages

The whole platform is available in **English and Albanian (Shqip)**. Use the language selector in the top bar, or open the app with `?lang=sq`. This covers the UI, engine status messages, number formats (`1 234,5 mln €`), exports and the key research tables. The CBK pre-application questions, readiness report and org chart also have Albanian versions. Details and the terminology glossary are in `docs/i18n.md`.

Start with `docs/FINDINGS.md` for the conclusions to date and `docs/IMPLEMENTATION.md` for architecture and deployment.
