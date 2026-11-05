import sqlite3,unittest
from evidence_reuse import run,VERSION
class Local:
 def __init__(self):
  self.db=sqlite3.connect(':memory:',isolation_level=None);self.db.row_factory=sqlite3.Row
 def execute(self,sql,args=()):return [dict(r) for r in self.db.execute(sql,args).fetchall()]
class EvidenceTests(unittest.TestCase):
 def fixture(self):
  db=Local()
  db.execute('CREATE TABLE editorial__articles(id TEXT,title TEXT,body_text TEXT)')
  db.execute('CREATE TABLE editorial__article_revisions(article_id TEXT,revision_no INTEGER)')
  db.execute('CREATE TABLE editorial__narrative_decisions(article_id TEXT,act_id TEXT,is_current INTEGER)')
  db.execute("INSERT INTO editorial__articles VALUES('a','Private article','Unchanged body')")
  db.execute("INSERT INTO editorial__article_revisions VALUES('a',1)")
  db.execute("INSERT INTO editorial__narrative_decisions VALUES('a','467/1968',1)")
  db.execute('CREATE TABLE public__indicator_series(series_key TEXT,title TEXT,description TEXT,unit TEXT,geography TEXT,frequency TEXT,start_year INTEGER,end_year INTEGER,source TEXT,source_url TEXT,published INTEGER,status TEXT,data_class TEXT)')
  db.execute("INSERT INTO public__indicator_series VALUES('school','Peruskoulu','', 'persons','Finland','annual',1900,2025,'Source','https://example.org',1,'draft','observed')")
  db.execute("INSERT INTO public__indicator_series VALUES('hidden','Koulutus','','persons','Finland','annual',1900,2025,'Source',NULL,0,'draft','observed')")
  db.execute('CREATE TABLE public__indicator_values(series_key TEXT,year INTEGER,value TEXT,source_url TEXT)')
  db.execute("INSERT INTO public__indicator_values VALUES('school',1972,'1',NULL)")
  db.execute("INSERT INTO public__indicator_values VALUES('school',1973,NULL,NULL)")
  db.execute('CREATE TABLE public__items(id TEXT,title TEXT,year_start INTEGER,year_end INTEGER,type TEXT,subtype TEXT,sources TEXT,unpublished INTEGER)')
  db.execute("INSERT INTO public__items VALUES('event','Peruskoulu-uudistus',1972,1977,'decision',NULL,'[]',0)")
  db.execute("INSERT INTO public__items VALUES('private','Peruskoulu draft',1972,1977,'decision',NULL,'[]',1)")
  return db
 def test_candidates_are_scoped_idempotent_and_preserve_inputs(self):
  db=self.fixture();before=db.execute('SELECT * FROM editorial__articles')
  report,n=run(db);again,m=run(db)
  self.assertEqual((n,m),(2,2));self.assertEqual(report,again)
  self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before)
  self.assertEqual(report['matched_published_series'],1);self.assertEqual(len(report['events']),1)
  self.assertEqual(report['series'][0]['actual_coverage']['rows'],2)
  self.assertEqual(report['series'][0]['actual_coverage']['non_null_values'],1)
  self.assertTrue(all(r['review_status']=='candidate' and r['evidence_role']=='context_only' for r in db.execute('SELECT * FROM editorial__evidence_candidates')))
 def test_changed_source_requires_new_version(self):
  db=self.fixture();run(db);db.execute("UPDATE public__indicator_values SET value='2' WHERE year=1973")
  with self.assertRaises(ValueError):run(db)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__evidence_candidates')[0]['n'],2)
 def test_missing_migrated_table_fails_closed(self):
  db=self.fixture();db.execute('DROP TABLE public__items')
  with self.assertRaises(ValueError):run(db)
