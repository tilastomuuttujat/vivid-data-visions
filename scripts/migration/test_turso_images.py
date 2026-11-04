import base64
import hashlib
import json
import os
import sqlite3
import unittest
from unittest.mock import patch
import turso_images as migration
import turso_pilot as transport

class ImageTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:",isolation_level=None)
        os.environ["TURSO_AUTH_TOKEN"]="test-only"
        self.mock=patch.object(transport,"request",self.request)
        self.mock.start()
        self.data=b"RIFF"+b"\x10\x00\x00\x00"+b"WEBP"+b"\x00\xffbinary"
        self.file={"name":"kuva ä.webp","object_id":"id","size":len(self.data),"mime_type":"image/webp","updated_at":"2026-11-04","etag":"etag"}
        self.target=transport.Turso()
        migration.create(self.target)

    def tearDown(self):
        self.mock.stop()
        self.db.close()

    def request(self,url,headers,body=None):
        results=[]
        for req in body["requests"]:
            if req["type"]=="close":
                results.append({"type":"ok","response":{"type":"close"}})
                continue
            statement=req["stmt"]
            values=[]
            for a in statement["args"]:
                values.append(None if a["type"]=="null" else int(a["value"]) if a["type"]=="integer" else base64.b64decode(a["base64"]) if a["type"]=="blob" else a["value"])
            cursor=self.db.execute(statement["sql"],values)
            rows=[]
            for row in cursor.fetchall():
                cells=[]
                for v in row:
                    if v is None:cell={"type":"null"}
                    elif isinstance(v,bytes):cell={"type":"blob","base64":base64.b64encode(v).decode().rstrip("=")}
                    else:cell={"type":"integer" if type(v)is int else "text","value":str(v)}
                    cells.append(cell)
                rows.append(cells)
            results.append({"type":"ok","response":{"type":"execute","result":{"rows":rows}}})
        return {"baton":None,"results":results},{}

    def test_blob_exact_roundtrip_restart_and_conflict(self):
        digest=migration.copy_file(self.target,self.file,self.data)
        self.assertEqual(digest,hashlib.sha256(self.data).hexdigest())
        self.assertEqual(migration.copy_file(self.target,self.file,self.data),digest)
        self.assertEqual(self.db.execute("SELECT content FROM "+migration.TABLE).fetchone()[0],self.data)
        with self.assertRaisesRegex(ValueError,"differs"):
            migration.copy_file(self.target,self.file,self.data+b"changed")
        self.assertEqual(self.db.execute("SELECT count(*) FROM "+migration.TABLE).fetchone()[0],1)

    def test_corrupt_stored_blob_is_rejected_without_overwrite(self):
        migration.copy_file(self.target,self.file,self.data)
        corrupt=self.data[:-1]+b"z"
        self.db.execute("UPDATE "+migration.TABLE+" SET content=?",(corrupt,))
        with self.assertRaisesRegex(ValueError,"differs"):
            migration.copy_file(self.target,self.file,self.data)
        self.assertEqual(self.db.execute("SELECT content FROM "+migration.TABLE).fetchone()[0],corrupt)

    def test_download_quotes_path_and_checks_content(self):
        with patch.object(migration,"source_http",return_value=(self.data,"image/webp")) as call:
            self.assertEqual(migration.download(self.file),self.data)
        self.assertTrue(call.call_args.args[0].endswith("kuva%20%C3%A4.webp"))
        for data,mime in [(self.data[:-1],"image/webp"),(self.data,"text/html"),(b"x"*len(self.data),"image/webp")]:
            with patch.object(migration,"source_http",return_value=(data,mime)):
                with self.assertRaises(ValueError):migration.download(self.file)

    def test_listing_size_duplicates_and_folders(self):
        item={"id":"id","name":"a.webp","updated_at":"date","metadata":{"size":12,"mimetype":"image/webp"}}
        with patch.object(migration,"EXPECTED_FILES",1),patch.object(migration,"EXPECTED_BYTES",12),patch.object(migration,"source_http",return_value=(json.dumps([item]).encode(),"application/json")):
            self.assertEqual(len(migration.inventory()),1)
        for items in [[dict(item,id=None)],[item,item]]:
            with patch.object(migration,"source_http",return_value=(json.dumps(items).encode(),"application/json")):
                with self.assertRaises(ValueError):migration.inventory()

    def test_reference_gaps_recorded_without_remapping(self):
        self.db.execute("CREATE TABLE public__infographics(id INTEGER PRIMARY KEY,storage_path TEXT)")
        rows=[{"id":1,"storage_path":self.file["name"]},{"id":2,"storage_path":"missing.webp"}]
        self.db.executemany("INSERT INTO public__infographics VALUES (?,?)",[(r["id"],r["storage_path"]) for r in rows])
        migration.record_references(self.target,[self.file],rows)
        migration.record_references(self.target,[self.file],rows)
        actual=self.db.execute("SELECT source_path,status FROM "+migration.LINKS+" ORDER BY infographic_id").fetchall()
        self.assertEqual(actual,[(self.file["name"],"archived"),("missing.webp","missing_in_source")])
        self.assertEqual(self.db.execute("SELECT storage_path FROM public__infographics WHERE id=2").fetchone()[0],"missing.webp")

    def test_known_reference_set_must_match(self):
        rows=[{"id":i,"storage_path":"a.webp"} for i in range(283)]
        rows += [{"id":283+i,"storage_path":name} for i,name in enumerate(sorted(migration.MISSING))]
        with patch.object(migration,"source_request",return_value=rows):
            self.assertEqual(migration.references([{"name":"a.webp"}]),rows)
        rows[-1]["storage_path"]="new-missing.webp"
        with patch.object(migration,"source_request",return_value=rows):
            with self.assertRaisesRegex(ValueError,"gaps changed"):migration.references([{"name":"a.webp"}])

    def test_redirect_is_never_followed(self):
        with self.assertRaisesRegex(ValueError,"redirect"):
            migration.NoRedirect().redirect_request(None,None,None,None,None,None)

    def test_time_budget_preserves_restartable_archive(self):
        with patch.object(migration,"inventory",return_value=[self.file]),patch.object(migration,"references",return_value=[]),patch.object(migration.time,"monotonic",side_effect=[0,10]):
            self.assertFalse(migration.run(True,max_seconds=5))
        self.assertEqual(self.db.execute("SELECT count(*) FROM "+migration.TABLE).fetchone()[0],0)

if __name__=="__main__":
    unittest.main()
