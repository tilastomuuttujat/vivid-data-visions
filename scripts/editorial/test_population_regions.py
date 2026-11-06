import unittest,copy,json
from population_regions import source,analysis,verify_accounting
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.s=source();cls.a=analysis()
 def test_full_region_year_grid_and_independent_population_check(self):self.assertTrue(verify_accounting(self.s));self.assertEqual(len(self.s['rows']),684);self.assertEqual(len(self.s['mapping']),308)
 def test_domestic_net_migration_cancels_nationally(self):
  for c in self.s['country']:self.assertEqual(c['synt-vm43_netto'],0)
 def test_correction_not_hidden_in_migration(self):
  c=next(x for x in self.s['country'] if x['year']==2025);self.assertEqual(c['synt-vakorjaus'],-946);self.assertEqual(c['synt-kokmuutos'],16910);self.assertEqual(c['synt-luonvalisays']+c['synt-vm4142']+c['synt-vakorjaus'],c['synt-kokmuutos'])
 def test_altered_flow_rejected(self):
  s=copy.deepcopy(self.s);s['rows'][0]['synt-vm41']+=1
  with self.assertRaises(ValueError):verify_accounting(s)
 def test_missing_region_year_rejected(self):
  s=copy.deepcopy(self.s);s['rows'].pop()
  with self.assertRaises(ValueError):verify_accounting(s)
 def test_no_automatic_migration_motive_or_loneliness_inference(self):
  for k in ['migration_motives_identified','unique_migrants_counted','causal_effect_identified','loneliness_measured','forecast']:self.assertFalse(self.a['method'][k])
 def test_latest_distribution_and_roundtrip(self):self.assertEqual(self.a['counts2025'],dict(natural_negative=18,domestic_net_positive=5,international_net_positive=19,population_growing=6,population_declining=13));self.assertEqual(json.loads(json.dumps(self.a)),self.a)
if __name__=='__main__':unittest.main()
