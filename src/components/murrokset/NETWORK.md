# Murrokset: päätösten taustat ja seuraukset

`DecisionNetwork` adapts the incoming/outgoing relation browser and interpretation / comparison / data views from [TTT's pressure map](https://github.com/tilastomuuttujat/TTT/blob/e9b1c03c67fe7f122574da96ee2276b093c018dc/atlas/murros/arviointikartta-paine.html) to React. It does not execute the original HTML, call Supabase, or import its heuristic pressure/evidence scores.

## Data and attribution

- Source: `tilastomuuttujat/TTT`, `atlas/murrosatlas.json`, pinned commit `e9b1c03c67fe7f122574da96ee2276b093c018dc`.
- Snapshot: `src/data/murros-network.json`, 340 nodes and 642 directed relations. Node text, source references, relation types, rationales and confidence labels come from that source; they have not been independently verified.
- `source.blobSha` records the original Git blob. `source.url` links to the precise version.
- Snapshot edge IDs (`ttt-r1`, etc.) follow the order of the source `relations` array. They are local identifiers within a snapshot, not stable upstream relation IDs.
- Original node dates are retained, including cases where a card uses an enactment year and the decision timeline uses an implementation year. Future/scenario nodes are labelled separately.

## Decision crosswalk

`decision-network-model.ts` contains explicit mappings for 63 of the 116 decisions to TTT node IDs. Mappings distinguish a decision counterpart from broader context and carry a textual explanation. Broad context does not transfer all of a phenomenon's relations to the individual law. The remaining 53 decisions show an empty state; titles and dates never generate fallback connections.

The browser follows one-hop directed edges and lets readers recenter on a neighbour. It never completes a chain with unconnected nodes. "Consequences" describes outgoing source relations, which may include association, parallel development, scenarios or unverified causal claims.

## Evidence and interpretation

Confidence is explicitly attributed to TTT. A source's "vahva" label is not independent validation of an effect. The source snapshot has no separate research citations per edge, so the UI says that effect evidence remains unverified and links to the source record instead of inventing citations. Decision citations remain separate. Laboratory links provide observational context, not automatic causal confirmation.

## Refresh and verify

```sh
python scripts/data/import-murros-network.py <40-character-TTT-commit-sha>
npx vitest run src/components/murrokset/decision-network.test.tsx
npx tsc --noEmit
npx vite build -c scripts/standalone/vite.config.ts
```

Review mappings, node sources and changed relations after refresh. The importer validates unique node IDs and edge endpoints before replacing the snapshot. Tests also verify the decision crosswalk and incoming/outgoing navigation.

The browser is loaded lazily from `Murrokset`; its JSON is bundled for both the app and standalone exports. It needs no additional runtime data files or database credentials.
