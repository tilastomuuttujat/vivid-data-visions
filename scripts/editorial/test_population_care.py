import unittest,json
from population_care import analysis
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.a=analysis()
 def test_disjoint_groups_and_nested_counts_all_years(self):
  for p in self.a['age_points']:
   self.assertEqual(p['age65to74']+p['age75to84']+p['age85plus'],p['age65plus']);self.assertEqual(p['age75to84']+p['age85plus'],p['age75plus']);self.assertLessEqual(p['age85plus'],p['age75plus'])
 def test_projection_is_not_observation(self):
  p={x['year']:x for x in self.a['age_points']};self.assertEqual(p[2025]['kind'],'observed');self.assertEqual(p[2026]['kind'],'projection_2024');self.assertEqual(p[2050]['age85plus'],368086);self.assertEqual(p[2025]['age85plus'],170776)
 def test_no_unmeasured_care_inference(self):
  for k in ['care_need_estimated','future_coverage_held_constant','unpaid_care_estimated','causal_effect_identified']:self.assertFalse(self.a['method'][k])
 def test_service_year_and_quality_limits_preserved(self):
  r=self.a['homecare_review'];self.assertEqual(r['year'],2025);self.assertEqual(r['regular_clients'],110479);self.assertEqual(r['all_clients'],163055);self.assertGreaterEqual(len(r['quality_limits']),3);self.assertIn('67%',r['internal_published_share_discrepancy']);self.assertTrue(r['fulltext_checked']);self.assertIn('60',r['definition'])
 def test_json_roundtrip(self):self.assertEqual(json.loads(json.dumps(self.a)),self.a)
if __name__=='__main__':unittest.main()
