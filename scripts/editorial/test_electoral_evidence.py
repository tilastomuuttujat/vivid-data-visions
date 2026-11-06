import unittest,json
from pathlib import Path
from test_period_analysis import Local
from electoral_evidence import reference,store,check
class Tests(unittest.TestCase):
 def fixture(self):
  db=Local();m,_=reference();db.execute('CREATE TABLE public__indicator_values(series_key TEXT,year INTEGER,group_key TEXT,value REAL,is_published INTEGER)');db.execute('CREATE TABLE public__indicator_series(series_key TEXT,unit TEXT,title TEXT)');db.execute('INSERT INTO public__indicator_series VALUES(?,?,?)',[m['migrated_series_key'],'%','Eduskuntavaalien äänestysaktiivisuus, vuosikirjan nimittäjä'])
  for y,v in m['migrated_rates'].items():db.execute('INSERT INTO public__indicator_values VALUES(?,?,?,?,1)',[m['migrated_series_key'],int(y),'total',v])
  return db
 def test_snapshot_idempotent_raw_unchanged(self):
  db=self.fixture();before=db.execute('SELECT * FROM public__indicator_values');store(db);store(db);check(db);self.assertEqual(before,db.execute('SELECT * FROM public__indicator_values'));self.assertEqual(len(db.execute('SELECT * FROM editorial__electoral_source_snapshots')),1)
 def test_changed_raw_rejected(self):
  db=self.fixture();db.execute('UPDATE public__indicator_values SET value=81 WHERE year=1983')
  with self.assertRaises(ValueError):store(db)
 def test_resident_denominator_not_substituted(self):
  db=self.fixture();db.execute("UPDATE public__indicator_series SET title='Suomessa asuvat'")
  with self.assertRaises(ValueError):store(db)
 def test_no_interpolation(self):
  m,p=reference();self.assertFalse(m['annual_series']);self.assertNotIn(1907,m['years']);self.assertNotIn(1984,m['years']);self.assertEqual(len(json.loads(p)['data']),114)
 def test_immutable_snapshot(self):
  db=self.fixture();store(db);db.execute("UPDATE editorial__electoral_source_snapshots SET payload_json='{}'")
  with self.assertRaises(ValueError):store(db)
