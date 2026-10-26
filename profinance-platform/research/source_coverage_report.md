# Source coverage report

Generated from `coverage_matrix.csv`, `document_registry.csv` and `retrieval_log.csv`. Re-run `collection/build_coverage.py` after each collection run.

## Headline

* Institutions tracked: **18**. Of these, 11 are active, 7 are historical or exited, and some are still candidates for verification.
* Institution-years expected, from the first operating year to FY2025: **290**.
* Documents registered: **30**. Primary PDFs downloaded: **0**. Annual reports extracted and verified: **0**. **Verified coverage: 0%.**
* Retrieval attempts logged: **47**. Every attempt failed because the egress policy refused the connection (`BLOCKED_BY_ENVIRONMENT`), including the Internet Archive fallback.

## Coverage status counts

| Status | Institution-years |
|---|---|
| NOT_YET_LOCATED | 280 |
| BLOCKED | 9 |
| NEEDS_MANUAL_REVIEW | 1 |

## Document retrieval status

| Status | Documents |
|---|---|
| BLOCKED_BY_ENVIRONMENT | 26 |
| SEARCH_SNIPPET_ONLY | 3 |

## Retrieval attempts by method and outcome

| Method | Outcome | Attempts |
|---|---|---|
| direct | BLOCKED_BY_ENVIRONMENT | 26 |
| wayback_cdx | BLOCKED_BY_ENVIRONMENT | 21 |

## By institution

| Institution | Years | Status breakdown |
|---|---|---|
| PriBank Sh.A. | 4 | NOT_YET_LOCATED: 2, BLOCKED: 2 |
| Raiffeisen Bank Kosovo J.S.C. | 25 | NOT_YET_LOCATED: 25 |
| ProCredit Bank Kosovo J.S.C. | 26 | NOT_YET_LOCATED: 25, BLOCKED: 1 |
| NLB Banka Sh.A. | 19 | NOT_YET_LOCATED: 19 |
| TEB Sh.A. | 18 | NOT_YET_LOCATED: 17, BLOCKED: 1 |
| BKT Kosova Sh.A. | 19 | NOT_YET_LOCATED: 18, BLOCKED: 1 |
| Banka për Biznes Sh.A. | 25 | NOT_YET_LOCATED: 24, BLOCKED: 1 |
| Banka Ekonomike Sh.A. | 25 | NOT_YET_LOCATED: 22, BLOCKED: 3 |
| Ziraat Bank Kosova Sh.A. | 11 | NOT_YET_LOCATED: 11 |
| Türkiye İş Bankası A.Ş. – Kosovo Branch | 14 | NOT_YET_LOCATED: 14 |
| Banka Credins Kosovë Sh.A. | 6 | NOT_YET_LOCATED: 6 |
| Komercijalna Banka A.D. Beograd – Kosovo branch | 17 | NOT_YET_LOCATED: 17 |
| Kasabank Sh.A. | 8 | NOT_YET_LOCATED: 8 |
| Banka Kreditore e Prishtinës Sh.A. | 25 | NOT_YET_LOCATED: 25 |
| Banka e Re e Kosovës | 25 | NOT_YET_LOCATED: 25 |
| American Bank of Kosovo | 3 | NOT_YET_LOCATED: 3 |
| Banka Private e Biznesit | 1 | NEEDS_MANUAL_REVIEW: 1 |
| National Commercial Bank (Kosovo) – possibly BKT lineage | 19 | NOT_YET_LOCATED: 19 |

## Numeric observations

There are 10 observations, all secondary or search-derived with LOW or MEDIUM confidence. None comes from an audited PDF page.

## Hosts blocked in the build environment

`bqk-kos.org`, `cms.pribank-ks.com`, `www.procreditbank-kos.com`, `teb-kos.com`, `bkt-ks.com`, `www.bpbbank.com`, `bekonomike.com`, `mpra.ub.uni-muenchen.de`, `web.archive.org`. The search index confirmed these hosts and URLs exist, so the gap is about access, not availability.

## Priority order for the next collection run

1. PriBank FY2022–FY2025 annual reports, plus 2026 quarterly reports (P0).
2. CBK licensed-institution lists, 2008 to 2025, to reconcile the roster.
3. Law 08/L-304, the current licensing and capital regulations, and the CBK fee schedule.
4. Credins Kosovo FY2020–FY2025, the other recent entrant.
5. All other banks from their earliest public year.
