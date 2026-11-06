import unittest
from early_school_evidence import reference,analysis,check_bundle,PERIODS
class Tests(unittest.TestCase):
 def test_school_years_and_sex_totals(self):
  r,sha,m=reference();self.assertEqual(len(r['rows']),6)
  for x in r['rows']:self.assertEqual(x['boys']+x['girls'],x['total'])
  self.assertEqual(PERIODS,[[1871,1872],[1875,1876],[1885,1886]])
 def test_scope_is_not_population_enrolment(self):
  r,sha,m=reference();self.assertTrue(r['source_quality']['urban_seminary_model_schools_excluded']);self.assertFalse(r['source_quality']['population_school_age_denominator_available']);self.assertFalse(r['annual_calendar_series'])
 def test_calculated_girl_shares(self):
  e=analysis();self.assertIn('49,1 %',e['statistical_finding']);self.assertIn('41,8 %',e['statistical_finding']);self.assertIn('24 305',e['statistical_finding'])
 def test_calendar_scope_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':PERIODS},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['claim_classification']['observation_periods']=[[1871,1886]]
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
