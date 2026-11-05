import copy,unittest
from articles import digest,canonical
from evidence_review import apply,validate,META,FIELDS
from test_evidence_quality import QualityIntegrationTests
from evidence_quality import run
class ReviewTests(unittest.TestCase):
 def data(self):
  db=QualityIntegrationTests().fixture();summary,profiles,_=run(db);p=profiles[0]
  r=dict(series_key=p['series_key'],expected_metadata_sha256=p['metadata_sha256'],expected_rows_sha256=p['rows_sha256'],reviewed_on='2026-11-05',evidence_role='historical_context_needs_page_check',decision='Scoped review',limits='Not source verification')
  return db,dict(version='test-review',base_quality_version=summary['version'],reviews=[r])
 def test_idempotence_and_source_preservation(self):
  db,b=self.data();before=db.execute('SELECT * FROM public__indicator_values')
  apply(db,b);apply(db,b)
  self.assertEqual(db.execute('SELECT * FROM public__indicator_values'),before)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__education_evidence_review')[0]['n'],1)
 def test_changed_source_rejected(self):
  db,b=self.data();db.execute("UPDATE public__indicator_values SET value='99' WHERE year=1972")
  with self.assertRaises(ValueError):apply(db,b)
 def test_unofficial_source_and_promotion_rejected(self):
  db,b=self.data();r=b['reviews'][0];r.update(source_resolution_status='fully_verified')
  with self.assertRaises(ValueError):validate(b)
  r.update(source_resolution_status='source_located_partial_value_check',source_url='https://example.org')
  with self.assertRaises(ValueError):validate(b)
