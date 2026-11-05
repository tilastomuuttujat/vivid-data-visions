# Education evidence: structural review

This version reviews all 110 series selected by the completed education audit. It profiles units, descriptions, geography, frequency, actual group labels, group-specific year spans and interior annual gaps, finite numeric values, recorded value kinds and validation labels. It preserves the original strings and a digest of the source metadata and selected observation fields.

Neither a non-null value nor the label `observed` is independent verification. All profiles remain `needs_semantic_review`; metadata signatures are not proof of comparability. Original source tables and article text are never updated.

Missing catalogue source URLs are examined against all observation-level URLs. A fallback is stored only when every row carries the exact same safe HTTPS address. This produces an unverified source-resolution candidate, not a factual correction. Multiple, missing, unsafe or credential-bearing URLs leave an explicit retrieval need. Original-document verification remains necessary before any source can be declared repaired.

Versioned tables: `editorial__evidence_quality_runs`, `editorial__evidence_series_profiles`, `editorial__source_resolution_candidates`. Snapshot changes require a new version. Exact readback and a fresh connection verify persistence; fixtures check group gaps, changing labels, missing/conflicting URLs, nonfinite values, future/estimated data, source preservation and version conflicts before the live run. Logs contain only summary counts.


## Scoped editorial decisions

The 2026-11-05 review records ten decisions with metadata and observation digests. Two OECD source documents are located and four rounded year values (2021/2024 in two series) are checked against the OECD Finland country note. This is partial source reconciliation, not verification of all 24 values. The tertiary series retains its estimate status and unresolved derivation/age-weighting caveat. Missing years are not interpolated. Source links live in a separate provenance view; migrated rows are preserved.

Two historical definitions receive metadata-derived clarifications pending original yearbook page checks. Two combined public-administration/defence/education/health/social-work series are excluded from attainment evidence. Two OWID model/projection series remain modelled context. Adult-education participation counts and teaching hours are distinguished from unique persons and outcomes. The review view exposes use limits and partial verification status. `matches_reviewed_profile` compares stored profile digests; it is not a live change detector for underlying source tables. Later source changes require rerunning source validation.

## Direct OECD source reconciliation (2026-11-05)

The original OECD CSV and retrieval receipt are stored under `scripts/editorial/sources`. The country, sex, age, attainment level, population measure, same-age/sex percentage unit, frequency and statistical-operation dimensions are explicitly checked. `MEASURE=POP` and `STATISTICAL_OPERATION=OBS` are distinct dimensions. The unavailable XML dataflow route is not a prerequisite for this CSV-specific collector.

The direct FIN / total sex / 25–34 selection contains 24 years for each of the two attainment levels. All 48 migrated decimal values match exactly. Neither source selection supplies 2001 or 2002. Both retain OECD `OBS_STATUS=B` at 2016; its time-series-break interpretation follows the referenced SDMX observation-status standard. Gaps are not interpolated and the break is not smoothed away.

`editorial__oecd_source_snapshots` stores the versioned original reference and receipt, `editorial__oecd_attainment_comparisons` stores exact value comparisons, and `editorial__oecd_attainment_verified` provides official values with source flags and the original value-kind label. The separate editorial review now recommends using the official direct aggregate. The old import's age-weighting formula has not been reconstructed; no local weighting is needed for this verified direct reference. Original series metadata and observations, including the tertiary estimate label, remain unchanged. This is source reconciliation for descriptive use, not causal identification or proof of uninterrupted statistical comparability.
