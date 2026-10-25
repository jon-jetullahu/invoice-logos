# Data contract and provenance

Every stored observation and editable assumption must contain:
- `id`, `metric_id`, `entity_id`, `scenario_id` (nullable for immutable facts)
- `value`, `unit`, `currency` (if monetary), `period_start`, `period_end`
- `stock_or_flow`: `STOCK_END_OF_PERIOD` | `FLOW_DURING_PERIOD` | `AVERAGE_PERIOD` | `RATIO`
- `source_type`: `MANAGEMENT_PROVIDED` | `VENDOR_ESTIMATE` | `AUDITED_BANK_REPORT` | `CBK_OFFICIAL` | `UNSOURCED_ASSUMPTION` | `DERIVED`
- `source_document_id`, `source_url`, `source_page`, `source_quote_or_location`
- `verified_at`, `effective_from`, `effective_to`, `review_status`
- `confidence`, `created_by`, `updated_at`, `notes`

Use decimal-safe arithmetic, immutable audited data, and separate input versions from computed results.
Never auto-fill missing audited numbers from sector averages.
Bank financial report data should support bank/period/report/version/page/audit opinion/IFRS taxonomy and restatement lineage.
Currency conversion must record FX rate, FX source and conversion date.
For private Pro Finance data, enforce tenant isolation, MFA and least-privilege roles.
