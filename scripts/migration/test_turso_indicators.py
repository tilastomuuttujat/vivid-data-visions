import os
import sqlite3
import unittest
from decimal import Decimal
from unittest.mock import patch
import turso_pilot as transport
import turso_indicators as migration

class TransferTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:", isolation_level=None)
        os.environ["TURSO_AUTH_TOKEN"] = "test-only"
        self.mock = patch.object(transport, "request", self.request)
        self.mock.start()

    def tearDown(self):
        self.mock.stop()
        self.db.close()

    def request(self, url, headers, body=None):
        result = []
        for request in body["requests"]:
            if request["type"] == "close":
                result.append({"type": "ok", "response": {"type": "close"}})
                continue
            statement = request["stmt"]
            values = [None if a["type"] == "null" else int(a["value"]) if a["type"] == "integer" else a["value"] for a in statement["args"]]
            try:
                cursor = self.db.execute(statement["sql"], values)
                rows = [[{"type": "null"} if v is None else {"type": "integer" if type(v) is int else "text", "value": str(v)} for v in row] for row in cursor.fetchall()]
                result.append({"type": "ok", "response": {"type": "execute", "result": {"rows": rows}}})
            except sqlite3.Error:
                result.append({"type": "error"})
        return {"baton": None, "results": result}, {}

    def row(self, key):
        row = dict.fromkeys(migration.CONFIG["indicator_series"]["columns"])
        row.update(series_key=key, title="Ääkköset", published=True,
                   metadata={"precise": Decimal("12345678901234567890.123456789")},
                   lenses=["A", "B"])
        return row

    def test_resume_and_conflict(self):
        rows = [self.row("a"), self.row("b"), self.row("c")]
        def page(table, offset, size, expected, after=None):
            return rows[offset:offset+size]
        with patch.object(migration, "source_page", page):
            self.assertFalse(migration.run("indicator_series", True, 1, 2, 3))
            self.assertEqual(self.db.execute("select count(*) from public__indicator_series").fetchone()[0], 2)
            self.assertTrue(migration.run("indicator_series", True, 2, 2, 3))
            self.assertTrue(migration.run("indicator_series", True, 2, 2, 3))
            rows[-1]["title"] = "changed"
            with self.assertRaises(ValueError):
                migration.run("indicator_series", True, 2, 2, 3)
        self.assertEqual(self.db.execute("select title from public__indicator_series where series_key='c'").fetchone()[0], "Ääkköset")

    def test_keyset_and_no_count_request(self):
        seen = []
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'[{}]'
        def capture(req, timeout):
            seen.append(req)
            return Response()
        with patch.dict(os.environ, {"SUPABASE_READ_KEY": "test-only"}), patch.object(migration.urllib.request, "urlopen", side_effect=capture):
            migration.source_page("indicator_values", 500, 1, 501, after=['a,"b', 1900, ""])
        from urllib.parse import urlsplit, parse_qs
        query = parse_qs(urlsplit(seen[0].full_url).query)
        self.assertNotIn("offset", query)
        self.assertNotIn("Prefer", seen[0].headers)
        self.assertIn("or", query)
        self.assertIn("series_key", query)

    def test_decimal_and_composite_keys(self):
        cfg = migration.CONFIG["indicator_values"]
        row = dict.fromkeys(cfg["columns"])
        row.update(series_key='a"ä', year=1900, group_key="", value=Decimal("0.123456789012345678901"), meta={"x": Decimal("0.100000000000000000001")})
        db = migration.Turso()
        db.execute([migration.stmt(migration.create("indicator_values"))], close=True)
        encoded, added = migration.copy_page(db, "indicator_values", [row])
        self.assertEqual(added, 1)
        self.assertEqual(migration.copy_page(db, "indicator_values", [row])[1], 0)
        self.assertIn("0.100000000000000000001", encoded[0][-2])
        self.assertEqual(self.db.execute("select value from public__indicator_values").fetchone()[0], str(row["value"]))
        row["value"] = "2"
        with self.assertRaises(ValueError):
            migration.copy_page(db, "indicator_values", [row])

    def test_source_truncation_rejected(self):
        class Response:
            headers = {"Content-Range": "0-0/3"}
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'[{}]'
        with patch.dict(os.environ, {"SUPABASE_READ_KEY":"test-only"}), patch.object(migration.urllib.request, "urlopen", return_value=Response()):
            with self.assertRaises(ValueError):
                migration.source_page("indicator_series", 0, 2, 3)

if __name__ == "__main__":
    unittest.main()
