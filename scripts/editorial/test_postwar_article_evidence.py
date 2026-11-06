import unittest
from decimal import Decimal as D
from test_period_analysis import Local
from postwar_article_evidence import reference,analysis,reconcile
class Tests(unittest.TestCase):
 def fixture(self,name):
  db=Local();db.execute('CREATE TABLE public__indicator_series(series_key TEXT,unit TEXT,geography TEXT,published INTEGER)');db.execute('CREATE TABLE public__indicator_values(series_key TEXT,year INTEGER,group_key TEXT,value TEXT,is_published INTEGER)')
  cells,_=reference(name);keys={r['series_key'] for r in cells if r['raw_series']}
  unit,geo=('asuntoa','Finland') if name.startswith('housing') else ('oppilasta','Suomi, lähteen historiallinen oppilaitosrajaus') if name.startswith('vocational') else ('Käyvin hinnoin, 1960-1975, milj. mk (SNA68)','Finland')
  for k in keys:db.execute('INSERT INTO public__indicator_series VALUES(?,?,?,1)',[k,unit,geo])
  for r in cells:
   if r['raw_series']:db.execute('INSERT INTO public__indicator_values VALUES(?,?,?,?,1)',[r['series_key'],r['year'],r['group_key'],r['raw_expected']])
  return db
 def test_six_discrepancies_are_preserved_and_isolated(self):
  db=self.fixture('vocational-1950-1956');before=db.execute('SELECT * FROM public__indicator_values');self.assertEqual(reconcile(db,'vocational-1950-1956'),(48,6));self.assertEqual(before,db.execute('SELECT * FROM public__indicator_values'))
  a=analysis('vocational-1950-1956');self.assertEqual(a['computed']['preparatory_technical_end'],'6638');self.assertEqual(len(a['source_discrepancies']),6);self.assertTrue(all(r['source_period'] for r in a['source_discrepancies']))
 def test_changed_raw_snapshot_stops_review(self):
  db=self.fixture('vocational-1950-1956');db.execute("UPDATE public__indicator_values SET value='0' WHERE year=1956")
  with self.assertRaises(ValueError):reconcile(db,'vocational-1950-1956')
 def test_nonadditive_housing_shares_and_investment_ratio(self):
  h=analysis('housing-1950-1970');self.assertAlmostEqual(float(h['computed']['water_share_start']),25.1755288,places=6);self.assertEqual(reconcile(self.fixture('housing-1950-1970'),'housing-1950-1970'),(3,0));self.assertEqual(sum(x['observations'] for x in h['data_links']),9)
  i=analysis('investment-share-1960-1974');self.assertGreater(D(i['computed']['share_start']),D(i['computed']['share_end']));self.assertEqual(reconcile(self.fixture('investment-share-1960-1974'),'investment-share-1960-1974'),(30,0))
