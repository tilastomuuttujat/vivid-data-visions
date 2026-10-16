<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Atlas architecture
- Keep atlas data in a separate JSON file and validate user imports before replacing in-memory data, so both views share the same qualitative source without persistence.
- Share the atlas interface between the TanStack preview and standalone HTML exports, so the downloadable versions retain the same interactions.
- Use SVG for the 2D graph and React Three Fiber for the client-only 3D graph; positions encode theme grouping rather than indicator values.

- Observatorio view derives star roles from atlas stage numbers and wave definitions in-component; brightness encodes systemic role, never measured values (indicators are excluded).
- Planeetta view shares one layout model (planet-model.ts) between the SVG semantic-zoom map and the R3F globe; zoom distance selects the information level, plates/clusters are interpretive groupings.

- Standalone download (scripts/standalone) bundles the real app components into one HTML with hash routing, while atlas/anchors/maakunnat JSON stay external and load at runtime — so the download matches the preview and data stays editable.
- GitHub Pages deploy (.github/workflows/deploy.yml) builds scripts/standalone and serves index.html + data/*.json, because Pages cannot run the SSR app.
- Admin editing (src/lib/editor) mutates the imported JSON objects in place and publishes changed files to src/data via the GitHub contents API with a token kept in the admin's localStorage — no backend needed, and the push triggers the Pages workflow.
- Murrokset view (src/components/murrokset) links decisions to the 10-period metanarrative by year; src/data/lainsaadanto.json is regenerated from the user's Excel with scripts/data/convert-lainsaadanto.py, so the spreadsheet stays the editable source.
