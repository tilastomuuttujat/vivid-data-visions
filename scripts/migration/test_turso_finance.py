import sqlite3
import unittest
from decimal import Decimal
from unittest.mock import patch
import test_turso_indicators as existing
import turso_finance as finance
import turso_indicators as core

class FinanceTests(unittest.TestCase):
    setUp = existing.TransferTests.setUp
    tearDown = existing.TransferTests.tearDown
    request = existing.TransferTests.request

    def ledger(self):
        self.db.execute("CREATE TABLE " + finance.LEDGER + " (table_name TEXT,page_offset INTEGER,row_count INTEGER,page_size INTEGER,expected_rows INTEGER,start_cursor TEXT,end_cursor TEXT,sha256 TEXT,PRIMARY KEY(table_name,page_offset))")

    def row(self, table, **values):
        row = dict.fromkeys(finance.CONFIG[table]["columns"])
        row.update(values)
        return row

    def test_composite_keyset_filters_are_raw_and_disjoint(self):
        calls = []
        table = "public_finance_observations"
        a = 'a,"b'
        responses = [[self.row(table, series_key=a, year=1900, value_kind="z")],
                     [self.row(table, series_key=a, year=1901, value_kind="observed")],
                     [self.row(table, series_key="c", year=1800, value_kind="observed")]]
        def request(t, parameters):
            calls.append(parameters)
            return responses[len(calls)-1]
        with patch.object(core, "source_request", side_effect=request), patch.object(finance, "PAGE_SIZE", 3):
            result = finance.fetch_page(table, [a,1900,"estimate"], 3)
        self.assertEqual(len(result), 3)
        self.assertEqual(calls[0]["series_key"], "eq."+a)
        self.assertEqual(calls[0]["value_kind"], "gt.estimate")
        self.assertEqual(calls[1]["year"], "gt.1900")
        self.assertEqual(calls[2]["series_key"], "gt."+a)
        self.assertNotIn("offset", calls[2])
        self.assertEqual([c["limit"] for c in calls], [3,2,1])

    def test_resume_exact_numeric_and_conflict(self):
        self.ledger()
        table = "public_finance_observations"
        rows = [self.row(table,series_key="a",year=y,value_kind="observed",
                         value=Decimal("123456789012345.123456789")) for y in (1900,1901,1902)]
        def page(t, after, count):
            offset = 0 if after is None else next(i+1 for i,r in enumerate(rows) if finance.cursor(t,[r]) == after)
            return rows[offset:offset+count]
        with patch.dict(finance.CONFIG[table], {"expected":3}), patch.object(finance,"PAGE_SIZE",2), patch.object(finance,"fetch_page",side_effect=page):
            db = core.Turso()
            with patch.object(finance.time,"monotonic",side_effect=[0,10]):
                self.assertFalse(finance.transfer_table(db,table,5))
            self.assertEqual(finance.table_count(db,table),2)
            self.assertTrue(finance.transfer_table(db,table,float("inf")))
            self.assertTrue(finance.transfer_table(db,table,float("inf")))
            self.assertEqual(self.db.execute("SELECT value FROM public__"+table+" LIMIT 1").fetchone()[0],str(rows[0]["value"]))
            rows[-1]["notes"]="source changed"
            with self.assertRaisesRegex(ValueError,"resume boundary"):
                finance.transfer_table(db,table,float("inf"))

    def test_short_source_and_extra_rows_fail(self):
        with patch.object(core,"source_request",return_value=[]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                finance.fetch_page("public_finance_sources",None,139)
        with patch.object(core,"source_request",return_value=[{}]):
            with self.assertRaisesRegex(ValueError,"count differs"):
                finance.fetch_page("public_finance_sources",["last"],0)

    def test_all_schemas_and_exact_numeric_multiplier(self):
        db = core.Turso()
        for table,cfg in finance.CONFIG.items():
            row = self.row(table)
            for key in cfg["pk"]:
                row[key] = 1900 if key in cfg["integers"] else "a"
            for key in cfg["json"]:
                row[key] = {"precision":Decimal("0.1234567890123456789")}
            for key in cfg["numeric"]:
                row[key] = Decimal("123456789012345.123456789")
            db.execute([core.stmt(core.create(table))],close=True)
            self.assertEqual(finance.copy(db,table,[row]),1)
            self.assertEqual(finance.copy(db,table,[row]),0)

    def test_repeated_page_never_checkpoints(self):
        self.ledger()
        table = "public_finance_sources"
        rows = [self.row(table,source_key="a"),self.row(table,source_key="b")]
        with patch.dict(finance.CONFIG[table],{"expected":4}), patch.object(finance,"PAGE_SIZE",2), patch.object(finance,"fetch_page",return_value=rows):
            with self.assertRaisesRegex(ValueError,"Repeated"):
                finance.transfer_table(core.Turso(),table,float("inf"))
        self.assertEqual(self.db.execute("SELECT count(*) FROM "+finance.LEDGER).fetchone()[0],1)
        self.assertEqual(finance.table_count(core.Turso(),table),2)

    def test_missing_parent_fails(self):
        self.db.execute("CREATE TABLE public__public_finance_series(source_key TEXT)")
        self.db.execute("CREATE TABLE public__public_finance_sources(source_key TEXT)")
        self.db.execute("INSERT INTO public__public_finance_series VALUES('missing')")
        with patch.object(finance,"REFERENCES",[finance.REFERENCES[0]]):
            with self.assertRaisesRegex(ValueError,"Missing finance reference"):
                finance.verify_references(core.Turso())

if __name__ == "__main__":
    unittest.main()
