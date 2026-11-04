"""Resumable insert-only public finance copy. Source must remain frozen."""
import argparse
import hashlib
import json
import sys
import time
import urllib.error
import turso_indicators as core
from turso_pilot import Turso, stmt

CONFIG = json.loads(r'''{"public_finance_item_links":{"columns":["series_key","item_id","relation_type","evidence_status","rationale","source_url"],"pk":["series_key","item_id","relation_type"],"integers":[],"json":[],"numeric":[],"expected":24},"public_finance_observations":{"columns":["series_key","year","value_kind","value","validation_status","source_url","notes","imported_at","release_status"],"pk":["series_key","year","value_kind"],"integers":["year"],"json":[],"numeric":["value"],"expected":970849},"public_finance_series":{"columns":["series_key","source_key","title","measure","sector","geography","classification_system","classification_code","unit","unit_multiplier","currency","price_basis","base_year","accounting_framework","source_locator","comparability_notes","created_at","geography_level","metadata"],"pk":["series_key"],"integers":["base_year"],"json":["metadata"],"numeric":["unit_multiplier"],"expected":32661},"public_finance_sources":{"columns":["source_key","title","publisher","source_url","source_file","source_sha256","source_version","retrieved_at","imported_at","notes","provenance"],"pk":["source_key"],"integers":[],"json":["provenance"],"numeric":[],"expected":139}}''')
ORDER = ["public_finance_sources", "public_finance_series",
         "public_finance_observations", "public_finance_item_links"]
PAGE_SIZE = 500
LEDGER = "_finance_transfer_pages_v1"
for cfg in CONFIG.values():
    cfg["integers"] = set(cfg["integers"])
    cfg["json"] = set(cfg["json"])
core.CONFIG.update(CONFIG)
REFERENCES = [
 ("public_finance_series","source_key","public_finance_sources","source_key"),
 ("public_finance_observations","series_key","public_finance_series","series_key"),
 ("public_finance_item_links","series_key","public_finance_series","series_key"),
 ("public_finance_item_links","item_id","items","id"),
]

def transform(table, row):
    row = dict(row)
    for column in CONFIG[table]["numeric"]:
        if row[column] is not None:
            row[column] = str(row[column])
    return core.transform(table, row)

def fetch_page(table, after, expected_count):
    cfg = CONFIG[table]
    base = {"select": ",".join(cfg["columns"]), "order": ",".join(cfg["pk"])}
    size = PAGE_SIZE if expected_count else 1
    if after is None:
        rows = core.source_request(table, dict(base, limit=size))
    else:
        rows = []
        # Lexicographic successor as disjoint indexed ranges. Raw filter values
        # are URL-encoded by core.source_request, never JSON-quoted.
        for index in reversed(range(len(cfg["pk"]))):
            bounds = {cfg["pk"][j]: "eq." + str(after[j]) for j in range(index)}
            bounds[cfg["pk"][index]] = "gt." + str(after[index])
            remaining = size - len(rows)
            if not remaining:
                break
            rows.extend(core.source_request(table, dict(base, **bounds, limit=remaining)))
    if len(rows) != expected_count:
        raise ValueError("Source page count differs: " + table + "; received " +
                         str(len(rows)) + ", expected " + str(expected_count))
    return rows

def cursor(table, rows):
    return [rows[-1][c] for c in CONFIG[table]["pk"]]

def fingerprint(table, rows):
    return core.page_hash([transform(table, row) for row in rows])

def copy(db, table, rows):
    normalized = []
    for row in rows:
        row = dict(row)
        for column in CONFIG[table]["numeric"]:
            if row[column] is not None:
                row[column] = str(row[column])
        normalized.append(row)
    return core.copy_page(db, table, normalized, max_row_bytes=4*1024*1024)[1]

def read_ledger(db, table):
    result = db.execute([stmt("SELECT page_offset,row_count,page_size,expected_rows,start_cursor,end_cursor,sha256 FROM " +
                        LEDGER + " WHERE table_name=? ORDER BY page_offset", [core.arg(table)])], close=True)[0]
    return core.decode(result)

def table_count(db, table):
    return core.decode(db.execute([stmt("SELECT count(*) FROM public__" + table)], close=True)[0])[0][0]

