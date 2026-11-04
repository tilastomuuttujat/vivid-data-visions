"""Network read copies; insert-only and safe to restart. Standard library only."""
import argparse
import json
import sys
import urllib.error
import turso_indicators as core
from turso_pilot import source_rows, verify, stmt, Turso

CONFIG = json.loads(r'''{"painekartta_edges":{"columns":["relation_id","from_item_id","to_item_id","relation_type","rel_class","confidence","rationale","pressure_signal","weight","source_updated_at","generated_at"],"pk":["relation_id"],"integers":["relation_id","pressure_signal"],"json":[],"numeric":["weight"],"expected":595},"painekartta_nodes":{"columns":["item_id","item_title","year_start","year_end","item_type","domains","problem","mechanism","long_effect","importance","evidence_confidence","interpretation_confidence","statute_id","statute_title","statute_year","link_status","link_confidence","link_score","system_weight","network","budget","change_intensity","delegation_depth","coamendment","structural_out","structural_in","pressure_signal_count","repair_signal","pressure","layering_risk","role","coverage_status","methodology_version","source_updated_at","generated_at"],"pk":["item_id"],"integers":["year_start","year_end","importance","statute_year","structural_out","structural_in","pressure_signal_count","repair_signal"],"json":["domains"],"numeric":["link_score","system_weight","network","budget","change_intensity","delegation_depth","coamendment","pressure","layering_risk"],"expected":313},"relations":{"columns":["id","from_id","to_id","type","rel_class","confidence","rationale","created_at","updated_at"],"pk":["id"],"integers":["id"],"json":[],"numeric":[],"expected":595}}''')
ORDER = ["relations", "painekartta_nodes", "painekartta_edges"]
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)

# Every declared FK in this transfer, including already copied parents.
REFERENCES = [
 ("relations","from_id","items","id"),
 ("relations","to_id","items","id"),
 ("painekartta_nodes","item_id","items","id"),
 ("painekartta_edges","relation_id","relations","id"),
 ("painekartta_edges","from_item_id","painekartta_nodes","item_id"),
 ("painekartta_edges","to_item_id","painekartta_nodes","item_id"),
]

def read_source(table):
    cfg = CONFIG[table]
    rows = []
    for offset in range(0, cfg["expected"], 200):
        rows.extend(core.source_page(table, offset, 200, cfg["expected"]))
    core.source_page(table, cfg["expected"], 1, cfg["expected"])
    for row in rows:
        for column in cfg["numeric"]:
            if row[column] is not None:
                row[column] = str(row[column])
    encoded = [core.transform(table, row) for row in rows]
    if len({row[0] for row in encoded}) != cfg["expected"]:
        raise ValueError("Duplicate source keys: " + table)
    return rows, core.page_hash(encoded)

def validate_references(db):
    for child, column, parent, key in REFERENCES:
        sql = ("SELECT count(*) FROM public__" + child + " c LEFT JOIN public__" +
               parent + " p ON c." + column + "=p." + key +
               " WHERE c." + column + " IS NOT NULL AND p." + key + " IS NULL")
        if core.decode(db.execute([stmt(sql)], close=True)[0])[0][0]:
            raise ValueError("Missing reference: " + child + "." + column)

def migrate(apply=False):
    # Preflight the complete allowlist before any target write; limited RLS fails closed.
    core.ensure_full_source_access("indicator_values")
    themes = source_rows()
    if len(themes) != 32:
        raise ValueError("Theme count changed")
    sources = {table: read_source(table) for table in ORDER}
    print("Source preflight:", sum(len(r) for r, _ in sources.values()), "rows", flush=True)
    if not apply:
        print("SAMPLE/PARTIAL: full source preflight only; target not contacted.")
        return
    db = Turso()
    verify(db.execute([stmt("SELECT id,payload,updated_at FROM public__atlas_themes ORDER BY id")], close=True)[0], themes)
    if core.decode(db.execute([stmt("SELECT count(*) FROM public__indicator_series")], close=True)[0])[0][0] != 2461:
        raise ValueError("Complete series transfer first")
    for table in ORDER:
        rows, fingerprint = sources[table]
        db.execute([stmt(core.create(table))], close=True)
        added = 0
        for start in range(0, len(rows), 200):
            _, n = core.copy_page(db, table, rows[start:start+200])
            added += n
        actual = core.decode(db.execute([stmt("SELECT " + ",".join(core.names(table)) +
                            " FROM public__" + table)], close=True)[0])
        wanted = [core.transform(table, r) for r in rows]
        if {r[0]:r for r in actual} != {r[0]:r for r in wanted}:
            raise ValueError("Full target content differs: " + table)
        print("Verified:", table, len(rows), "rows;", added, "inserted; SHA256", fingerprint, flush=True)
    validate_references(db)
    # Detect changes during this run before declaring success.
    for table in ORDER:
        if read_source(table)[1] != sources[table][1]:
            raise ValueError("Source changed during transfer: " + table)
    if source_rows() != themes:
        raise ValueError("Themes changed during transfer")
    print("PASS: Relations and pressure map, all contents and references verified.", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        migrate(args.apply)
    except Exception as error:
        message = "HTTP " + str(error.code) if isinstance(error, urllib.error.HTTPError) else str(error) if isinstance(error, ValueError) else type(error).__name__
        print("FAILED:", message, file=sys.stderr)
        sys.exit(1)
