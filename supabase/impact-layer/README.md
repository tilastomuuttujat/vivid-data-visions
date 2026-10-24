# Murrosmatriisi: vaikutusten laskentakerros 1850–2025

This backend layer is installed in the **murrosmatriisi** database, in the private `research` schema. It extends the existing `research.computation`, `computation_run`, `computation_input`, `retrieval` and `derived_value` provenance system. It does not replace the 32 themes or their existing evidence.

## What is calculated

| Model key | Whole and components | Actual source coverage | Baselines |
|---|---|---|---|
| `age_structure` | Employed/all population; fixed age-distribution reference and centered age-group allocations | 1987–2024 | 1987, 1995, 2000, 2010 |
| `production_components` | Real GDP/person = GDP/hour × hours/employed × employed/population; three-factor Shapley | 1975–2025 | 1975, 1990, 2007 |
| `real_income_components` | Real disposable income/person = nominal disposable income × price adjustment × inverse population; three-factor Shapley | 1975–2025 | 1975, 1990, 2007 |

All outputs retain the complete **1850–2025** domain. Missing years have `not_computable`, NULL actual/reference/effect and an explicit reason. No interpolation, invented historical effects, editorial theme scores or source projections enter these historical models. Point `actual_unit` and `effect_unit` are explicit: employment levels use percent, their differences use percentage points. The legacy `unit` field denotes the effect unit.

Shapley references are **allocation curves**, not predictions of a world without a factor. An allocated comparison can be negative; this does not mean counterfactual household income would actually be negative. The six update orders are averaged to distribute interactions. The age model instead uses a declared fixed-weight order and centered allocation. Alternative methods can allocate interactions differently.

The economic employment concept is domestic national-accounts employment, and its population is annual mean population. The age model is year-end register employment and population. **They must not be chained or added without harmonizing these concepts.** Different price bases, nominal vs real measures, shared denominators and overlapping channels also prohibit summing the models into a welfare score.

## The 32 dimensions

Every model has an explicit assessment against all 32 themes. `input_dimension` and `outcome_dimension` identify a model's actual measured concepts; `context_unquantified` means the theme has been considered but its separate effect has not been identified. A theme association is never treated as attribution of its whole effect.

`impact_theme_year` has 32 × 176 = **5632 cells per release**. Cells describe linked annual observed/estimated candidates, mechanism connections and the presence of relevant numerical model dimensions. The mechanism count is theme-level registry membership repeated across years, not measured annual activity. The numerical-model count identifies available model dimensions, not identified whole-theme effects. Linked proxy observations are not validated causal coverage. Zero linked candidates does not mean the database contains no other information about the theme.

The source's directed mechanism relationships, evidence statuses, original stages and lag fields are preserved. Many mechanisms have no single owning theme; their theme memberships come from `atlas_stage_mechanisms`. Do not infer a missing owning theme or invent quantitative propagation coefficients. `impact_channel` allows a future numerical coefficient only when it references a calibration run. The current links are contextual, not a calibrated 32-theme dynamic causal model.

## Growing information and versioning

`research.impact_refresh(label)` captures the current approved inputs, their units/provenance, theme definitions, mappings, mechanisms, model catalog and annual coverage in one pinned JSON snapshot. Numeric calculations use this captured payload, not moving source values. A separate compact numerical payload keeps calculation practical without discarding source metadata from the archive.

SHA-256 checksums identify inputs, SQL implementation and outputs. Identical data, model catalog and code return the same release. Changed source observations, mappings or model code create a new immutable release. **This is recomputation on refresh/read/export, not an autonomous source-fetching service or cron job.** The visualization/overview functions call refresh themselves. Import pipelines can call the same function after a source update.

Used model definitions, input bindings and theme assessments are frozen. A revised method is registered under a new model/computation version with explicit inputs, units and baselines. New data can use an existing method without changing its formula. New engines require reviewed SQL implementation and conservation/identification tests; the database never executes arbitrary formulas from user text.

Source-quality labels are retained, not promoted. Imported economic source cells remain import-checked. Preliminary 2024–2025 national-accounts values may be revised. No unsupported uncertainty bands are manufactured. Retractions in the existing research run system exclude withdrawn results from the visualization view and are visible in `impact_release_status`.

## Calls and export

```sql
select research.impact_refresh('after_source_import');
select research.impact_visualization('age_structure',1987,'age_structure','FI');
select research.impact_visualization('production_components',1975,'productivity','FI');
select research.impact_visualization('real_income_components',1975,'prices','FI');
select research.impact_overview();
```

Economic factors: `productivity`, `hours_per_employed`, `employed_per_population`; income factors: `nominal_disposable_income`, `prices`, `population`. Age groups: `FI`, `under25`, `age25_44`, `age45_64`, `age65plus`. Only the `FI` age reference is the fixed-age-distribution counterfactual; other age references are explicitly centered accounting allocations. Read `reference_kind` when labelling visualizations.

`export.sql` returns one consistent release covering all themes and all ten model/baseline runs. Backend/static export uses standard libpq environment variables or a PostgreSQL service profile; no credentials are stored in code:

```sh
python3 scripts/data/export-impact-layer.py --output /absolute/path/impact-layer.json
```

The CLI requires `psql`; the database/export SQL has been exercised through the connected SQL service. Browser integration is a separate step: the existing site has not been switched automatically to this backend export. Do not expose service credentials or open the private research schema to anonymous writes.

## Files and validation

- `schema.sql`: consolidated reference definition; intended for a fresh impact layer atop the existing research schema. The live installation is tracked by Supabase migration history; do not replay this file over the installed tables.
- `seed.sql`: idempotent catalog/input registration, including the pinned official age source already used by the site.
- `tests.sql`: numerical, source, full-domain, RLS and function-privilege regressions.
- `export.sql`: refresh once and export the consistent release.

Validation includes reconciliation to official age totals, the 2024 age regression, all group and three-factor conservation identities, an independent comparison to the stored real-income series, synthetic Shapley symmetry, missing-value semantics, output checksums, private invoker functions, RLS and actual service-role visualization access. Repeated calls returned the same validated release. An initial integration release failed an age alias regression and was explicitly retracted before export; it remains in the audit history.
