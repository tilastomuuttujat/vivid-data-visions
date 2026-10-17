# Kuntien yhteydet

Murrokset → Kuntien yhteydet adds a descriptive empirical layer alongside the historical source network. It does not add causal edges to that network.

## Snapshot

- Retrieved 2026-10-17 through Tilastokeskus PxWeb API.
- 308 municipality codes; exclude national, regional and other aggregate rows.
- Annual snapshots 2023 and 2024; no pooling across years.
- 24 annual indicators. 2024 lacks five workplace/industry indicators: keep nulls and show the coverage warning.
- Municipal election turnout is a separately enabled 2025 variable (292 mainland municipalities); it is never silently treated as a 2023/2024 observation.
- Original GET metadata, exact POST queries and JSON-stat2 responses: `scripts/data/municipal-sources/`.
- Income uses 2025 geography, other annual sources 2026 geography. Municipality codes/names are checked for equality. This is not proof of identical submunicipal boundaries; source notes remain in the pinned responses. Income amounts use the source's latest statistical-year prices.
- Missing/suppressed source values stay null. Ratios use valid positive denominators. Natural change and internal net migration are divided by same-year end population, multiplied by 1,000. Benefit dependency uses total household population; crowding rates use all households / child households respectively.

## Statistics

Every municipality has equal weight. Pairwise complete cases, minimum n=30. Pearson and Spearman (average tied ranks); optional partial correlation controlling log(population), older share and urbanisation. For partial Spearman, rank the two variables and all controls before residualising. Drop controls as outcome candidates in adjusted families.

Two-sided Student-t approximation with n−k−2 degrees of freedom; Spearman/partial rank p-values are approximate. BH and BY adjusted over **all computable pairs** in each year × method × adjustment × mixed-year family, before display filters or removal of definitional pairs. BY is the conservative default accommodating dependence among tests. Neither correction addresses spatial dependence among municipality observations. p/q are exploratory screening statistics under an independence model, not validated spatial inference; the full municipal population is not a random sample. No causal or individual-level conclusions.

Flag selected definitional relationships (industry composition, nested qualifications, employment/huoltosuhde, nested crowding denominators); excluding these from the screen does not shrink the multiplicity family. This flag list is deliberately incomplete: shared denominators and common causes still require inspection. No imputation, no spatial correction and no automatic causal links. No confidence intervals are supplied in this initial screening implementation.

Matrix encodes signed coefficients directly. Scatterplot shows original values for the exact eligible municipality set, **also when the coefficient is partial**; labelled explicitly. Source links, n, missing counts, coverage and CSVs support checking. Matrix shading uses current display filters, not a refitted significance test. Spearman default avoids letting a few very large municipalities wholly determine the first view; Pearson is available for comparison.

## Rebuild and test

```sh
python -m pip install -r scripts/data/municipal-requirements.txt
python scripts/data/build-municipal-correlations.py
python -m unittest discover -s scripts/data -p 'test_municipal_correlations.py'
npm test -- src/components/kunnat/municipal.test.tsx
```

`--refresh` repeats pinned queries and refreshes source metadata/responses. Review updated municipality boundaries, indicator definitions, source suppression and changes to coverage before committing. Generated data is imported by the shared React component, so preview, Pages and offline bundles use the same values and interactions; no live API dependency for readers.

Next methodological extension: geography-aware validation and a stable multi-year view of selected relations. A terrain projection should only follow an explicit choice of signed distance and a visible account of projection error.
