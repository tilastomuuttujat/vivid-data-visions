"""Content and metadata read copies; insert-only and safe to restart. Standard library only."""
import argparse
import json
import sys
import urllib.error
import turso_indicators as core
from turso_pilot import source_rows, verify, stmt, Turso

CONFIG = json.loads(r'''{"article_dataset_meta":{"columns":["id","data"],"pk":["id"],"integers":[],"json":["data"],"numeric":[],"expected":1},"article_links":{"columns":["id","article_id","item_id","relation_type","weight","sort_order","created_at"],"pk":["id"],"integers":["id","weight","sort_order"],"json":[],"numeric":[],"expected":436},"article_relation_types":{"columns":["type","label"],"pk":["type"],"integers":[],"json":[],"numeric":[],"expected":5},"articles":{"columns":["id","title","dek","tags","body","status","note","created_at","updated_at"],"pk":["id"],"integers":[],"json":["tags","body"],"numeric":[],"expected":314},"attachments":{"columns":["id","item_id","article_id","storage_path","caption","sort_order","created_at"],"pk":["id"],"integers":["id","sort_order"],"json":[],"numeric":[],"expected":221},"dataset_meta":{"columns":["id","data"],"pk":["id"],"integers":[],"json":["data"],"numeric":[],"expected":285},"indicator_aliases":{"columns":["alias_code","series_key","group_key","match_status","rationale","created_at","updated_at"],"pk":["alias_code"],"integers":[],"json":[],"numeric":[],"expected":12},"statistic_series":{"columns":["code","title","group_name","unit","description","source","source_url","decimals","sort_order","published","created_at","updated_at"],"pk":["code"],"integers":["decimals","sort_order","published"],"json":[],"numeric":[],"expected":12},"statistic_values":{"columns":["series_code","year","value","note","created_at","updated_at"],"pk":["series_code","year"],"integers":["year"],"json":[],"numeric":["value"],"expected":36}}''')
ORDER = ["articles", "article_relation_types", "article_dataset_meta", "dataset_meta",
         "statistic_series", "statistic_values", "indicator_aliases", "article_links", "attachments"]
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)

# Every declared FK in this transfer, including already copied parents.
REFERENCES = [
 ("article_links","article_id","articles","id"),
 ("article_links","item_id","items","id"),
 ("article_links","relation_type","article_relation_types","type"),
 ("attachments","article_id","articles","id"),
 ("attachments","item_id","items","id"),
 ("statistic_values","series_code","statistic_series","code"),
 ("indicator_aliases","alias_code","statistic_series","code"),
 ("indicator_aliases","series_key","indicator_series","series_key"),
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
        total = core.decode(db.execute([stmt("SELECT count(*) FROM public__" + table)], close=True)[0])[0][0]
        if total != len(rows):
            raise ValueError("Target total differs: " + table)
        # Bound responses even when article bodies are large.
        for start in range(0, len(rows), 50):
            wanted = [core.transform(table, r) for r in rows[start:start+50]]
            actual = core.read_page(db, table, [r[0] for r in wanted])
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
    print("PASS: Content and metadata, all contents and references verified.", flush=True)

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
