import unittest,copy
from decimal import Decimal as D
from population_work import sources,analysis,employment_points,production_points,check_bundle,VERSION
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.s=sources();cls.a=analysis()
 def test_official_recheck_matches_existing_atlas(self):
  self.assertEqual(len(self.s['115w']['data']['rows']),38);self.assertEqual(len(self.s['15ai']['data']['points']),51)
 def test_standardization_identity_all_years(self):
  rows=self.a['registered_employment'];base=next(r for r in rows if r['year']==1990)
  for r in rows:
   actual=D(r['employed_population_pct']);fixed=D(r['fixed_1990_age_weights_pct']);gap=D(r['composition_gap_pp'])
   self.assertLess(abs(actual-fixed-gap),D('1e-24'));self.assertLess(abs(actual-D(base['employed_population_pct'])-((fixed-D(base['employed_population_pct']))+gap)),D('1e-24'))
  self.assertEqual(D(base['composition_gap_pp']),0)
 def test_invalid_age_totals_rejected(self):
  p=copy.deepcopy(self.s['115w']['data']);p['rows'][0]['employed'][0]+=1
  with self.assertRaises(ValueError):employment_points(p)
 def test_population_composition_is_not_causal(self):
  self.assertFalse(self.a['method']['causal_effect_identified']);self.assertFalse(self.a['method']['forecast']);self.assertFalse(self.a['method']['historical_extrapolation'])
 def test_distinct_employment_concepts_not_equated(self):
  reg=next(x for x in self.a['registered_employment'] if x['year']==2024);annual=next(x for x in self.a['annual_work_volume'] if x['year']==2024)
  self.assertNotEqual(D(reg['employed']),D(annual['annual_domestic_employed_thousands'])*1000)
  self.assertLess(abs(D(annual['hours_per_employed'])*D(annual['annual_domestic_employed_thousands'])/1000-D(annual['hours_millions'])),D('1e-23'))
 def test_equal_age_structure_has_zero_composition_gap(self):
  p=copy.deepcopy(self.s['115w']['data']);p['rows']=[copy.deepcopy(next(r for r in p['rows'] if r['year']==1990))];r=copy.deepcopy(p['rows'][0]);r['year']=2024;r['employed']=[n//2 for n in r['employed']];r['totalEmployed']=sum(r['employed']);p['rows'].append(r)
  self.assertLess(abs(D(employment_points(p)[-1]['composition_gap_pp'])),D('1e-24'))
if __name__=='__main__':unittest.main()
