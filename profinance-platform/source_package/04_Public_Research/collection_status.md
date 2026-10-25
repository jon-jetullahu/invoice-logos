# Historical bank research — honest status

The package includes a **source registry**, not a complete historical audited dataset.
The previously stated "all ten banks" inventory was incomplete because PriBank was omitted.
The full current roster and historical licensing changes must be reconciled against CBK's official licensed institutions list. Some brands are branches or underwent ownership/name changes.

**PriBank is a priority comparator**, but none of its historical PDFs has been downloaded into this ZIP. Its 2024 report has a directly located official PDF URL; the 2025 report is on the official PriBank site. Do not invent audited financial values or claim extracted records without original PDFs.

Collection pipeline:
1. Discover bank legal entity and years of operation from official CBK register.
2. Enumerate all reports, annual financial statements, audit opinions and quarterly disclosures.
3. Download and checksum each file; record URL, publication date, financial year and source.
4. Extract financial tables and notes; preserve page citations and original units.
5. Normalize IFRS labels without losing raw text.
6. Reconcile total assets = total liabilities + equity, income and cash flows; flag restatements.
7. Store extracted numbers with source document ID, page, audited status and extraction confidence.
8. Track `NOT_FOUND`, `NOT_PUBLIC`, `NOT_APPLICABLE`, `FOUND_NOT_DOWNLOADED`, `DOWNLOADED`, `EXTRACTED`, `VALIDATED`.

No report values in this package are certified as fully extracted.
