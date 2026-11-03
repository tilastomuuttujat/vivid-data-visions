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

    def test_legacy_checkpoints_are_revalidated_without_overwrite(self):
        rows = [self.row("a"), self.row("b"), self.row("c")]
        db = migration.Turso()
        db.execute([migration.stmt(migration.create("indicator_series"))], close=True)
        migration.copy_page(db, "indicator_series", rows[:2])
        self.db.execute("CREATE TABLE _indicator_transfer_pages (marker TEXT)")
        self.db.execute("INSERT INTO _indicator_transfer_pages VALUES ('old-boundary')")
        calls = []
        def page(table, offset, size, expected, after=None):
            calls.append(offset)
            return rows[offset:offset+size]
        with patch.object(migration, "source_page", side_effect=page):
            self.assertTrue(migration.run("indicator_series", True, 10, 2, 3))
        self.assertEqual(calls[0], 0)
        self.assertEqual(self.db.execute("SELECT count(*) FROM public__indicator_series").fetchone()[0], 3)
        self.assertEqual(self.db.execute("SELECT marker FROM _indicator_transfer_pages").fetchone()[0], "old-boundary")

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
        self.assertNotIn("or", query)
        self.assertIn("group_key", query)
        self.assertIn("series_key", query)

    def test_keyset_ranges_fill_page(self):
        calls = []
        def request(table, parameters):
            calls.append(parameters)
            return [{"n": len(calls)}]
        with patch.object(migration, "source_request", side_effect=request):
            rows = migration.source_page("indicator_values", 500, 3, 503, after=["a", 1900, "g"])
        self.assertEqual(len(rows), 3)
        self.assertEqual(calls[0]["group_key"], 'gt.g')
        self.assertEqual(calls[1]["year"], "gt.1900")
        self.assertEqual(calls[2]["series_key"], 'gt.a')
        self.assertEqual([c["limit"] for c in calls], [3,2,1])
        self.assertTrue(all("or" not in c and "offset" not in c for c in calls))

    def test_query_values_are_not_json_quoted(self):
        calls = []
        def request(table, parameters):
            calls.append(parameters)
            return [{"n": 1}]
        with patch.object(migration, "source_request", side_effect=request):
            migration.source_page("indicator_values", 500, 1, 501, after=['a,"b',1900,""])
        self.assertEqual(calls[0]["series_key"], 'eq.a,"b')
        self.assertEqual(calls[0]["group_key"], "gt.")

    def test_repeated_page_stops_before_writes(self):
        rows = [self.row("a"), self.row("b")]
        with patch.object(migration, "source_page", return_value=rows):
            with self.assertRaisesRegex(ValueError, "pagination repeated"):
                migration.run("indicator_series", True, 10, 2, 4)
        self.assertEqual(self.db.execute("SELECT count(*) FROM public__indicator_series").fetchone()[0], 2)
        self.assertEqual(self.db.execute("SELECT count(*) FROM _indicator_transfer_pages_v3").fetchone()[0], 1)

    def test_overlapping_shifted_page_stops(self):
        rows = [self.row("a"),self.row("b"),self.row("c")]
        with patch.object(migration, "source_page", side_effect=[rows[:2],rows[1:]]):
            with self.assertRaisesRegex(ValueError, "pagination repeated"):
                migration.run("indicator_series", True, 10, 2, 4)
        self.assertEqual(self.db.execute("SELECT count(*) FROM public__indicator_series").fetchone()[0], 2)

    def test_transient_retry(self):
        import urllib.error
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b"[]"
        failure = urllib.error.HTTPError("https://example.invalid", 500, "test", {}, None)
        with patch.dict(os.environ, {"SUPABASE_READ_KEY": "test-only"}), patch.object(migration.time, "sleep"), patch.object(migration.urllib.request, "urlopen", side_effect=[failure, Response()]) as get:
            self.assertEqual(migration.source_request("indicator_values", {"limit":1}), [])
            self.assertEqual(get.call_count, 2)

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
