# Migrated evidence reuse

The first audit is scoped to the three current article records linked to statute 467/1968. It reuses published education indicator metadata and published comprehensive-school event candidates from the migrated Turso tables. A deterministic title search (maximum 40 series) creates candidate review entries, not verified support or causal edges.

The audit stores actual year coverage, row and non-null-value counts, source-field gaps, source snapshot hashes, article revision and body digest, and three targeted source-review tasks. It distinguishes a scoped search gap from a database-wide absence. A non-null value is not automatically an observed, numeric or validated observation; source presence does not establish quality. Units, geography, groups, classifications and original source versions require review before claim-level use.

Tables: `editorial__evidence_audits`, `editorial__evidence_candidates`, `editorial__evidence_research_tasks`. Existing source and article tables are read only. Versioned writes are idempotent and fail if inputs change. SQLite fixture checks run before the live audit; stored audit and candidate counts are checked using a fresh connection. Logs contain aggregate counts only.

This audit starts evidence discovery. It does not complete source verification, collect new external observations, or measure reform effects. The research tasks require exact reconciliation of the already gathered IFAU/IZA studies, baseline coverage review, and definition-level selection before new collection.
