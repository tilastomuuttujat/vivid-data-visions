import unittest
from unittest.mock import patch
import turso_content as atlas
import test_turso_indicators as existing
import turso_indicators as core

class ContentTests(unittest.TestCase):
    setUp = existing.TransferTests.setUp
    tearDown = existing.TransferTests.tearDown
    request = existing.TransferTests.request
    def test_all_allowlisted_schemas_restart_and_conflict(self):
        db = core.Turso()
        for table, cfg in atlas.CONFIG.items():
            row = dict.fromkeys(cfg["columns"])
            for key in cfg["pk"]:
                row[key] = 1 if key in cfg["integers"] else "key"
            for key in cfg["json"]:
                row[key] = {"nested": ["ää", 1]} if key not in ("domains", "effects", "sources") else ["ää"]
            db.execute([core.stmt(core.create(table))], close=True)
            self.assertEqual(core.copy_page(db, table, [row])[1], 1)
            self.assertEqual(core.copy_page(db, table, [row])[1], 0)
            text = next(c for c in cfg["columns"] if c not in cfg["pk"])
            row[text] = 2 if text in cfg["integers"] else {"changed": True} if text in cfg["json"] else "changed"
            with self.assertRaises(ValueError):
                core.copy_page(db, table, [row])

    def test_restricted_page_and_extra_rows_fail(self):
        table = "articles"
        with patch.object(core, "source_request", return_value=[]):
            with self.assertRaises(ValueError):
                atlas.read_source(table)

    def test_missing_reference_fails(self):
        self.db.execute("CREATE TABLE public__atlas_mechanisms(theme_id INTEGER)")
        self.db.execute("CREATE TABLE public__atlas_themes(id INTEGER)")
        self.db.execute("INSERT INTO public__atlas_mechanisms VALUES(999)")
        with patch.object(atlas, "REFERENCES", [("atlas_mechanisms","theme_id","atlas_themes","id")]):
            with self.assertRaisesRegex(ValueError, "Missing reference"):
                atlas.validate_references(core.Turso())


    def test_large_json_singleton_batches_and_restart(self):
        db = core.Turso()
        table = "dataset_meta"
        db.execute([core.stmt(core.create(table))], close=True)
        rows = [{"id": "small-before", "data": {"x": "a"}},
                {"id": "large", "data": {"x": "ä" * 200000 + "x" * 600000}},
                {"id": "small-after", "data": {"x": "b"}}]
        with self.assertRaisesRegex(ValueError, "configured transfer limit"):
            core.copy_page(db, table, rows)
        self.assertEqual(self.db.execute("SELECT count(*) FROM public__dataset_meta").fetchone()[0], 0)
        with patch.object(db, "execute", wraps=db.execute) as execute:
            self.assertEqual(core.copy_page(db, table, rows, max_row_bytes=4*1024*1024)[1], 3)
            inserts = [call.args[0][0] for call in execute.call_args_list
                       if call.args[0][0]["sql"].startswith("INSERT")]
            self.assertEqual(len(inserts), 3)
            self.assertEqual([len(s["args"]) for s in inserts], [3, 3, 3])
        self.assertEqual(core.copy_page(db, table, rows, max_row_bytes=4*1024*1024)[1], 0)
        rows[1]["data"]["x"] += "changed"
        with self.assertRaisesRegex(ValueError, "differs"):
            core.copy_page(db, table, rows, max_row_bytes=4*1024*1024)

    def test_large_json_still_has_explicit_upper_bound(self):
        db = core.Turso()
        db.execute([core.stmt(core.create("dataset_meta"))], close=True)
        row = {"id": "too-big", "data": {"x": "x" * (4*1024*1024)}}
        with self.assertRaisesRegex(ValueError, "configured transfer limit"):
            core.copy_page(db, "dataset_meta", [row], max_row_bytes=4*1024*1024)
        self.assertEqual(self.db.execute("SELECT count(*) FROM public__dataset_meta").fetchone()[0], 0)

class NumericTests(unittest.TestCase):
    def test_exact_decimal_source_conversion(self):
        from decimal import Decimal
        table = "statistic_values"
        row = dict.fromkeys(atlas.CONFIG[table]["columns"])
        row.update(series_code="a", year=2000, value=Decimal("0.123456789012345678901"))
        with patch.dict(atlas.CONFIG[table], {"expected": 1}), patch.object(core, "source_page", side_effect=lambda t,o,*a: [dict(row)] if o == 0 else []):
            rows, _ = atlas.read_source(table)
        self.assertEqual(rows[0]["value"], "0.123456789012345678901")
        self.assertEqual(core.transform(table, rows[0])[atlas.CONFIG[table]["columns"].index("value")+1], rows[0]["value"])

if __name__ == "__main__":
    unittest.main()
