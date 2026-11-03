"""Resumable, insert-only read copies of two explicitly allowed source tables."""
import argparse
from decimal import Decimal
import hashlib
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from turso_pilot import SOURCE, Turso, stmt

CONFIG = {
    "indicator_series": {
        "columns": "series_key title description source source_url unit geography frequency start_year end_year data_class status theme pressure_domain indicator_role lenses interpretation quality metadata published source_project_ref created_at updated_at".split(),
        "pk": ["series_key"], "integers": {"start_year", "end_year", "published"},
        "json": {"lenses", "quality", "metadata"}, "expected": 2461,
    },
    "indicator_values": {
        "columns": "series_key year group_key group_label period value value_text value_kind validation_status validation_note is_published source_url source_retrieved_at source_version meta imported_at".split(),
        "pk": ["series_key", "year", "group_key"], "integers": {"year", "is_published"},
        "json": {"meta"}, "expected": 629741,
    },
}

def canonical(value):
    # Preserve arbitrary-precision JSON numbers without converting to binary floats.
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("Non-finite decimal")
        return str(value)
    if isinstance(value, dict):
        return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + canonical(value[k]) for k in sorted(value)) + "}"
    if isinstance(value, list):
        return "[" + ",".join(canonical(v) for v in value) + "]"
    return json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":"))

def source_request(table, parameters):
    params = urllib.parse.urlencode(parameters)
    key = os.environ["SUPABASE_READ_KEY"]
    req = urllib.request.Request(SOURCE + "/rest/v1/" + table + "?" + params,
        headers={"apikey": key, "Authorization": "Bearer " + key})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.load(response, parse_float=Decimal)
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 2:
                print("Source HTTP", error.code, "- retry", attempt + 1, flush=True)
                time.sleep(2 ** attempt)
                continue
            raise ValueError("Supabase source HTTP " + str(error.code)) from None

def source_page(table, offset, size, expected, after=None):
    cfg = CONFIG[table]
    base = {"select": ",".join(cfg["columns"]), "order": ",".join(cfg["pk"])}
    if table != "indicator_values":
        rows = source_request(table, dict(base, offset=offset, limit=size))
    elif after is None:
        if offset:
            raise ValueError("Missing keyset cursor")
        rows = source_request(table, dict(base, limit=size))
    else:
        # Three disjoint index ranges avoid the expensive cross-column OR plan.
        a, b, c = [json.dumps(v, ensure_ascii=False) if isinstance(v, str) else str(v) for v in after]
        ranges = [
            {"series_key": "eq." + a, "year": "eq." + b, "group_key": "gt." + c},
            {"series_key": "eq." + a, "year": "gt." + b},
            {"series_key": "gt." + a},
        ]
        rows = []
        for bounds in ranges:
            remaining = size - len(rows)
            if not remaining:
                break
            rows.extend(source_request(table, dict(base, **bounds, limit=remaining)))
    if len(rows) != min(size, expected - offset):
        raise ValueError("Source page truncated or changed")
    return rows

def transform(table, row):
    cfg = CONFIG[table]
    if set(row) != set(cfg["columns"]):
        raise ValueError("Source columns changed")
    key = canonical([row[c] for c in cfg["pk"]])
    if any(row[c] is None for c in cfg["pk"]):
        raise ValueError("Null source key")
    values = [key]
    for column in cfg["columns"]:
        value = row[column]
        if value is not None:
            if column in cfg["json"]:
                value = canonical(value)
            elif column == "value" and table == "indicator_values":
                if isinstance(value, Decimal):
                    if not value.is_finite():
                        raise ValueError("Non-finite source value")
                    value = str(value)
                elif type(value) is int:
                    value = str(value)
                elif not isinstance(value, str):
                    raise ValueError("Unexpected numeric value")
            elif column in cfg["integers"]:
                if type(value) not in (int, bool):
                    raise ValueError("Unexpected integer")
                value = int(value)
            elif not isinstance(value, str):
                raise ValueError("Unexpected text or decimal representation")
        values.append(value)
    return values

def arg(value):
    if value is None:
        return {"type": "null"}
    return {"type": "integer" if type(value) is int else "text", "value": str(value)}

