import importlib.util,json,pathlib,unittest,copy
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('education',ROOT/'scripts/data/build-education-assessment.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AssessmentTest(unittest.TestCase):
 def setUp(self):self.inputs=json.loads((ROOT/'src/data/research/education-assessment-inputs.json').read_text())
 def test_rebuild_and_denominators(self):
  out=m.build(self.inputs)
  self.assertEqual(out,json.loads((ROOT/'src/data/research/education-assessment.json').read_text()))
  self.assertEqual(out['checks']['placement_ratios_checked'],128)
  for r in out['employment_rates']:self.assertAlmostEqual(r['value'],100*r['employed']/r['population'])
  self.assertEqual(out['early_changes'][0]['start_value'],77486)
  self.assertTrue(all(r['year']<=2024 for r in out['employment_rates']))
 def test_rejects_duplicates_and_corruption(self):
  bad=copy.deepcopy(self.inputs);bad['observations'].append(bad['observations'][0])
  with self.assertRaises(ValueError):m.build(bad)
  bad=copy.deepcopy(self.inputs)
  next(r for r in bad['observations'] if r['series_key']=='education.modern.placement.employment_share')['value']=0
  with self.assertRaises(ValueError):m.build(bad)
 def test_effects_are_scoped_and_not_reestimated(self):
  out=m.build(self.inputs);s=out['studies'][0]
  self.assertEqual(s['intervention_window'],[1972,1977]);self.assertEqual(s['effect_value'],-.07)
  self.assertIn('not_reestimated',s['type']);self.assertIn('ei tässä tunnisteta',out['conclusion']['not_identified'])
