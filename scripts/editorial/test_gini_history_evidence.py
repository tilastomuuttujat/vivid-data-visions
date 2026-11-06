import unittest
from decimal import Decimal as D
from gini_history_evidence import reference,analysis,check_bundle,PERIODS
class Tests(unittest.TestCase):
 def test_missing_never_becomes_zero(self):
  s,r,m=reference();self.assertIsNone(m['SL1TJKT',1966]);self.assertEqual(m['SL1',1966],D('31.1'));self.assertEqual(sum(v is None for v in m.values()),15);self.assertEqual(len(m),258)
 def test_sparse_early_years_not_interpolated(self):
  s,r,m=reference();self.assertNotIn(('SL1',1967),m);self.assertEqual(PERIODS[:4],[[1966,1966],[1971,1971],[1976,1976],[1981,1981]])
 def test_benchmarks_and_concepts(self):
  e=analysis();self.assertIn('6,2 prosenttiyksikköä',e['statistical_finding']);self.assertIn('52,3',e['statistical_finding']);self.assertIn('33,4',e['statistical_finding']);self.assertEqual([x['observations'] for x in e['data_links']],[39,39,39,42,42,42])
 def test_widened_observation_interval_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':PERIODS},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['claim_classification']['observation_periods']=[[1966,2024]]
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
