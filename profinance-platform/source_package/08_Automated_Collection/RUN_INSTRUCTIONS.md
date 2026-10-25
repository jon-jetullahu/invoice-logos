# Local execution — for Claude Code

Use a machine with internet access and Python 3.11+. Do not require the user to manually download reports unless a site requires login or blocks automated access.

```bash
cd 08_Automated_Collection
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python collector.py --bank PriBank --download --out collected
python collector.py --download --out collected_all
python extract_pdf_tables.py --input collected_all/pdf --out collected_all/extracted
```

This collector is **phase-one scaffolding**. It cannot guarantee exhaustive discovery. It does not handle every dynamic page, robots restriction, archive mirror, redirect or historic institution automatically. Claude must extend it using permitted browser automation and site-specific discovery. Do not bypass CAPTCHAs, authentication or access controls. Respect robots.txt, site terms and reasonable rate limits. Do not treat a downloaded PDF as an audited report until its title, audit opinion and reporting year are checked. A URL containing 2025 may publish 2024 figures.

Expected output: original PDFs, discovery manifest, download checksums, page-numbered text/table JSON and a manually reconciled bank/year coverage matrix. Preserve originals.
