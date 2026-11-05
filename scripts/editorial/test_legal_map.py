import json,unittest
from legal_map import resolve,sync,verify,catalog_key
from legal_links import import_links,load_catalog
from test_period_analysis import Local
from test_legal_links import Tests
class MappingTests(unittest.TestCase):
 def test_exact_numbers_and_no_title_matching(self):
  anchors=[{'anchor_set':'v','id':'a','payload_json':json.dumps({'act_id':'731/1999'})}]
  rows=[{'id':'different-id','number':'00731','year':'1999','title':'ignored'}]
  self.assertEqual(resolve(anchors,rows)[0]['statute_id'],'different-id')
  rows[0]['year']=2000
  self.assertEqual(resolve(anchors,rows)[0]['status'],'unmatched')
 def test_ambiguous_catalog_rejected(self):
  a=[{'anchor_set':'v','id':'a','payload_json':json.dumps({'act_id':'1/2000'})}]
  with self.assertRaises(ValueError):resolve(a,[{'id':x,'number':1,'year':2000} for x in ['a','b']])
 def setup_db(self):
  db=Local();a,b=Tests().data();import_links(db,b,a)
  db.execute('CREATE TABLE lakikartta__statute_catalog(id TEXT PRIMARY KEY,number TEXT,year INTEGER,title TEXT,source_version TEXT)')
  db.execute('CREATE TABLE lakikartta__assessment_cases(case_id TEXT,statute_id TEXT)')
  db.execute('CREATE TABLE lakikartta__historical_legal_events(event_key TEXT,statute_id TEXT)')
  return db,a
 def test_bidirectional_join_idempotence_and_stale_article(self):
  db,a=self.setup_db();num,year=a['anchors'][0]['act_id'].split('/')
  db.execute('INSERT INTO lakikartta__statute_catalog VALUES(?,?,?,?,?)',['native-key',num,int(year),'Catalog statute','v'])
  e=sync(db);sync(db);verify(db,e)
  self.assertEqual(db.execute('SELECT lakikartta_statute_id FROM lakikartta__article_connections'),[{'lakikartta_statute_id':'native-key'}])
  db.execute('INSERT INTO editorial__article_revisions VALUES(?,?)',['a',2])
  self.assertEqual(db.execute('SELECT * FROM lakikartta__article_connections'),[])
  self.assertEqual(db.execute('SELECT is_current FROM editorial__article_lakikartta'),[{'is_current':0}])
 def test_unmatched_retained_no_false_connection(self):
  db,a=self.setup_db();sync(db)
  self.assertEqual(len(db.execute('SELECT * FROM editorial__lakikartta_unmatched')),1)
  self.assertEqual(db.execute('SELECT * FROM lakikartta__article_connections'),[])
 def test_ambiguous_sync_rolls_back(self):
  db,a=self.setup_db();num,year=a['anchors'][0]['act_id'].split('/')
  for k in ['a','b']:db.execute('INSERT INTO lakikartta__statute_catalog VALUES(?,?,?,?,?)',[k,num,int(year),'x','v'])
  with self.assertRaises(ValueError):sync(db)
  self.assertEqual(db.execute("SELECT name FROM sqlite_master WHERE name='editorial__lakikartta_links'"),[])

class NativeIdentifiers(unittest.TestCase):
 def test_missing_number_uses_exact_native_id(self):
  a=[{'anchor_set':'v','id':'a','payload_json':json.dumps({'act_id':'609/1986'})}]
  r=resolve(a,[{'id':'1986/609','number':None,'year':1986}])
  self.assertEqual(r[0]['statute_id'],'1986/609')
  self.assertEqual(r[0]['status'],'exact')
 def test_conflicting_fields_fail_closed(self):
  for row in [{'id':'1986/609','number':610,'year':1986},{'id':'1986/609','number':None,'year':1987}]:
   with self.assertRaises(ValueError):catalog_key(row)
 def test_nonstatutory_id_does_not_invent_a_number(self):
  self.assertIsNone(catalog_key({'id':'1850/historical-event','number':None,'year':1850}))
 def test_duplicate_native_id_and_number_match_rejected(self):
  a=[{'anchor_set':'v','id':'a','payload_json':json.dumps({'act_id':'609/1986'})}]
  with self.assertRaises(ValueError):resolve(a,[{'id':'1986/609','number':None,'year':1986},{'id':'legacy','number':609,'year':1986}])
