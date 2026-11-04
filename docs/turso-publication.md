# Public Turso publication

The application keeps its editorial atlas JSON and curated research panels. The new
`/aineisto` route (Pages: `#/aineisto`) browses a separate public snapshot built from
Turso. Pages remains static: no database token is shipped to the browser.

On a trusted main-branch Pages build, `scripts/publish/export_turso.py` reads:

- `public__indicator_series` where `published=1`, using explicit public fields;
- values where both the row's `is_published=1` and its parent's `published=1`;
- infographic metadata where `unpublished=0` and only their referenced image BLOBs.

Articles, audit data, private schemas and unpublished records are excluded. Series
JSON is loaded on selection; images are lazy-loaded. Original decimal strings,
nulls, years, group labels and value kinds are retained. Missing years are never
filled. Public flags describe publication eligibility, not evidence quality.

The exporter uses read-only SQL, keyset pagination, count reconciliation and a
second publication-selection check. The migration archive must remain unchanged
during an export; this is a publication of the archive, not a new Supabase sync.
Only a successful export replaces the previous generated directory. Image bytes
are verified against archive size and SHA-256 before writing. CI fails closed on
missing credentials, missing images, count mismatches or digest mismatches.

## Five reviewed path aliases

Source captions explicitly record the old IDs, and the original images were
visually checked. The exporter pins the SHA-256 of each reviewed image. It preserves
both the source path and effective archive path; source tables and the immutable
migration audit remain unchanged. Embedded image identifiers are not edited.

| Source path | Archived original |
| --- | --- |
| M18_kriisien_piirteet.webp | M02_kriisien_piirteet.webp |
| M17_onnistumisten_piirteet.webp | M01_onnistumisten_piirteet.webp |
| G08_oikeudenmukaisuus.webp | G01_oikeudenmukaisuus.webp |
| G09_sukupolvi_kantaa.webp | G02_sukupolvi_kantaa.webp |
| G07_tulevien_oikeudet.webp | G04_tulevien_oikeudet.webp |

## Build and update

`TURSO_AUTH_TOKEN` is an existing Actions secret, used only in the export step on
main. Pull-request builds use no database credentials and do not export data.
Run the Pages workflow again to publish a new snapshot after intentional Turso
updates. This adds a read path, not a browser database editor or automatic upstream
synchronization. Existing JSON editing and GitHub publication remain intact.

Generated files live under ignored `public/data/turso/`. The packager includes them
in Pages, the download data folder and each complete ZIP. They are not committed
to Git. Extract a ZIP completely and serve it over HTTP to browse the extra data
(`python3 -m http.server 8000`); direct `file://` fetches may be blocked by browsers.

Tests: `python -m unittest discover -s scripts/publish -p 'test_*.py'`,
`bun run typecheck`, `bun run test`, `bun run build:site`.
Supabase Auth and other operational services have not been replaced by this step.
