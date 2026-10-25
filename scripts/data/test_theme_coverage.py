import importlib.util,json,pathlib,unittest,copy
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('coverage_build',ROOT/'scripts/data/build-theme-coverage.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class CoverageTest(unittest.TestCase):
 def setUp(self):
  self.inputs=json.loads((ROOT/'src/data/research/theme-coverage-inputs.json').read_text());self.periods=json.loads((ROOT/'src/data/research/long-view.json').read_text())['periods']
 def test_all_pairs_and_reproducibility(self):
  out=mod.build(self.inputs,self.periods)
  self.assertEqual(len(out['cells']),192)
  self.assertEqual(len({c['id'] for c in out['cells']}),192)
  self.assertEqual(sum(out['counts']['statuses'].values()),192)
  self.assertEqual(out,mod.build(self.inputs,self.periods))
  for c in out['cells']:
   self.assertEqual(len(c['observed_years'])+len(c['missing_observed_years']),c['end']-c['start']+1)
   self.assertIsNone(c['channel_assessment']['finding'])
 def test_projection_does_not_count_as_history(self):
  inputs=copy.deepcopy(self.inputs)
  for r in inputs['inventory']:
   r['observed_years']=None;r['estimated']=0;r['observed']=0;r['projected']=r['n']
  out=mod.build(inputs,self.periods)
  self.assertTrue(all(c['status']=='no_historical_candidate_in_scope' for c in out['cells']))
 def test_rebuild_matches_published_snapshot(self):
  self.assertEqual(mod.build(self.inputs,self.periods),json.loads((ROOT/'src/data/research/theme-coverage.json').read_text()))
