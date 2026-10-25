# Selityspolku

Route `/selityspolku` is shared by TanStack and the standalone hash app. Navigation contains the entry in both builds.

The pinned private database release is `32b22757-4681-433a-be8e-11d80dfb9c0a`. `explanation-path.json` contains actual model values and accounting allocations from this single release, with input and engine digests. No service credentials or live private-schema calls enter the browser.

Economic allocations use 1990 as baseline; age composition uses fixed 1987 age weights. Actual economic values for 1975–1989 come from the same release's 1975-baseline runs; their levels are baseline-independent. The view does not infer 1990-baseline allocations for years before 1990. Missing observations remain gaps. No forecasts are supplied for 2026–2050.

Refresh the compact snapshot using `scripts/data/export-explanation-path.sql` through an authorized backend SQL connection; it selects the newest non-retracted computed release. Review model/version compatibility, the 3 runs, baseline years, source keys, nulls and tests before replacing the checked-in snapshot. The export does not fetch external sources or refresh calculations itself. To advance the database release, follow `supabase/impact-layer/README.md` first. Update the explicit test release ID only after review. The export selects observations from all three models of one release and retains full 1850–2025 allocation domains.

The 1850–2050 axis never changes when choosing a year or explanation. Curves have bounded annual Bézier intervals, no extrapolation and separate vertical scales. Production and income are independently normalized to 1990 = 100. Age employment is percent of the whole population. Do not add model contributions, infer political causation from timing or chain national-accounts employment to register employment. Public-finance consequences are an explicitly unquantified fourth step, not simulated output. Household averages do not support population-group attribution.

Historical context is separate from numerical attribution and links to the Bank of Finland historical analysis and the Statistics Finland income-distribution publication; alternative domestic and external channels remain visible. Historical income-distribution definitions changed in 1993. Context claims do not calibrate model coefficients.

Validation: tests reconcile Shapley sums to each model's actual 1990-relative change, check the age-crisis distinction, and preserve missing history/future. UI tests cover fixed timeline, the unquantified fiscal step and future selection.