def transfer_table(db, table, deadline):
    cfg = CONFIG[table]
    total = cfg["expected"]
    db.execute([stmt(core.create(table))], close=True)
    ledger = read_ledger(db, table)
    offset, after = 0, None
    hashes = set()
    for saved in ledger:
        start, count, size, expected, before, end, digest = saved
        if (start != offset or size != PAGE_SIZE or expected != total or
                count != min(PAGE_SIZE, total-offset) or
                before != (core.canonical(after) if after is not None else None) or
                digest in hashes):
            raise ValueError("Invalid or changed finance ledger: " + table)
        hashes.add(digest)
        offset += count
        after = json.loads(end)
    seen_keys = set()
    if ledger:
        last = ledger[-1]
        previous = fetch_page(table, json.loads(last[4]) if last[4] else None, last[1])
        if fingerprint(table, previous) != last[6] or core.canonical(cursor(table, previous)) != last[5]:
            raise ValueError("Source changed at finance resume boundary: " + table)
        copy(db, table, previous)
        seen_keys.update(transform(table, r)[0] for r in previous)
    added = 0
    while offset < total:
        if time.monotonic() >= deadline:
            print("PARTIAL:", table, offset, "/", total, "verified; restart to continue.", flush=True)
            return False
        rows = fetch_page(table, after, min(PAGE_SIZE, total-offset))
        encoded = [transform(table, row) for row in rows]
        keys = [row[0] for row in encoded]
        digest = core.page_hash(encoded)
        end = cursor(table, rows)
        if len(set(keys)) != len(keys) or seen_keys.intersection(keys) or digest in hashes or end == after:
            raise ValueError("Repeated finance source page; no page written")
        added += copy(db, table, rows)
        db.execute([stmt("INSERT INTO " + LEDGER + " VALUES (?,?,?,?,?,?,?,?)",
            [core.arg(v) for v in [table, offset, len(rows), PAGE_SIZE, total,
             core.canonical(after) if after is not None else None, core.canonical(end), digest]])], close=True)
        offset += len(rows)
        after = end
        seen_keys.update(keys)
        hashes.add(digest)
        # Each page emits genuine verified progress rather than a heartbeat.
        print(table, offset, "/", total, "verified;", added, "inserted this run", flush=True)
    fetch_page(table, after, 0)
    if table_count(db, table) != total:
        raise ValueError("Finance target count differs: " + table)
    manifest = hashlib.sha256(core.canonical(read_ledger(db, table)).encode()).hexdigest()
    print("PASS:", table, total, "rows; manifest SHA256", manifest, flush=True)
    return True

def verify_references(db):
    for child, column, parent, key in REFERENCES:
        sql = ("SELECT count(*) FROM public__" + child + " c LEFT JOIN public__" + parent +
               " p ON c." + column + "=p." + key +
               " WHERE c." + column + " IS NOT NULL AND p." + key + " IS NULL")
        if core.decode(db.execute([stmt(sql)], close=True)[0])[0][0]:
            raise ValueError("Missing finance reference: " + child + "." + column)

def run(apply, max_seconds=19800):
    core.ensure_full_source_access("indicator_values")
    deadline = time.monotonic() + max_seconds
    if not apply:
        for table in ORDER:
            rows = fetch_page(table, None, min(PAGE_SIZE, CONFIG[table]["expected"]))
            for row in rows:
                transform(table, row)
        print("SAMPLE/PARTIAL: source sample only; target not contacted.")
        return False
    db = Turso()
    if table_count(db, "items") != 1112:
        raise ValueError("Complete Atlas items transfer first")
    db.execute([stmt("CREATE TABLE IF NOT EXISTS " + LEDGER +
        " (table_name TEXT NOT NULL,page_offset INTEGER NOT NULL,row_count INTEGER NOT NULL," +
        "page_size INTEGER NOT NULL,expected_rows INTEGER NOT NULL,start_cursor TEXT," +
        "end_cursor TEXT NOT NULL,sha256 TEXT NOT NULL,PRIMARY KEY(table_name,page_offset))")], close=True)
    for table in ORDER:
        if not transfer_table(db, table, deadline):
            return False
    verify_references(db)
    print("PASS: Public finance complete; 1003673 rows and all references verified.", flush=True)
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        complete = run(args.apply)
        if args.apply and not complete:
            sys.exit(2)
    except Exception as error:
        message = "HTTP " + str(error.code) if isinstance(error, urllib.error.HTTPError) else str(error) if isinstance(error, ValueError) else type(error).__name__
        print("FAILED:", message, file=sys.stderr)
        sys.exit(1)
