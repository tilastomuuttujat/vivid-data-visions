import unittest,copy,json
from population_fiscal import source,lookup,validate_totals,analysis
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.s=source();cls.a=analysis()
 def test_subtasks_and_main_tasks_reconcile_with_rounding(self):self.assertTrue(validate_totals(self.s))
 def test_detailed_1990_values_not_imputed(self):
  with self.assertRaises(ValueError):lookup(self.s,1990,'G1002')
  self.assertEqual(str(lookup(self.s,2001,'G1002')),'11001')
 def test_bad_component_rejected(self):
  s=copy.deepcopy(self.s);r=next(x for x in s['points'] if x['year']==2024 and x['task']=='G1002' and x['metric']=='jmete-cp');r['value']=str(int(r['value'])+100)
  with self.assertRaises(ValueError):validate_totals(s)
 def test_money_and_population_not_treated_as_causal_or_real(self):
  m=self.a['method'];self.assertTrue(m['nominal_money']);self.assertTrue(m['gdp_ratio_is_not_price_adjustment'])
  for k in ['deflation_performed','age_specific_recipient_cost_estimated','demographic_cost_effect_identified','causal_effect_identified','fiscal_sustainability_estimated','forecast']:self.assertFalse(m[k])
 def test_2024_provisional_and_source_vintage_preserved(self):
  self.assertTrue(self.a['endpoints']['2024']['provisional']);self.assertEqual(self.s['receipt']['provisional_years'],[2024]);self.assertEqual(self.s['response']['metadata'][0]['updated'],'2025-12-18T06.00.00Z')
 def test_endpoint_shares_and_roundtrip(self):self.assertEqual(self.a['endpoints']['2024']['old_age_share_of_social_protection_pct'],'58.5');self.assertEqual(json.loads(json.dumps(self.a)),self.a)
if __name__=='__main__':unittest.main()
