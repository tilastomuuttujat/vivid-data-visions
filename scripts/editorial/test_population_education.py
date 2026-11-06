import unittest,copy,json
from population_education import sources,analysis,cohorts,pupil_totals
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.s=sources();cls.a=analysis()
 def test_all_nine_school_ages_present(self):
  self.assertEqual(len(self.a['national_age7to15']),54);self.assertEqual(self.a['national_age7to15'][0],{'year':1972,'population':695821})
  bad=copy.deepcopy(self.s['age-national']['cells']);bad.pop()
  with self.assertRaises(ValueError):cohorts(bad)
 def test_municipalities_reconcile_to_whole_country(self):
  r=self.a['municipal_age7to15'];self.assertEqual(len(r),308)
  for y in [1990,2025]:self.assertEqual(sum(x['age7to15_'+str(y)] for x in r),next(x['population'] for x in self.a['national_age7to15'] if x['year']==y))
  self.assertEqual(sum(x['change']<0 for x in r),250);self.assertEqual(sum(x['change']>0 for x in r),57);self.assertEqual(sum(x['change']==0 for x in r),1)
 def test_actual_grades_and_sums(self):
  for p in self.a['pupil_grade_counts'].values():self.assertEqual(set(p['grades']),{str(x) for x in range(1,10)});self.assertEqual(sum(p['grades'].values()),p['total'])
  self.assertEqual(self.a['pupil_grade_counts']['2025']['total'],536104)
  bad=copy.deepcopy(self.s['pupils']['cells']);bad.pop()
  with self.assertRaises(ValueError):pupil_totals(bad)
 def test_resident_population_is_not_pupils(self):
  n=next(x['population'] for x in self.a['national_age7to15'] if x['year']==2025);self.assertNotEqual(n,self.a['pupil_grade_counts']['2025']['total'])
  m=self.a['method'];self.assertFalse(m['participation_rate_computed']);self.assertFalse(m['school_capacity_measured']);self.assertFalse(m['same_cohort_followed']);self.assertFalse(m['causal_effect_identified']);self.assertFalse(m['forecast'])
 def test_no_assumption_of_monotonic_decline(self):
  d={x['year']:x['population'] for x in self.a['national_age7to15']};self.assertGreater(d[2025],d[2010]);self.assertLess(d[2025],d[1990])
 def test_json_roundtrip_keeps_reference(self):self.assertEqual(json.loads(json.dumps(self.a)),self.a)
if __name__=='__main__':unittest.main()
