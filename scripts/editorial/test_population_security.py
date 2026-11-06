import unittest,json,copy
from unittest.mock import patch
from population_security import analysis,sources
class Tests(unittest.TestCase):
 def test_exact_source_counts_and_households_reconcile(self):
  a,b=analysis()['points'];self.assertEqual(a['total_persons'],356437);self.assertEqual(b['total_persons'],365029);self.assertEqual(b['age_recipients']['20–24'],42591)
  for p in [a,b]:self.assertEqual(sum(p['age_recipients'].values()),p['total_persons']);self.assertEqual(sum(p[k] for k in ['single_living_households','other_one_person_households','childless_couples','two_parent_households','single_parent_households']),p['total_households'])
 def test_no_inference_of_eligibility_or_unmet_need(self):
  m=analysis()['method']
  for k in ['eligibility_estimated','non_take_up_estimated','population_rate_computed','age_standardization_performed','benefit_forecast','causal_effect_identified','individual_longitudinal_followup']:self.assertFalse(m[k])
 def test_incomplete_age_scope_rejected(self):
  r=sources();r['2025']['age_by_sex'].pop()
  with patch('population_security.sources',return_value=r):
   with self.assertRaises(ValueError):analysis()
 def test_household_total_mismatch_rejected(self):
  r=sources();r['2025']['household_national'][0]+=1
  with patch('population_security.sources',return_value=r):
   with self.assertRaises(ValueError):analysis()
 def test_json_roundtrip(self):a=analysis();self.assertEqual(json.loads(json.dumps(a)),a)
if __name__=='__main__':unittest.main()
