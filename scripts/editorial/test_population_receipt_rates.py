import unittest,copy,json
from unittest.mock import patch
from population_receipt_rates import source,analysis,check_bundle,VERSION
class Tests(unittest.TestCase):
 def test_full_distribution(self):
  a=analysis();self.assertEqual(a['bins'],dict(below_3=73,**{'3_to_below_6':176,'6_to_below_9':34,'at_least_9':9}));self.assertEqual(sum(a['bins'].values()),292);self.assertEqual(a['municipal_median_percent'],3.9)
 def test_no_denominator_risk_or_causal_inference(self):
  m=analysis()['method']
  for k in ['age_rate_computed','denominator_backcalculated','age_standardization','municipal_counts_additive','population_weighted_rate_computed','non_take_up_estimated','causal_effect_identified','comparison_across_years']:self.assertFalse(m[k])
 def test_nonadditive_counts_preserved(self):
  s=source();self.assertEqual(sum(x['recipients'] for x in s['rows']),385901);self.assertEqual(s['national_annual_persons'],365029)
 def test_missing_or_duplicate_municipality_rejected(self):
  for duplicate in [False,True]:
   s=source();s['rows'].pop()
   if duplicate:s['rows'].append(copy.deepcopy(s['rows'][0]))
   with patch('population_receipt_rates.source',return_value=s):
    with self.assertRaises(ValueError):analysis()
 def test_bad_percentage_rejected(self):
  for v in [None,-1,101,float('nan')]:
   s=source();s['rows'][0]['published_percent']=v
   with patch('population_receipt_rates.source',return_value=s):
    with self.assertRaises(ValueError):analysis()
 def test_changed_accounting_rejected(self):
  s=source();s['rows'][0]['recipients']+=1
  with patch('population_receipt_rates.source',return_value=s):
   with self.assertRaises(ValueError):analysis()
 def test_roundtrip(self):a=analysis();self.assertEqual(a,json.loads(json.dumps(a)))
if __name__=='__main__':unittest.main()
