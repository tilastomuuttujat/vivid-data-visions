import json
import os
import unittest
from decimal import Decimal
from unittest.mock import patch
import test_turso_indicators as existing
import turso_research as migration
import turso_indicators as core

class ResearchTests(unittest.TestCase):
    setUp=existing.TransferTests.setUp
    tearDown=existing.TransferTests.tearDown
    request=existing.TransferTests.request

    def ledger(self):
        self.db.execute("CREATE TABLE "+migration.LEDGER+" (table_name TEXT,page_offset INTEGER,row_count INTEGER,page_size INTEGER,expected_rows INTEGER,start_cursor TEXT,end_cursor TEXT,sha256 TEXT,PRIMARY KEY(table_name,page_offset))")

    def row(self,table,key="00000000-0000-0000-0000-000000000001"):
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
        self.assertIsNotNone(self.db.execute("SELECT name FROM sqlite_master WHERE name='research__observation'").fetchone())

    def test_rpc_uuid_tuple_is_structured(self):
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'[]'
        after=["00000000-0000-0000-0000-000000000001",1900,'a,"b',"group"]
        with patch.dict(os.environ,{"SUPABASE_READ_KEY":"test-only"}),patch.object(migration.urllib.request,"urlopen",return_value=Response()) as call:
            migration.rpc_page("research__impact_point",after,500,1000)
        body=json.loads(call.call_args.args[0].data)
        self.assertEqual(body["p_after"],after)
        self.assertEqual(body["p_offset"],1000)
        self.assertEqual(body["p_table"],"research.impact_point")

    def test_resume_and_changed_boundary(self):
        self.ledger()
        table="research__observation"
        rows=[self.row(table,"00000000-0000-0000-0000-"+str(i).zfill(12)) for i in (1,2,3)]
        def page(t,after,count,offset=0):
            return rows[offset:offset+count]
        with patch.dict(migration.CONFIG[table],{"expected":3}),patch.object(migration,"PAGE_SIZE",2),patch.object(migration,"fetch_page",side_effect=page):
            db=migration.Target()
            with patch.object(migration.time,"monotonic",side_effect=[0,10]):
                self.assertFalse(migration.transfer_table(db,table,5))
            self.assertEqual(migration.table_count(db,table),2)
            self.assertTrue(migration.transfer_table(db,table,float("inf")))
            self.assertTrue(migration.transfer_table(db,table,float("inf")))
            text=next(c for c in migration.CONFIG[table]["columns"] if c not in migration.CONFIG[table]["pk"] and c not in migration.CONFIG[table]["json"] and c not in migration.CONFIG[table]["numeric"] and c not in migration.CONFIG[table]["integers"])
            rows[-1][text]="changed"
            with self.assertRaisesRegex(ValueError,"resume boundary"):
                migration.transfer_table(db,table,float("inf"))

    def test_empty_table_is_created_and_verified(self):
        self.ledger()
        table="research__period"
        with patch.object(migration,"fetch_page",return_value=[]):
            self.assertTrue(migration.transfer_table(migration.Target(),table,float("inf")))
        self.assertEqual(migration.table_count(migration.Target(),table),0)

    def test_short_and_extra_pages_fail(self):
        with patch.object(migration,"rpc_page",return_value=[]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                migration.fetch_page("research__observation",None,500)
        with patch.object(migration,"rpc_page",return_value=[{}]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                migration.fetch_page("research__observation",["last"],0)

    def test_self_and_cyclic_references_checked_after_population(self):
        self.db.execute("CREATE TABLE research__a(id TEXT,other_id TEXT,previous_id TEXT)")
        self.db.execute("CREATE TABLE research__b(id TEXT,other_id TEXT)")
        self.db.execute("INSERT INTO research__a VALUES('a','b','a')")
        self.db.execute("INSERT INTO research__b VALUES('b','a')")
        refs=[{"child":"research__a","parent":"research__b","columns":["other_id"],"parent_columns":["id"]},
              {"child":"research__b","parent":"research__a","columns":["other_id"],"parent_columns":["id"]},
              {"child":"research__a","parent":"research__a","columns":["previous_id"],"parent_columns":["id"]}]
        with patch.object(migration,"REFERENCES",refs):
            migration.verify_references(migration.Target())
            self.db.execute("UPDATE research__a SET previous_id='missing'")
            with self.assertRaisesRegex(ValueError,"Missing"):
                migration.verify_references(migration.Target())

    def test_existing_conflict_never_replaces(self):
        table="research__source_type"
        db=migration.Target()
        row=self.row(table)
        db.execute([core.stmt(core.create(table))],close=True)
        migration.copy(db,table,[row])
        text=next(c for c in migration.CONFIG[table]["columns"] if c not in migration.CONFIG[table]["pk"] and c not in migration.CONFIG[table]["json"])
        row[text]="changed"
        with self.assertRaisesRegex(ValueError,"differs"):
            migration.copy(db,table,[row])

if __name__=="__main__":
    unittest.main()
