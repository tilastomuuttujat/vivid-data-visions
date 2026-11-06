import unittest
from decimal import Decimal as D
from electricity_evidence import number,reference,analysis,check_bundle
class Tests(unittest.TestCase):
 def test_zero_symbol_is_not_missing(self):
  self.assertEqual(number('-'),0)
  for symbol in ['.','..','NaN']:
   with self.assertRaises(Exception):number(symbol)
 def test_annual_balance_and_scope(self):
  s,r,m=reference();self.assertEqual(len(s['data']),155);self.assertEqual(m[1960,'SSS'],8789);self.assertEqual(m[1990,'2'],10742);self.assertEqual(m[1960,'1.4'],0)
  for y in range(1960,1991):self.assertLessEqual(abs(m[y,'1']+m[y,'2']-m[y,'SSS']),1)
 def test_denominator_is_consumption_not_domestic_generation(self):
  s=analysis();self.assertIn('29,1 %',s['statistical_finding']);self.assertIn('17,2 %',s['statistical_finding']);self.assertIn('1960',s['statistical_finding']);self.assertEqual(s['statistical_reference']['unit'],'GWh');self.assertEqual(s['statistical_reference']['cells'][3]['values'],['-'])
 def test_changed_article_values_rejected(self):
  s=analysis();s.update(period_linkage='exact_passage_only',claim_classification={'observation_periods':[[1960,1990]]},evidence=[{'finding':s['statistical_finding']}]);check_bundle({'supplements':[s]});s['statistical_reference']['unit']='MW'
  with self.assertRaises(ValueError):check_bundle({'supplements':[s]})
