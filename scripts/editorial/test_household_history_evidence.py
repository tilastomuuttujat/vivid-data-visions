import unittest
from household_history_evidence import reference,analysis,check_bundle
class Tests(unittest.TestCase):
 def test_exclusive_groups_sum_to_total(self):
  s,r,m=reference();self.assertEqual(len(s['data']),320)
  for y in range(1985,2025):self.assertEqual(sum(m[y,str(k)] for k in range(1,8)),m[y,'SSS'])
 def test_count_and_denominator(self):
  e=analysis();self.assertIn('1 336 181',e['statistical_finding']);self.assertIn('46,7 prosenttiin',e['statistical_finding']);self.assertEqual(e['statistical_reference']['unit'],'household_dwelling_units');self.assertNotIn('3-',e['statistical_reference']['exclusive_size_groups'])
 def test_seven_plus_not_exact_person_count(self):
  e=analysis();self.assertEqual(e['statistical_reference']['last_group'],'7_or_more_persons');self.assertEqual(len(e['data_links']),8)
 def test_changed_population_unit_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':[[1985,2024]]},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['statistical_reference']['unit']='persons'
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
