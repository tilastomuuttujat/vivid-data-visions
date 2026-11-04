import json
import os
import unittest
from decimal import Decimal
from unittest.mock import patch
import test_turso_indicators as existing
import turso_selitysatlas as sel
import turso_indicators as core

class SelityTests(unittest.TestCase):
    setUp=existing.TransferTests.setUp
    tearDown=existing.TransferTests.tearDown
    request=existing.TransferTests.request

    def row(self,table):
        cfg=sel.CONFIG[table]
        row=dict.fromkeys(cfg["columns"])
        for key in cfg["pk"]:
            row[key]=True if table=="selitysatlas__meta" else 1 if key in cfg["integers"] else "key"
        for key in cfg["json"]:
            row[key]={"nested":["ää",Decimal("0.1234567890123456789")]}
        for key in cfg["numeric"]:
            row[key]="0.1234567890123456789"
        return row

    def test_every_schema_copy_restart_conflict_and_prefix(self):
        db=sel.Target()
        for table,cfg in sel.CONFIG.items():
            row=self.row(table)
            db.execute([core.stmt(core.create(table))],close=True)
            self.assertEqual(core.copy_page(db,table,[row])[1],1)
            self.assertEqual(core.copy_page(db,table,[row])[1],0)
            column=next(c for c in cfg["columns"] if c not in cfg["pk"])
            row[column]=2 if column in cfg["integers"] else {"changed":True} if column in cfg["json"] else "changed"
            with self.assertRaises(ValueError):
                core.copy_page(db,table,[row])
        tables={r[0] for r in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertIn("selitysatlas__themes",tables)
        self.assertIn("public__infographics",tables)
        self.assertNotIn("public__selitysatlas__themes",tables)

    def test_rpc_preserves_boolean_cursor_and_decimal(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self,*args): pass
            def read(self): return b'[{"number":0.1234567890123456789}]'
        with patch.dict(os.environ,{"SUPABASE_READ_KEY":"test-only"}), patch.object(sel.urllib.request,"urlopen",return_value=Response()) as call:
            rows=sel.source_page("selitysatlas__meta",[True],1)
        body=json.loads(call.call_args.args[0].data)
        self.assertEqual(body["p_table"],"selitysatlas.meta")
        self.assertEqual(body["p_after"],[True])
        self.assertEqual(rows[0]["number"],Decimal("0.1234567890123456789"))

    def test_short_and_duplicate_source_fail(self):
        table="selitysatlas__categories"
        with patch.object(sel,"source_page",return_value=[]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                sel.read_source(table)
        row=self.row(table)
        with patch.dict(sel.CONFIG[table],{"expected":2}), patch.object(sel,"source_page",side_effect=[[row,row],[]]):
            with self.assertRaisesRegex(ValueError,"Duplicate"):
                sel.read_source(table)

    def test_private_foreign_reference_is_checked(self):
        self.db.execute("CREATE TABLE selitysatlas__themes(category TEXT)")
        self.db.execute("CREATE TABLE selitysatlas__categories(id TEXT)")
        self.db.execute("INSERT INTO selitysatlas__themes VALUES('missing')")
        with patch.object(sel,"REFERENCES",[sel.REFERENCES[0]]):
            with self.assertRaisesRegex(ValueError,"Missing reference"):
                sel.verify_references(sel.Target())

    def test_source_preflight_failure_does_not_contact_target(self):
        with patch.object(sel,"read_source",side_effect=ValueError("short")), patch.object(sel,"Target") as target:
            with self.assertRaises(ValueError):
                sel.migrate(True)
            target.assert_not_called()

if __name__=="__main__":
    unittest.main()
