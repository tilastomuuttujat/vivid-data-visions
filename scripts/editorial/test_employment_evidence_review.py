import copy,json,unittest
from employment_evidence_review import ROOT,load_sources,rates,cells
class EmploymentTests(unittest.TestCase):
 def setUp(self):
  self.b=json.loads((ROOT/'employment-evidence-review.json').read_text());self.ref=load_sources(self.b)[0]['employment']
 def test_population_and_denominators(self):
  r=rates(self.b,self.ref);self.assertEqual(len(r),3800)
  from decimal import Decimal
  for p in r:
   self.assertEqual(p['population'],p['employed']+p['unemployed']+p['outside']);self.assertLessEqual(p['students_subset'],p['outside'])
   self.assertEqual(Decimal(p['employment_population_pct']),100*Decimal(p['employed'])/p['population'])
 def test_changed_population_rejected(self):
  ref=copy.deepcopy(self.ref);ref[0]['value']+=1
  with self.assertRaises(ValueError):rates(self.b,ref)
 def test_duplicate_rejected(self):
  with self.assertRaises(ValueError):cells(self.b['series'][0],self.ref+self.ref)
if __name__=='__main__':unittest.main()
