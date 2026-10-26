# Historical measurement inventory

Includes every stored indicator/public-finance series with observations in 1850–1899. Registry inclusion is distinct from calculation approval and does not add weight.

The frozen JSON inputs are packaged in `snapshot-inputs.tar.gz`. The scripts restore only missing JSON files from that archive. No original statistical values are changed by the inventory.

Reproduce offline:

```sh
python scripts/data/historical-metrics/build-registry.py
python -m unittest discover -s scripts/data/historical-metrics -p 'test_*.py'
```

Online refresh (creates a new source snapshot; review before a new registry version):

```sh
python scripts/data/historical-metrics/check-sources.py
python scripts/data/historical-metrics/check-live-series.py
python scripts/data/historical-metrics/check-finance-copies.py
```

Database exports are specified by `export-queries.json` in the archive. `persist-registry.sql` writes only the versioned `dataset_meta` registry and verifies historical row counts. Repeating an identical import does not add rows; changed content requires a new registry ID.

Numeric source comparison covers all existing cells of 38 StatFin 15ai indicator representations, their 38 public-finance counterparts, and nine mortality/life-expectancy series. PDF hash equality verifies document identity, not each transcribed cell. The archive omits repeated embedded CSV bytes and per-row metadata; source provenance hashes and series metadata are retained.

Results: `docs/historical-metrics/raportti.md` and `registry.json`.
