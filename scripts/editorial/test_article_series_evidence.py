import unittest
from decimal import Decimal
from test_period_analysis import Local
from article_series_evidence import reference,analysis,reconcile
class Tests(unittest.TestCase):
 def fixture(self,name):
  db=Local();db.execute('CREATE TABLE public__indicator_series(series_key TEXT,unit TEXT,geography TEXT,published INTEGER)');db.execute('CREATE TABLE public__indicator_values(series_key TEXT,year INTEGER,group_key TEXT,value TEXT,value_kind TEXT,validation_status TEXT,source_url TEXT,source_version TEXT,is_published INTEGER)')
  rows,_=reference(name)
  for k in sorted({k for k,y in rows}):db.execute('INSERT INTO public__indicator_series VALUES(?,?,?,1)',[k,'Tuhatta henkilöä' if name=='work-1960-1974' else 'Volyymi-indeksi (1926=100)','Finland'])
  for (k,y),v in rows.items():db.execute('INSERT INTO public__indicator_values VALUES(?,?,?,?,?,?,?,?,1)',[k,y,'FI',v,'estimate' if y<=1960 else 'observed','source_verified','https://pxdata.stat.fi','15ai'])
  return db
 def test_pinned_official_cells_match_and_source_tables_remain_unchanged(self):
  for name,n in [('work-1960-1974',75),('public-consumption-1946-1959',14)]:
   db=self.fixture(name);before=db.execute('SELECT * FROM public__indicator_values');self.assertEqual(reconcile(db,name),n);self.assertEqual(before,db.execute('SELECT * FROM public__indicator_values'))
 def test_null_altered_values_and_wrong_unit_are_rejected(self):
  for sql in ["UPDATE public__indicator_values SET value=NULL WHERE year=1960","UPDATE public__indicator_values SET value='-999' WHERE year=1960","UPDATE public__indicator_series SET unit='miljoonaa tuntia'","DELETE FROM public__indicator_values WHERE year=1960"]:
   db=self.fixture('work-1960-1974');db.execute(sql)
   with self.assertRaises(ValueError):reconcile(db,'work-1960-1974')
 def test_calculated_endpoints_and_historical_boundaries(self):
  a=analysis('work-1960-1974');agri=next(c for c in a['computed']['sectors'] if c['sector']=='a');self.assertGreater(Decimal(agri['start_share_pct']),Decimal(agri['end_share_pct']));self.assertEqual(a['computed']['period'],[1960,1974]);self.assertEqual(sum(c['observations'] for c in a['data_links']),75)
  b=analysis('public-consumption-1946-1959');self.assertEqual(b['computed']['start_index'],'219.59');self.assertAlmostEqual(float(b['computed']['change_percent']),62.967348,places=5);self.assertEqual(len(b['computed']['annual_values']),14)
