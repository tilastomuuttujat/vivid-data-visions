import unittest
from test_period_analysis import Local
from historical_matrix_evidence import reference,analysis,reconcile
class Tests(unittest.TestCase):
 def fixture(self,name):
  db=Local();db.execute('CREATE TABLE public__indicator_series(series_key TEXT,unit TEXT,geography TEXT,published INTEGER)');db.execute('CREATE TABLE public__indicator_values(series_key TEXT,year INTEGER,group_key TEXT,value TEXT,period TEXT,is_published INTEGER)');db.execute('CREATE TABLE editorial__historical_school_verified(version TEXT,series_key TEXT,year INTEGER,group_key TEXT,source_value TEXT,source_unit TEXT,source_sha256 TEXT,original_title_rejected INTEGER)')
  cells,src=reference(name)
  for k in {r['series_key'] for r in cells}:db.execute('INSERT INTO public__indicator_series VALUES(?,?,?,1)',[k,'Tuhatta työvuotta' if name.startswith('labour') else 'Volyymi-indeksi (1926=100)','Finland'])
  for r in cells:
   db.execute('INSERT INTO public__indicator_values VALUES(?,?,?,?,?,1)',[r['series_key'],r['year'],r['group_key'],r['value'],r['period']])
   if name.startswith('school'):db.execute('INSERT INTO editorial__historical_school_verified VALUES(?,?,?,?,?,?,?,1)',[src['reference_version'],r['series_key'],r['year'],r['group_key'],r['value'],'permille',src['sha256']])
  return db
 def test_full_original_scopes_reconcile_without_mutation(self):
  for name,n in [('labour-years-1860-1959',500),('public-volume-1860-1945',86),('school-region-sex-1920-1930',10)]:
   db=self.fixture(name);before=db.execute('SELECT * FROM public__indicator_values');self.assertEqual(reconcile(db,name),n);self.assertEqual(before,db.execute('SELECT * FROM public__indicator_values'))
 def test_altered_value_or_definition_rejected(self):
  db=self.fixture('labour-years-1860-1959');db.execute("UPDATE public__indicator_values SET value='999' WHERE year=1860")
  with self.assertRaises(ValueError):reconcile(db,'labour-years-1860-1959')
  db=self.fixture('school-region-sex-1920-1930');db.execute('UPDATE editorial__historical_school_verified SET original_title_rejected=0')
  with self.assertRaises(ValueError):reconcile(db,'school-region-sex-1920-1930')
 def test_school_permille_conversion_and_group_scope(self):
  a=analysis('school-region-sex-1920-1930');rr={(r['year'],r['group_key']):r for r in a['computed']['values']};self.assertEqual(rr[1920,'FI_URBAN']['percent'],'16.4');self.assertEqual(rr[1930,'FI_F']['percent'],'6.8');self.assertEqual(len(a['data_links']),5)
