# Kokonaiskuva 1850–2050

`/kokonaiskuva` (Pages `/#/kokonaiskuva`) is the long-run entry point. Its sticky SVG and year selector always span 1850–2050. Era, social-position and scenario choices change explanation or scenario assumptions, never the time domain. The same React component serves TanStack and standalone exports.

Two national series from the pinned murrosmatriisi evidence snapshot are rebased at their common 1975 observation:
- real GDP per capita (source volume index);
- household real disposable net income per capita (derived source series).

Rebasing preserves each series' relative changes. Different price concepts and gross/net accounting scopes mean the index gap is not lost income, a distributional identity or a causal effect. The chart is not a welfare or fiscal-balance score. A source table exposes original values, rebased values, source definitions and URLs. Source-vintage 2025 values may be revised.

Published FI observations are deduplicated; conflicts fail. No missing annual observations are generated. The chart breaks lines at every missing year. GDP coverage starts in 1861 and household income in 1975, while the full domain still starts at 1850. Curves only connect adjacent observed years using endpoint-bounded cubic segments.

Six editorial phases and five social-position lenses explain the channels production → household circumstances → collective responsibility → productive participation. These are mechanism interpretations, not an identified causal network or estimates of group effects. Period-specific counterforces, alternatives and limitations are exposed. Existing episode codes connect the reader to relevant snapshot cases and primary-source URLs; association with an episode does not validate every chain link.

2025–2050 is a distinct scenario layer. Three explicit illustrative pairs of annual growth rates compound from the 2025 observations. These are neither forecasts nor policy treatment effects. They do not include employment, public finance, inequality or behavioural feedback. Only one scenario is shown at a time; the axis is fixed across scenarios.

The household accounting prototype opens inline on demand using `ErotusTulot embedded`. The long-run overview stays mounted and sticky. Example households are not presented as decompositions of the national series. The original separate income route remains available.

Tests cover the complete year-to-era mapping, baseline and source-ratio preservation, gaps, unavailable comparisons, scenario compounding and join, fixed domain across all selection types, source opening and inline drilldown. No historical aggregate impact weights or invented annual observations are used.
