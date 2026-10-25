# Selityspolku

Route `/selityspolku` is shared by TanStack and the standalone hash app. Navigation contains the entry in both builds.

The pinned private database release is `32b22757-4681-433a-be8e-11d80dfb9c0a`. `explanation-path.json` contains actual model values and accounting allocations from this single release, with input and engine digests. No service credentials or live private-schema calls enter the browser.

Economic allocations use 1990 as baseline; age composition uses fixed 1987 age weights. Actual economic values for 1975–1989 come from the same release's 1975-baseline runs; their levels are baseline-independent. The view does not infer 1990-baseline allocations for years before 1990. Missing observations remain gaps. No forecasts are supplied for 2026–2050.

Refresh the compact snapshot using `scripts/data/export-explanation-path.sql` through an authorized backend SQL connection; it selects the newest non-retracted computed release. Review model/version compatibility, the 3 runs, baseline years, source keys, nulls and tests before replacing the checked-in snapshot. The export does not fetch external sources or refresh calculations itself. To advance the database release, follow `supabase/impact-layer/README.md` first. Update the explicit test release ID only after review. The export selects observations from all three models of one release and retains full 1850–2025 allocation domains.

The 1850–2050 axis never changes when choosing a year or explanation. Curves have bounded annual Bézier intervals, no extrapolation and separate vertical scales. Production and income are independently normalized to 1990 = 100. Age employment is percent of the whole population. Do not add model contributions, infer political causation from timing or chain national-accounts employment to register employment. The fourth step now uses an independently versioned fiscal accounting snapshot (see below). Household averages do not support population-group attribution.

Historical context is separate from numerical attribution and links to the Bank of Finland historical analysis and the Statistics Finland income-distribution publication; alternative domestic and external channels remain visible. Historical income-distribution definitions changed in 1993. Context claims do not calibrate model coefficients.

Validation: tests reconcile Shapley sums to each model's actual 1990-relative change, check the age-crisis distinction, and preserve missing history/future. UI tests cover fixed timeline, the fiscal step and future selection.

## Fiscal balance v1

The fourth chart and step use `fiscal-model.json`, rebuilt from `fiscal-inputs.json` by `python3 scripts/data/build-fiscal-model.py`. Inputs are the pinned 18 September 2026 StatFin 15ah S13 consolidated totals and selected disjoint components, plus 15ai nominal GDP, 1975–2025. Unlike the earlier three-model release this is a separately versioned calculation; do not claim it is part of the old impact-layer release. The existing private impact engine/catalog is unchanged.

`export-fiscal-inputs.sql` extracts the same explicit series keys. `verify-fiscal-source.py` compares all 714 selected database cells against official PxWeb (including the independent reported B9/GDP ratio); it fails on source revisions. Keep its exact requests and response digests in `fiscal-verification.json`. The original database quality/status labels are not overwritten. A new source revision needs reviewed new keys and a new snapshot.

The net-lending ratio is `100 × (OTRS − OTES) / nominal GDP`. Relative to 1990, each signed component's numerator change is allocated with the average inverse GDP; a separate symmetric GDP denominator contribution closes the identity. Direct income/wealth taxes here exclude capital taxes, which remain in other revenue. Cash benefits include pensions. Staff, intermediate consumption and purchased social benefits are inputs, not service outcomes. Interest uses actual interest paid minus intra-S13 actual interest; other expenditure is the explicit residual of consolidated total expenditure. The broad public sector includes pension funds; this is neither the central government cash budget nor EDP balance nor debt change. Source rounding can leave ≤2 million euro difference from B9; preserve it.

Nominal components mix quantities and prices. Tax receipts do not identify tax-base versus rate changes. Expense changes do not distinguish demographic needs, indexation, policy and service volumes. No causal policy coefficients or unsupported automatic-stabilizer estimates enter this implementation. Future years stay null.

`python3 scripts/data/persist-fiscal-model.py` emits a transaction to persist immutable, content-addressed input/output manifests into existing `public.dataset_meta` (no schema/API privilege changes). Apply via the authorized backend SQL connector or psql. Same payload is idempotent; different contents under an existing ID raise. This is an explicit reviewed rebuild/persist/export workflow, not a scheduled source updater.

### Murroskertomus 1985–2000

`Recovery.tsx` tiivistää neljän nykyisen mallin havainnot yhdeksi päähavainnoksi ja kolmeksi vuosivalinnaksi (1990, 1993, 2000). Taulukon muutokset ja ensimmäinen paluuvuosi 1994–2000 lasketaan samoista julkaistuista sarjoista kuin käyrät. Paluu tarkoittaa 1990-tason saavuttamista, ei pysyvää palautumista tai paluuta kasvutrendille. Mittareita ei summata eikä historiallisia taustaselityksiä muuteta numeerisiksi syyvaikutuksiksi. Koko 1850–2050-aikajana ja lähdeosio säilyvät. Tämä on näkymän synteesi, eikä lisää uusia havaintoja tietokantaan.
