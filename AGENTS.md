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
