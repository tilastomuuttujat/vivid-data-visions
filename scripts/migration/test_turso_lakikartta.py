import json
import os
import unittest
from decimal import Decimal
from unittest.mock import patch
import test_turso_indicators as existing
import turso_lakikartta as migration
import turso_indicators as core

class LakiTests(unittest.TestCase):
    setUp=existing.TransferTests.setUp
    tearDown=existing.TransferTests.tearDown
    request=existing.TransferTests.request

    def ledger(self):
        self.db.execute("CREATE TABLE "+migration.LEDGER+" (table_name TEXT,page_offset INTEGER,row_count INTEGER,page_size INTEGER,expected_rows INTEGER,start_cursor TEXT,end_cursor TEXT,sha256 TEXT,PRIMARY KEY(table_name,page_offset))")

    def row(self,table,key="a"):
        cfg=migration.CONFIG[table]
        row=dict.fromkeys(cfg["columns"])
        for column in cfg["pk"]:
            row[column]=1 if column in cfg["integers"] else key
        for column in cfg["numeric"]:
            row[column]=Decimal("123456789012345.123456789")
        for column in cfg["json"]:
            row[column]={"precision":Decimal("0.1234567890123456789")}
        return row

    def test_every_schema_exact_copy_and_restart(self):
        db=migration.Target()
        for table in migration.CONFIG:
            row=self.row(table)
            db.execute([core.stmt(core.create(table))],close=True)
            self.assertEqual(migration.copy(db,table,[row]),1)
            self.assertEqual(migration.copy(db,table,[row]),0)
        self.assertIsNotNone(self.db.execute("SELECT name FROM sqlite_master WHERE name='lakikartta__statute_catalog'").fetchone())

    def test_unkeyed_duplicates_and_nulls_are_retained(self):
        table="lakikartta__cofog"
        db=migration.Target()
        db.execute([core.stmt(core.create(table))],close=True)
        first=dict.fromkeys(migration.CONFIG[table]["columns"])
        first["_source_row_ordinal"]=1
        second=dict(first,_source_row_ordinal=2)
        self.assertEqual(migration.copy(db,table,[first,second]),2)
        self.assertEqual(migration.copy(db,table,[first,second]),0)
        self.assertEqual(migration.table_count(db,table),2)

    def test_rpc_tuple_and_position_are_structured(self):
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'[]'
        after=['a,"b',"x", "y"]
        with patch.dict(os.environ,{"SUPABASE_READ_KEY":"test-only"}),patch.object(migration.urllib.request,"urlopen",return_value=Response()) as call:
            migration.rpc_page("lakikartta__societal_series_inventory",after,500,1000)
        body=json.loads(call.call_args.args[0].data)
        self.assertEqual(body["p_after"],after)
        self.assertEqual(body["p_offset"],1000)
        self.assertEqual(body["p_table"],"lakikartta.societal_series_inventory")

    def test_resume_and_changed_boundary(self):
        self.ledger()
        table="lakikartta__societal_series_inventory"
        rows=[self.row(table,key) for key in ("a","b","c")]
        def page(t,after,count,offset=0):
            return rows[offset:offset+count]
        with patch.dict(migration.CONFIG[table],{"expected":3}),patch.object(migration,"PAGE_SIZE",2),patch.object(migration,"fetch_page",side_effect=page):
            db=migration.Target()
            with patch.object(migration.time,"monotonic",side_effect=[0,10]):
                self.assertFalse(migration.transfer_table(db,table,5))
            self.assertEqual(migration.table_count(db,table),2)
            self.assertTrue(migration.transfer_table(db,table,float("inf")))
            self.assertTrue(migration.transfer_table(db,table,float("inf")))
            text=next(c for c in migration.CONFIG[table]["columns"] if c not in migration.CONFIG[table]["pk"] and c not in migration.CONFIG[table]["json"])
            rows[-1][text]="changed"
            with self.assertRaisesRegex(ValueError,"resume boundary"):
                migration.transfer_table(db,table,float("inf"))

    def test_empty_table_is_created_and_verified(self):
        self.ledger()
        table="lakikartta__amendment_parents"
        with patch.object(migration,"fetch_page",return_value=[]):
            self.assertTrue(migration.transfer_table(migration.Target(),table,float("inf")))
        self.assertEqual(migration.table_count(migration.Target(),table),0)

    def test_short_extra_and_bad_ordinal_pages_fail(self):
        with patch.object(migration,"rpc_page",return_value=[]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                migration.fetch_page("lakikartta__statute_catalog",None,500)
        with patch.object(migration,"rpc_page",return_value=[{}]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                migration.fetch_page("lakikartta__statute_catalog",["last"],0)
        with patch.object(migration,"rpc_page",return_value=[{"_source_row_ordinal":3}]):
            with self.assertRaisesRegex(ValueError,"ordinals"):
                migration.fetch_page("lakikartta__cofog",[1],1,1)

    def test_composite_reference_checks_all_columns_and_skips_partial_null(self):
        self.db.execute("CREATE TABLE lakikartta__child(a TEXT,b TEXT)")
        self.db.execute("CREATE TABLE lakikartta__parent(x TEXT,y TEXT)")
        self.db.execute("INSERT INTO lakikartta__parent VALUES('a','wrong')")
        self.db.execute("INSERT INTO lakikartta__child VALUES('a','b')")
        ref={"child":"lakikartta__child","parent":"lakikartta__parent","columns":["a","b"],"parent_columns":["x","y"]}
        with patch.object(migration,"REFERENCES",[ref]):
            with self.assertRaisesRegex(ValueError,"Missing"):
                migration.verify_references(migration.Target())
            self.db.execute("INSERT INTO lakikartta__parent VALUES('a','b')")
            self.db.execute("INSERT INTO lakikartta__child VALUES('nullable',NULL)")
            migration.verify_references(migration.Target())

if __name__=="__main__":
    unittest.main()
