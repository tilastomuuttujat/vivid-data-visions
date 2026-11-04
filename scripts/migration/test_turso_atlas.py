import unittest
from unittest.mock import patch
import turso_atlas as atlas
import test_turso_indicators as existing
import turso_indicators as core

class AtlasTests(unittest.TestCase):
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
        table = "atlas_variables"
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

if __name__ == "__main__":
    unittest.main()