def decode(result):
    return [[None if c["type"] == "null" else int(c["value"]) if c["type"] == "integer" else c["value"]
             for c in row] for row in result["rows"]]

def names(table):
    return ["_migration_key"] + CONFIG[table]["columns"]

def create(table):
    cfg = CONFIG[table]
    fields = ["_migration_key TEXT NOT NULL UNIQUE"]
    fields += [c + (" INTEGER" if c in cfg["integers"] else " TEXT") +
               (" NOT NULL" if c in cfg["pk"] else "") for c in cfg["columns"]]
    fields += ["PRIMARY KEY (" + ",".join(cfg["pk"]) + ")"]
    return "CREATE TABLE IF NOT EXISTS public__" + table + " (" + ",".join(fields) + ")"

def read_page(db, table, keys):
    sql = "SELECT " + ",".join(names(table)) + " FROM public__" + table
    sql += " WHERE _migration_key IN (SELECT value FROM json_each(?))"
    return decode(db.execute([stmt(sql, [arg(canonical(keys))])], close=True)[0])

def copy_page(db, table, rows):
    wanted = [transform(table, r) for r in rows]
    keys = [r[0] for r in wanted]
    if len(set(keys)) != len(keys):
        raise ValueError("Duplicate page keys")
    expected = {r[0]: r for r in wanted}
    existing = read_page(db, table, keys)
    for row in existing:
        if expected[row[0]] != row:
            raise ValueError("Existing target row differs; no replacement permitted")
    present = {r[0] for r in existing}
    missing = [r for r in wanted if r[0] not in present]
    # A single INSERT statement is atomic. Limit each request to ~512 KiB.
    chunks, chunk, byte_count = [], [], 0
    for row in missing:
        size = len(canonical(row).encode())
        if size > 512 * 1024:
            raise ValueError("Row exceeds pilot transfer limit")
        if chunk and (byte_count + size > 512 * 1024 or len(chunk) >= 40):
            chunks.append(chunk)
            chunk, byte_count = [], 0
        chunk.append(row)
        byte_count += size
    if chunk:
        chunks.append(chunk)
    for chunk in chunks:
        placeholders = "(" + ",".join("?" for _ in names(table)) + ")"
        sql = "INSERT INTO public__" + table + " (" + ",".join(names(table)) + ") VALUES "
        sql += ",".join(placeholders for _ in chunk) + " ON CONFLICT DO NOTHING"
        db.execute([stmt(sql, [arg(v) for row in chunk for v in row])], close=True)
    actual = read_page(db, table, keys)
    if {r[0]: r for r in actual} != expected:
        raise ValueError("Target page content differs")
    return wanted, len(missing)

def page_hash(rows):
    return hashlib.sha256(canonical(rows).encode()).hexdigest()

