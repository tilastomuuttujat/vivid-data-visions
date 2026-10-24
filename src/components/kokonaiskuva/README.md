# Erotus · kokonaiskuva 1850–2050

`/kokonaiskuva` (Pages `/#/kokonaiskuva`) preserves the original Erotus visual: one actual aggregate curve, one transparent reference calculation, and a hatched difference. The complete sticky timeline always spans 1850–2050. The original `/erotus` is unchanged.

## Measured whole and reference

The whole is **employed persons as a percentage of the entire population, all ages**, not the official 15–64 employment rate, fiscal balance or welfare score. Source: Statistics Finland, employment statistics table 115w, year-end counts for the entire country, both sexes and all 13 mutually exclusive age cells. Actual calculation coverage: 1987–2024. Before coverage, the same timeline shows explicitly unquantified historical context; no artificial curve fills the gap.

For year t, weights w are population shares and r are within-age employed proportions:

- Actual R(t) = 100 Σ w(t)r(t).
- Reference C(t) = 100 Σ w(base)r(t).
- Composition effect = R(t) − C(t).
- Within-age employment component = C(t) − R(base).
- These two changes sum exactly to R(t) − R(base).

The base is selectable (1987, 1995, 2000, 2010). This fixed-weight standardization does not rerun employment, wages, migration, policy or behaviour in an alternative population. The order assigns the interaction term to composition. It is a transparent accounting calculation, not an identified causal effect.

## Group allocation

Each original age cell contributes (w(t)−w(base)) × (100r(t)−C(t)). The centered contributions sum to the aggregate composition effect because the population-share changes sum to zero. They are aggregated into under 25, 25–44, 45–64 and 65+. This is an explicit allocation convention, not unique causal attribution or a group's responsibility for the outcome. Selecting a group changes its explanation and contribution highlight, never the two whole-population curves.

## Future and display

2025–2050 uses dashed, separately labelled illustrative scenarios. Either latest population weights and rates are held constant, or the last ten years' average weight changes continue linearly, clamped to zero and renormalized. Both keep within-age rates at the latest source values. These are not official population forecasts and contain no cohort-component demographic model.

Curves are endpoint-bounded cubic segments between annual calculated points. The percentage axis is visibly fixed at 30–55%, not zero. The hatch is an arithmetic difference, not uncertainty. No unsupported confidence bands are fabricated. Exact actual/reference values and source counts are available in a table. An example household drilldown opens inline; it is not a monetary equivalent of the composition effect.

## Reproducible data refresh

Run `python3 scripts/data/fetch-employment-age-effect.py`. It fetches metadata and source counts, checks every age count for missing/invalid values, and requires age cells to sum exactly to both published population and employed totals in every year before replacing JSON atomically. Query, source update/capture date and response SHA-256 are saved in `employment-age-data.json`. No production-browser API dependency.

Tests check all source totals, weighted aggregates, exact whole-change and group-allocation identities, a known synthetic two-age shift, the 2024 regression, baseline sensitivity, future joins and valid weights, fixed-domain interactions and inline drilldown. The main app and Pages export share the same component.
