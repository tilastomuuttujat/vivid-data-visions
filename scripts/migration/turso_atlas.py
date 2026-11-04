"""Atlas read copies; insert-only and safe to restart. Standard library only."""
import argparse
import json
import sys
import urllib.error
import turso_indicators as core
from turso_pilot import source_rows, verify, stmt, Turso

CONFIG = json.loads(r'''{"atlas_evidence_links":{"columns":["id","mechanism_id","variable_id","series_key","item_id","evidence_role","rationale"],"pk":["id"],"integers":["id","mechanism_id","variable_id"],"json":[],"expected":71},"atlas_links":{"columns":["id","payload"],"pk":["id"],"integers":["id"],"json":["payload"],"expected":147},"atlas_mechanism_cases":{"columns":["id","title","year_start","year_end","kind","status","published","primary_item_id","data","revision","created_at","updated_at"],"pk":["id"],"integers":["year_start","year_end","published","revision"],"json":["data"],"expected":431},"atlas_mechanism_cluster_members":{"columns":["cluster_id","mechanism_id","membership_type","rationale"],"pk":["cluster_id","mechanism_id"],"integers":["cluster_id","mechanism_id"],"json":[],"expected":368},"atlas_mechanism_clusters":{"columns":["id","code","title","description","sort_order"],"pk":["id"],"integers":["id","sort_order"],"json":[],"expected":8},"atlas_mechanism_relations":{"columns":["source_mechanism_id","target_mechanism_id","relation","rationale","evidence_status"],"pk":["source_mechanism_id","target_mechanism_id","relation"],"integers":["source_mechanism_id","target_mechanism_id"],"json":[],"expected":517},"atlas_mechanisms":{"columns":["id","theme_id","title","hypothesis","evidence_status","lag_years_min","lag_years_max","created_at"],"pk":["id"],"integers":["id","theme_id","lag_years_min","lag_years_max"],"json":[],"expected":231},"atlas_stage_mechanisms":{"columns":["theme_id","stage","mechanism_id","role","direction","lag_years_min","lag_years_max","rationale","evidence_status"],"pk":["theme_id","stage","mechanism_id"],"integers":["theme_id","stage","mechanism_id","lag_years_min","lag_years_max"],"json":[],"expected":717},"atlas_stage_variables":{"columns":["theme_id","stage","variable_id","role","direction","rationale"],"pk":["theme_id","stage","variable_id","role"],"integers":["theme_id","stage","variable_id"],"json":[],"expected":192},"atlas_theme_variables":{"columns":["theme_id","variable_id","role","rationale"],"pk":["theme_id","variable_id","role"],"integers":["theme_id","variable_id"],"json":[],"expected":33},"atlas_variable_indicators":{"columns":["variable_id","series_key","relation_type","rationale"],"pk":["variable_id","series_key"],"integers":["variable_id"],"json":[],"expected":2986},"atlas_variables":{"columns":["id","code","name","definition","unit","favorable_direction","measurement_status","source_note","created_at","updated_at"],"pk":["id"],"integers":["id"],"json":[],"expected":33},"items":{"columns":["id","title","year_start","year_end","type","domains","phase","problem","mechanism","effects","long_effect","current_relevance","importance","confidence","sources","created_at","updated_at","unpublished","subtype","evidence_confidence","interpretation_confidence"],"pk":["id"],"integers":["year_start","year_end","importance","unpublished"],"json":["domains","effects","sources"],"expected":1112}}''')
ORDER = ["items", "atlas_variables", "atlas_mechanism_clusters", "atlas_mechanisms",
         "atlas_links", "atlas_mechanism_cases", "atlas_theme_variables",
         "atlas_stage_variables", "atlas_stage_mechanisms", "atlas_mechanism_relations",
         "atlas_mechanism_cluster_members", "atlas_variable_indicators", "atlas_evidence_links"]
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)

# Every declared FK in this transfer, including already copied parents.
REFERENCES = [
 ("atlas_mechanisms","theme_id","atlas_themes","id"),
 ("atlas_theme_variables","theme_id","atlas_themes","id"),
 ("atlas_theme_variables","variable_id","atlas_variables","id"),
 ("atlas_stage_variables","theme_id","atlas_themes","id"),
 ("atlas_stage_variables","variable_id","atlas_variables","id"),
 ("atlas_stage_mechanisms","theme_id","atlas_themes","id"),
 ("atlas_stage_mechanisms","mechanism_id","atlas_mechanisms","id"),
 ("atlas_mechanism_relations","source_mechanism_id","atlas_mechanisms","id"),
 ("atlas_mechanism_relations","target_mechanism_id","atlas_mechanisms","id"),
 ("atlas_mechanism_cluster_members","cluster_id","atlas_mechanism_clusters","id"),
 ("atlas_mechanism_cluster_members","mechanism_id","atlas_mechanisms","id"),
 ("atlas_variable_indicators","variable_id","atlas_variables","id"),
 ("atlas_variable_indicators","series_key","indicator_series","series_key"),
 ("atlas_mechanism_cases","primary_item_id","items","id"),
 ("atlas_evidence_links","mechanism_id","atlas_mechanisms","id"),
 ("atlas_evidence_links","variable_id","atlas_variables","id"),
 ("atlas_evidence_links","series_key","indicator_series","series_key"),
 ("atlas_evidence_links","item_id","items","id"),
]

def read_source(table):
    cfg = CONFIG[table]
    rows = []
    for offset in range(0, cfg["expected"], 200):
        rows.extend(core.source_page(table, offset, 200, cfg["expected"]))
    core.source_page(table, cfg["expected"], 1, cfg["expected"])
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
    print("PASS: Atlas structure, all contents and references verified.", flush=True)

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
