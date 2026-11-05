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

## Original historical school tables (2026-11-05)

The original Statistics Finland yearbook PDF was retrieved (40,328,303 bytes; SHA-256 recorded in the review manifest), and PDF pages 64 and 178 were rendered and visually inspected. These spreads contain printed pages 48–49 (table 20) and 208–209 (table 176). All 17 selected migrated cells and their period labels match.

A substantive original-title error was identified in `fi.histwellbeing20261021.literacy_school`: the 1920/1930 column measures people with education **above the primary-school course**, not people who completed at least primary school. The denominator is the present population aged 15 or older, and the unit is per mille. This historical category is neither general literacy nor modern tertiary attainment. The editorial review explicitly rejects the old title and supplies an effective title and definition; raw migration records and permanent keys are retained. National, sex and urban/rural breakdowns are overlapping cuts, not additive categories.

The seven pupil totals are selected school-year observations, with the stored year as interval start. Table 176 excludes church itinerant-school pupils from the chosen total column. Its footnote 5 states that city continuation/evening/auxiliary schools and correctional institutions are excluded before 1930–1931. The resulting scope change and the footnote 1 reference-date qualification are retained. No continuous calendar-year growth interpretation or interpolation is approved.

`editorial__historical_school_sources` stores the source receipt; `editorial__historical_school_cells` stores exact cell locators and transcriptions; `editorial__historical_school_verified` exposes the corrected title, source period/unit and use limits. The append-only review supersedes the earlier metadata-only definition. This validates these cells and definitions, not the whole historical series family or causal effects of compulsory schooling.

## Education, income and wages (2026-11-05)

Original queries for StatFin 14k5 and 15aw were resubmitted. The raw response digests exactly match the prior source snapshot. Their 3,600 income cells and 1,944 wage cells include 256 null wage cells; these are retained as unavailable, not replaced with zero. The check maps seven migrated series by exact source dimension codes, year and group key. Source responses and query receipts are committed for reproduction.

Within 14k5, six endpoint comparisons use 2010 and 2024, the same age group (18–64 or 25–34), total sex, and education 78 versus 9. Category 9 includes unknown educational attainment. The measures remain separate: factor income (including property income), personal disposable cash income, and household-equivalised income assigned to the person. Euro amounts are in 2024 prices. These are changing-population descriptive comparisons, not individual trajectories or returns to schooling. Differences between medians are not an additive decomposition of taxes or transfers.

15aw is a 2024 full-time-employee gross-monthly-earnings cross-section, with mean and median separated. It is not pooled with the income table's population, age bins, education categories or annual net-income measures. Subgroup medians cannot be combined by weighted averaging. The 2024 wage-statistics redesign is a comparability boundary. Existing metadata and article texts remain unchanged; versioned source checks, restricted-use reviews and six descriptive pairs are stored in the editorial layer.