def run(table, apply, max_pages, page_size, expected):
    cfg = CONFIG[table]
    db = Turso() if apply else None
    if db:
        db.execute([stmt(create(table))], close=True)
    digest = hashlib.sha256()
    start, inserted, after = 0, 0, None
    if db:
        db.execute([stmt("CREATE TABLE IF NOT EXISTS _indicator_transfer_pages (table_name TEXT NOT NULL, page_offset INTEGER NOT NULL, page_size INTEGER NOT NULL, expected_rows INTEGER NOT NULL, row_count INTEGER NOT NULL, sha256 TEXT NOT NULL, PRIMARY KEY(table_name,page_offset))")], close=True)
        db.execute([stmt("CREATE TABLE IF NOT EXISTS _indicator_transfer_cursors (table_name TEXT NOT NULL, page_offset INTEGER NOT NULL, cursor_json TEXT, PRIMARY KEY(table_name,page_offset))")], close=True)
        checkpoints = decode(db.execute([stmt("SELECT page_offset,page_size,expected_rows,row_count,sha256 FROM _indicator_transfer_pages WHERE table_name=? ORDER BY page_offset", [arg(table)])], close=True)[0])
        for offset, saved_size, saved_total, count, saved_hash in checkpoints:
            if offset != start or saved_size != page_size or saved_total != expected:
                raise ValueError("Checkpoint settings differ or contain gaps")
            start += count
        if checkpoints:
            last = checkpoints[-1]
            cursor_rows = decode(db.execute([stmt("SELECT cursor_json FROM _indicator_transfer_cursors WHERE table_name=? AND page_offset=?", [arg(table), arg(last[0])])], close=True)[0])
            if table == "indicator_values":
                if not cursor_rows:
                    raise ValueError("Missing saved keyset cursor")
                after = json.loads(cursor_rows[0][0]) if cursor_rows[0][0] else None
            previous = source_page(table, last[0], page_size, expected, after=after)
            encoded, _ = copy_page(db, table, previous)
            if page_hash(encoded) != last[4]:
                raise ValueError("Source changed at resume boundary")
            after = [previous[-1][c] for c in cfg["pk"]]
        if table == "indicator_values":
            parent_count = decode(db.execute([stmt("SELECT count(*) FROM public__indicator_series")], close=True)[0])[0][0]
            if parent_count != CONFIG["indicator_series"]["expected"]:
                raise ValueError("Complete indicator_series transfer first")
    seen = start
    for offset in range(start, expected, page_size):
        if (offset - start) // page_size >= max_pages:
            print("PARTIAL:", table, seen, "rows checked. Run again; matching rows are reused.")
            return False
        rows = source_page(table, offset, page_size, expected, after=after)
        if db:
            encoded, added = copy_page(db, table, rows)
            inserted += added
        else:
            encoded = [transform(table, r) for r in rows]
        for row in encoded:
            digest.update(canonical(row).encode() + b"\n")
        if db:
            db.execute([stmt("INSERT INTO _indicator_transfer_cursors VALUES (?,?,?) ON CONFLICT DO NOTHING",
                [arg(table),arg(offset),arg(canonical(after) if after is not None else None)])], close=True)
            db.execute([stmt("INSERT INTO _indicator_transfer_pages VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING",
                [arg(table),arg(offset),arg(page_size),arg(expected),arg(len(rows)),arg(page_hash(encoded))])], close=True)
        after = [rows[-1][c] for c in cfg["pk"]]
        seen += len(rows)
        if offset // page_size % 20 == 0:
            print(table, seen, "/", expected, "checked;", inserted, "inserted", flush=True)
    # Probe past the approved total without COUNT(*); detects extra visible rows.
    source_page(table, expected, 1, expected, after=after)
    if db:
        total = decode(db.execute([stmt("SELECT count(*) FROM public__" + table)], close=True)[0])[0][0]
        if total != expected:
            raise ValueError("Target total differs")
    if db:
        if table == "indicator_values":
            orphans = decode(db.execute([stmt("SELECT count(*) FROM public__indicator_values v LEFT JOIN public__indicator_series s ON s.series_key=v.series_key WHERE s.series_key IS NULL")], close=True)[0])[0][0]
            if orphans:
                raise ValueError("Values contain missing parent series")
        manifest = decode(db.execute([stmt("SELECT page_offset,row_count,sha256 FROM _indicator_transfer_pages WHERE table_name=? ORDER BY page_offset", [arg(table)])], close=True)[0])
        digest = hashlib.sha256(canonical(manifest).encode())
    print("PASS:", table, seen, "rows; manifest SHA256", digest.hexdigest(), flush=True)
    print("Source must remain unchanged during transfer; this is not a transactional source snapshot.")
    return True

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", choices=CONFIG, required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--max-pages", type=int, default=10000)
    parser.add_argument("--page-size", type=int, default=500)
    parser.add_argument("--expected-rows", type=int)
    args = parser.parse_args()
    if not 1 <= args.page_size <= 500 or not 1 <= args.max_pages <= 10000:
        raise ValueError("Invalid page limits")
    expected = args.expected_rows if args.expected_rows is not None else CONFIG[args.table]["expected"]
    if expected <= 0:
        raise ValueError("Expected rows must be positive")
    complete = run(args.table, args.apply, args.max_pages, args.page_size, expected)
    if not complete and args.apply:
        sys.exit(2)

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Never print raw API exceptions, payloads, tokens, or URLs.
        message = ("Turso HTTP " + str(error.code)) if isinstance(error, urllib.error.HTTPError) else str(error) if isinstance(error, ValueError) else type(error).__name__
        print("FAILED:", message, file=sys.stderr)
        sys.exit(1)
