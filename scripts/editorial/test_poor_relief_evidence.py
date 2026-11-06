import unittest
from poor_relief_evidence import reference,analysis,check_bundle,PERIODS
class Tests(unittest.TestCase):
 def test_counts_and_source_year_not_publication_year(self):
  r,sha,m=reference();self.assertEqual(len(r['cells']),18);self.assertEqual(r['publication_year'],1891);self.assertEqual(PERIODS,[[1881,1881],[1883,1883],[1885,1885],[1887,1887]])
 def test_need_not_recipient_prevalence(self):
  r,sha,m=reference();self.assertFalse(r['source_quality']['recipient_share_is_poverty_rate']);self.assertTrue(r['source_quality']['missing_municipal_reports']);self.assertIn('ei kaikista apua tarvinneista',analysis()['statistical_finding'])
 def test_country_reconciles(self):
  r,sha,m=reference();k='reported_recipients_count'
  for y in [1881,1887]:self.assertEqual(m[y,'FI',k],m[y,'historical_urban',k]+m[y,'historical_rural',k])
 def test_interpolated_scope_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':PERIODS},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['claim_classification']['observation_periods']=[[1881,1887]]
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
