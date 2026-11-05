# Migrated evidence reuse

Version 1 inspected a deterministic 40-series subset and found 110 published education-title matches. Version 2 audits all matching published series, with bounded batch writes and exact candidate readback. Both snapshots remain versioned. The scope is three current article records linked to statute 467/1968. Published comprehensive-school event candidates are also included. Title matches are candidate review entries, not verified support or causal edges.

The audit stores actual year coverage, row and non-null-value counts, source-field gaps, source snapshot hashes, article revision and body digest, and three targeted source-review tasks. A scoped search gap is not a database-wide absence. Non-null values are not automatically observed, numeric or validated; source presence does not establish quality. Units, geography, groups, classifications and original source versions require review before claim-level use.

Tables: `editorial__evidence_audits`, `editorial__evidence_candidates`, `editorial__evidence_research_tasks`. Source and article tables are read only. Repeated versioned writes fail if inputs change. SQLite fixture checks run before the live audit; stored audit and candidate counts are checked with a fresh connection. Logs contain aggregate counts only.

The review tasks require exact reconciliation of already gathered IFAU/IZA studies, historical baseline coverage review, and definition-level selection before new collection. This starts evidence discovery; it does not complete source verification, collect new external observations or measure reform effects.
