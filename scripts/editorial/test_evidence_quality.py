import copy,unittest
from evidence_quality import profile,safe_url,number
class QualityTests(unittest.TestCase):
 def data(self):
  s=dict(series_key='x',title='School',description='Students',unit='persons',geography='Finland',frequency='annual',source_url=None)
  r=dict(series_key='x',year=1972,group_key='all',group_label='All',period=None,value='12',value_kind='observed',validation_status='validated',source_url='https://stat.fi/table',source_version='v1',is_published=1)
  return s,r
 def test_unanimous_source_is_candidate_not_verified(self):
  s,r=self.data();p=profile(s,[r])
  self.assertEqual(p['source_resolution']['status'],'unanimous_row_url_candidate')
  self.assertEqual(p['status'],'needs_semantic_review')
 def test_missing_or_conflicting_rows_do_not_repair_source(self):
  for url in [None,'https://stat.fi/other']:
   s,r=self.data();rr=dict(r,year=1973,source_url=url)
   self.assertEqual(profile(s,[r,rr])['source_resolution']['status'],'requires_source_retrieval')
 def test_secrets_and_nonfinite_numbers_rejected(self):
  self.assertIsNone(safe_url('https://x.test?aPI_key=secret'))
  self.assertIsNone(safe_url('https://user:password@x.test'))
  self.assertFalse(number('NaN'));self.assertFalse(number('inf'));self.assertFalse(number(None))
 def test_group_specific_gaps_and_labels(self):
  s,r=self.data();rr=dict(r,year=1974,group_label='Changed')
  p=profile(s,[r,rr]);self.assertIn('group_label_changes',p['flags'])
  self.assertEqual(p['groups'][0]['interior_missing_years'],1)
 def test_estimates_and_future_are_not_promoted(self):
  s,r=self.data();r.update(value_kind='estimated',year=2030)
  p=profile(s,[r]);self.assertIn('outside_historical_year_scope',p['flags'])
  self.assertIn('value_kind_requires_review',p['flags'])

class QualityIntegrationTests(unittest.TestCase):
 def fixture(self):
  import test_evidence_reuse
  from evidence_reuse import run
  db=test_evidence_reuse.EvidenceTests().fixture()
  for field,typ in [('group_key','TEXT'),('group_label','TEXT'),('period','TEXT'),('value_kind','TEXT'),('validation_status','TEXT'),('is_published','INTEGER'),('source_version','TEXT')]:
   db.execute('ALTER TABLE public__indicator_values ADD COLUMN '+field+' '+typ)
  db.execute("UPDATE public__indicator_values SET group_key='all',group_label='All',value_kind='observed',validation_status='validated',is_published=1")
  run(db)
  return db
 def test_versioned_readback_preserves_sources(self):
  from evidence_quality import run
  db=self.fixture();before=db.execute('SELECT * FROM public__indicator_values')
  first=run(db);second=run(db)
  self.assertEqual(first,second)
  self.assertEqual(db.execute('SELECT * FROM public__indicator_values'),before)
 def test_changed_inputs_require_new_quality_version(self):
  from evidence_quality import run
  db=self.fixture();run(db)
  before=db.execute('SELECT * FROM editorial__evidence_series_profiles')
  db.execute("UPDATE public__indicator_values SET value='55' WHERE year=1972")
  with self.assertRaises(ValueError):run(db)
  self.assertEqual(db.execute('SELECT * FROM editorial__evidence_series_profiles'),before)
