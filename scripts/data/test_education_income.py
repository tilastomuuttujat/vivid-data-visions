import importlib.util,pathlib,json,copy,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('income_build',ROOT/'scripts/data/build-education-income.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class IncomeTest(unittest.TestCase):
 def setUp(self):
  self.args=[json.loads((ROOT/('src/data/research/'+p)).read_text()) for p in ['education-income-source.json','education-income-existing.json','education-assessment.json']]
 def test_reproducible_and_scoped(self):
  out=m.build(*self.args)
  self.assertEqual(out,json.loads((ROOT/'src/data/research/education-income.json').read_text()))
  self.assertEqual(out['checks']['database_cells_independently_matched'],150)
  self.assertEqual(out['checks']['suppressed_or_missing_cells'],256)
  self.assertFalse(out['checks']['causal_decomposition'])
  self.assertEqual({r['year'] for r in out['wages']},{2024})
  self.assertEqual({r['education'] for r in out['employment']},{'78','9'})
  self.assertGreater(out['ratios'][-1]['ratio'],out['ratios'][0]['ratio'])
 def test_source_mismatch_and_duplicate_fail(self):
  args=copy.deepcopy(self.args);args[1]['observations'][0]['value']+=1
  # First stored row may be poverty, which is outside the 150-cell check.
  row=next(r for r in args[1]['observations'] if r['series_key']=='vivid.groups.income.median');row['value']+=1
  with self.assertRaises(ValueError):m.build(*args)
  args=copy.deepcopy(self.args);args[0]['extracts'][0]['rows'].append(args[0]['extracts'][0]['rows'][0])
  with self.assertRaises(ValueError):m.build(*args)
 def test_missing_wage_values_remain_null(self):
  out=m.build(*self.args)
  self.assertEqual(sum(r['value'] is None for r in out['wages']),256)
