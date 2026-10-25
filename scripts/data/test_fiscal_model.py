import importlib.util,json,pathlib,unittest,copy
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('fiscal',ROOT/'scripts/data/build-fiscal-model.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class FiscalTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.inputs=json.loads((ROOT/'src/data/research/fiscal-inputs.json').read_text());cls.result=m.build(cls.inputs)
 def test_all_years_and_identities(self):
  self.assertEqual(len(self.result['points']),201)
  computed=[p for p in self.result['points'] if p['status']=='computed'];self.assertEqual(len(computed),51)
  for p in computed:
   self.assertAlmostEqual(sum(x['value_pp'] for x in p['parts']),p['change_pp'],places=8)
   self.assertAlmostEqual(p['revenue_pct']-p['expenditure_pct'],p['balance_pct'],places=8)
 def test_nulls_are_not_zeros(self):
  for p in self.result['points']:
   if p['year']<1975 or p['year']>2025:self.assertIsNone(p['balance_pct']);self.assertEqual(p['parts'],[])
 def test_duplicates_and_missing_fail_closed(self):
  p=copy.deepcopy(self.inputs);p['observations'].append(p['observations'][0])
  with self.assertRaises(ValueError):m.build(p)
  p=copy.deepcopy(self.inputs);p['observations']=p['observations'][1:]
  with self.assertRaises(KeyError):m.build(p)
 def test_corrupt_accounting_fails(self):
  p=copy.deepcopy(self.inputs)
  next(x for x in p['observations'] if x['series_key'].endswith('.otrs.eur_m') and x['year']==1993)['value']+=100
  with self.assertRaises(ValueError):m.build(p)
 def test_repeat_is_identical_and_inputs_change_identity(self):
  self.assertEqual(self.result,m.build(self.inputs))
  p=copy.deepcopy(self.inputs);p['extracted_on']='2026-10-26';self.assertNotEqual(m.build(p)['release_id'],self.result['release_id'])
