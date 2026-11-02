"""One-table pilot. Standard library only; never writes to Supabase."""
import argparse
import json
import os
import sys
import urllib.request
from urllib.parse import urlsplit

SOURCE = "https://zzbubbrsgiqsvsovkkmf.supabase.co"
TARGET = "https://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io"

def request(url, headers, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response), response.headers

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))

def source_rows():
    key = os.environ["SUPABASE_READ_KEY"]
    rows, headers = request(
        SOURCE + "/rest/v1/atlas_themes?select=id,payload,updated_at&order=id&limit=1000",
        {"apikey": key, "Authorization": "Bearer " + key, "Prefer": "count=exact"})
    total = headers.get("Content-Range", "").split("/")[-1]
    if not total.isdigit() or int(total) != len(rows) or not rows:
        raise ValueError("Source empty, truncated, or exact count unavailable")
    if len({r["id"] for r in rows}) != len(rows):
        raise ValueError("Duplicate source IDs")
    for row in rows:
        if type(row["id"]) is not int or row["payload"] is None:
            raise ValueError("Invalid source row")
    return rows

class Turso:
    def __init__(self):
        self.baton = None
        self.headers = {"Authorization": "Bearer " + os.environ["TURSO_AUTH_TOKEN"],
                        "Content-Type": "application/json"}
    def execute(self, statements, close=False):
        requests = [{"type": "execute", "stmt": s} for s in statements]
        if close:
            requests.append({"type": "close"})
        result, _ = request(TARGET + "/v2/pipeline", self.headers,
                            {"baton": self.baton, "requests": requests})
        self.baton = result.get("baton")
        if len(result.get("results", [])) != len(requests):
            raise ValueError("Incomplete Turso response")
        if any(r["type"] != "ok" for r in result["results"]):
            raise ValueError("Turso statement failed; details withheld to protect data")
        return [r["response"]["result"] for r in result["results"] if r["response"]["type"] == "execute"]

def stmt(sql, args=None):
    return {"sql": sql, "args": args or []}

def encoded(row):
    return [str(row["id"]), canonical(row["payload"]), row["updated_at"]]

def verify(result, rows):
    actual = [[cell.get("value") for cell in row] for row in result["rows"]]
    # JSON text is compared structurally; timestamps remain exact source strings.
    normalized = [[r[0], canonical(json.loads(r[1])), r[2]] for r in actual]
    if normalized != [encoded(r) for r in rows]:
        raise ValueError("Target differs from source; transaction will not be committed")

def migrate(rows):
    db = Turso()
    try:
        db.execute([stmt("BEGIN IMMEDIATE")])
        commands = [stmt("CREATE TABLE IF NOT EXISTS public__atlas_themes (id INTEGER PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)), updated_at TEXT)")]
        for row in rows:
            values = encoded(row)
            args = [{"type": "integer", "value": values[0]},
                    {"type": "text", "value": values[1]},
                    {"type": "null"} if values[2] is None else {"type": "text", "value": values[2]}]
            # Preserve existing rows. A conflict with different contents fails verification.
            commands.append(stmt("INSERT INTO public__atlas_themes VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING", args))
        commands.append(stmt("SELECT id, payload, updated_at FROM public__atlas_themes ORDER BY id"))
        verify(db.execute(commands)[-1], rows)
        db.execute([stmt("COMMIT")], close=True)
    except Exception:
        if db.baton:
            try:
                db.execute([stmt("ROLLBACK")], close=True)
            except Exception:
                pass
        raise
    # Confirm persisted contents on a fresh connection.
    verify(db.execute([stmt("SELECT id, payload, updated_at FROM public__atlas_themes ORDER BY id")], close=True)[0], rows)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    rows = source_rows()
    print("Source validated:", len(rows), "rows.")
    if args.apply:
        migrate(rows)
        print("Pilot committed and verified:", len(rows), "rows.")
    else:
        print("Dry run: Turso was not contacted or modified.")

if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("Pilot failed. Check secrets, source SELECT permission and target schema. No source writes were made.", file=sys.stderr)
        sys.exit(1)
