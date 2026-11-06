import json,sqlite3,unittest
from article_data_discovery import collect,store,SCOPES
class DB:
 def __init__(self):
  self.db=sqlite3.connect(':memory:',isolation_level=None);self.db.row_factory=sqlite3.Row
 def execute(self,s,args=()):return [dict(r) for r in self.db.execute(s,args)]
class Tests(unittest.TestCase):
 def fixture(self):
  d=DB();d.execute('CREATE TABLE editorial__articles(id TEXT,title TEXT,body_text TEXT)');d.execute('CREATE TABLE editorial__article_revisions(article_id TEXT,revision_no INTEGER)')
  for a in SCOPES:d.execute('INSERT INTO editorial__articles VALUES(?,?,?)',[a,'Työ ja valtio','Alkuperäinen teksti']);d.execute('INSERT INTO editorial__article_revisions VALUES(?,1)',[a])
  d.execute('CREATE TABLE public__indicator_series(series_key TEXT,title TEXT,description TEXT,unit TEXT,geography TEXT,frequency TEXT,start_year INTEGER,end_year INTEGER,source TEXT,source_url TEXT,published INTEGER,status TEXT,data_class TEXT)')
  for key,pub in [('work',1),('hidden',0)]:d.execute('INSERT INTO public__indicator_series VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[key,'Työ teollisuudessa','Työlliset','henkilöä','Suomi','annual',1850,2050,'Lähde','https://example.org',pub,'draft','historical'])
  d.execute('CREATE TABLE public__indicator_values(series_key TEXT,group_key TEXT,group_label TEXT,year INTEGER,value TEXT,is_published INTEGER,value_kind TEXT,validation_status TEXT,source_url TEXT,source_version TEXT)')
  for y,v,pub in [(1900,'10',1),(1910,None,1),(1976,'99',1),(1901,'11',0)]:d.execute('INSERT INTO public__indicator_values VALUES(?,?,?,?,?,?,?,?,?,?)',['work','all','Kaikki',y,v,pub,'observed','unverified',None,'v'])
  d.execute('CREATE TABLE public__items(id TEXT,title TEXT,year_start INTEGER,year_end INTEGER,type TEXT,subtype TEXT,sources TEXT,unpublished INTEGER)')
  d.execute('INSERT INTO public__items VALUES(?,?,?,?,?,?,?,?)',['e','Valtion rautatie',1860,1870,'event','history','[]',0]);return d
 def test_actual_years_and_unverified_candidates(self):
  d=self.fixture();r=collect(d);self.assertEqual(r['historical_candidate_series'],1)
  s=next(x['series'][0] for x in r['reports'] if x['series']);g=s['groups'][0]
  self.assertEqual(g['stored_years'],[1900,1910]);self.assertEqual(g['rows'],2);self.assertEqual(g['non_null_values'],1)
  self.assertEqual(s['status'],'candidate_not_source_verified');self.assertEqual(r['reports'][0]['claim_support'],'not_assessed')
 def test_store_idempotent_and_does_not_modify_sources(self):
  d=self.fixture();before=d.execute('SELECT * FROM public__indicator_values');r=collect(d);store(d,r);store(d,r)
  self.assertEqual(before,d.execute('SELECT * FROM public__indicator_values'));self.assertEqual(len(d.execute('SELECT * FROM editorial__article_data_discoveries')),2)
  r['reports'][0]['period']=[1900,1975]
  with self.assertRaises(ValueError):store(d,r)
