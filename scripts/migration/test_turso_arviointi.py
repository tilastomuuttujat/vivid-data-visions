import json
import os
import unittest
from decimal import Decimal
from unittest.mock import patch
from contextlib import ExitStack
import test_turso_indicators as existing
import turso_arviointi as migration
import turso_indicators as core

class ArviointiTests(unittest.TestCase):
    setUp=existing.TransferTests.setUp
    tearDown=existing.TransferTests.tearDown
    request=existing.TransferTests.request

    def row(self,table):
        cfg=migration.CONFIG[table]
        row=dict.fromkeys(cfg["columns"])
        for key in cfg["pk"]:
            row[key]="00000000-0000-0000-0000-000000000001" if key in ("id","matrix_id") else "key"
        for key in cfg["numeric"]:
            row[key]=Decimal("0.1234567890123456789")
        for key in cfg["integers"]:
            row[key]=True if key=="is_default" else 1
        if table=="arviointi__matrices":
            row["user_id"]="00000000-0000-0000-0000-000000000099"
        return row

    def test_complete_copy_restart_owner_and_conflict(self):
        rows={table:self.row(table) for table in migration.CONFIG}
        def page(table,after=None,limit=200):
            return [dict(rows[table])] if after is None else []
        with ExitStack() as stack:
            for cfg in migration.CONFIG.values():
                stack.enter_context(patch.dict(cfg,{"expected":1}))
            stack.enter_context(patch.object(migration,"source_page",side_effect=page))
            migration.migrate(True)
            migration.migrate(True)
            self.assertEqual(self.db.execute("SELECT user_id FROM arviointi__matrices").fetchone()[0],rows["arviointi__matrices"]["user_id"])
            self.assertEqual(self.db.execute("SELECT mean_direction FROM arviointi__lens_aggregate").fetchone()[0],"0.1234567890123456789")
            self.db.execute("UPDATE arviointi__matrices SET name='target changed'")
            with self.assertRaisesRegex(ValueError,"differs"):
                migration.migrate(True)
            self.assertEqual(self.db.execute("SELECT name FROM arviointi__matrices").fetchone()[0],"target changed")

    def test_rpc_preserves_composite_uuid_cursor(self):
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'[]'
        after=["00000000-0000-0000-0000-000000000001",'a,"b',"lens"]
        with patch.dict(os.environ,{"SUPABASE_READ_KEY":"test-only"}),patch.object(migration.urllib.request,"urlopen",return_value=Response()) as call:
            migration.source_page("arviointi__overrides",after,1)
        body=json.loads(call.call_args.args[0].data)
        self.assertEqual(body["p_after"],after)
        self.assertEqual(body["p_table"],"arviointi.overrides")

    def test_composite_reference_checks_lens(self):
        self.db.execute("CREATE TABLE arviointi__lens_baselines(phenomenon_id TEXT,lens_id TEXT)")
        self.db.execute("CREATE TABLE arviointi__lens_aggregate(phenomenon_id TEXT,lens_id TEXT)")
        self.db.execute("INSERT INTO arviointi__lens_baselines VALUES('a','one')")
        self.db.execute("INSERT INTO arviointi__lens_aggregate VALUES('a','two')")
        ref=next(r for r in migration.REFERENCES if r[0]=="arviointi__lens_aggregate")
        with patch.object(migration,"REFERENCES",[ref]):
            with self.assertRaisesRegex(ValueError,"Missing reference"):
                migration.verify_references(migration.Target())

    def test_short_source_fails_before_target(self):
        with patch.object(migration,"source_page",return_value=[]),patch.object(migration,"Target") as target:
            with self.assertRaisesRegex(ValueError,"count differs"):
                migration.migrate(True)
            target.assert_not_called()

    def test_source_changes_fail_final_comparison(self):
        rows={table:self.row(table) for table in migration.CONFIG}
        reads={}
        def page(table,after=None,limit=200):
            if after is not None:return []
            reads[table]=reads.get(table,0)+1
            row=dict(rows[table])
            if reads[table]>1 and table=="arviointi__matrices":
                row["name"]="changed at source"
            return [row]
        with ExitStack() as stack:
            for cfg in migration.CONFIG.values():
                stack.enter_context(patch.dict(cfg,{"expected":1}))
            stack.enter_context(patch.object(migration,"source_page",side_effect=page))
            with self.assertRaisesRegex(ValueError,"Source changed"):
                migration.migrate(True)

if __name__=="__main__":
    unittest.main()
