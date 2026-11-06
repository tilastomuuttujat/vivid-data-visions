import unittest
from press_history_evidence import reference,analysis,check_bundle,PERIODS,LANGS
class Tests(unittest.TestCase):
 def test_exclusive_languages_reconcile(self):
  r,sha,m=reference();self.assertEqual(len(r['rows']),6)
  for x in r['rows']:self.assertEqual(sum(x[k] for k in LANGS),x['total'])
 def test_newspapers_not_periodicals(self):
  r,sha,m=reference();self.assertEqual(m[1909,'all_newspapers_and_periodicals']['total'],352);self.assertEqual(m[1909,'historical_political_newspapers']['total'],125)
 def test_readership_not_inferred(self):
  r,sha,m=reference();self.assertFalse(r['source_quality']['readership_or_circulation_available']);self.assertTrue(r['source_quality']['snapshot_dates_vary']);self.assertIn('67,9 prosenttiin',analysis()['statistical_finding'])
 def test_continuous_interval_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':PERIODS},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['claim_classification']['observation_periods']=[[1886,1909]]
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
