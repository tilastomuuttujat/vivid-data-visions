import unittest,copy
from population_foundation import references,facts,age,select,check_bundle,TABLES,VERSION,GROUPS
class PopulationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.r=references();cls.f=facts(cls.r)
 def test_age_groups_reconcile_all_years(self):
  for tab,start,end,metric in [('11rc',1865,2025,'vaerak-vaesto'),('128t',2026,2050,'vaesto_e24')]:
   for year in range(start,end+1):
    self.assertEqual(sum(age(self.r,tab,year,a,b) for a,b in [(0,14),(15,64),(65,110)]),select(self.r,tab,year,metric,ikaryhma_10_20180101='SSS'))
 def test_missing_migration_is_not_zero(self):
  with self.assertRaises(ValueError):select(self.r,'12dx',1850,'synt-vm4142')
  self.assertTrue(any(c['value'] is None and c['raw']=='.' for c in self.r['12dx']['observations']))
 def test_vintage_and_observed_are_separate(self):
  self.assertEqual(self.f['ages']['2025']['kind'],'observed');self.assertEqual(self.f['ages']['2050']['kind'],'projection_2024')
  self.assertEqual(self.r['128t']['receipt']['projection_vintage'],2024)
 def test_natural_change_and_migration_identities(self):
  for y in range(1850,2026):
   self.assertEqual(select(self.r,'12dx',y,'synt-vm01')-select(self.r,'12dx',y,'synt-vm11'),select(self.r,'12dx',y,'synt-luonvalisays'))
  self.assertEqual(select(self.r,'12dx',2025,'synt-vm41')-select(self.r,'12dx',2025,'synt-vm42'),select(self.r,'12dx',2025,'synt-vm4142'))
 def test_total_change_is_not_forced_to_natural_plus_migration(self):
  # Population corrections exist: never force the remainder into migration.
  y=2025;remainder=select(self.r,'12dx',y,'synt-kokmuutos')-select(self.r,'12dx',y,'synt-luonvalisays')-select(self.r,'12dx',y,'synt-vm4142')
  self.assertNotEqual(remainder,0)
 def test_region_totals_reconcile(self):
  for y in range(1990,2026):
   codes=[x['area'] for x in self.f['regional2025'] if x['area']!='SSS'];key=next(k for k in self.r['11ra']['observations'][0]['dimensions'] if k.startswith('alue_'))
   self.assertEqual(sum(select(self.r,'11ra',y,'vaerak-vaesto',**{key:c}) for c in codes),select(self.r,'12dx',y,'synt-vaesto'))
 def bundle(self):
  shared={'version':VERSION,'source_keys':TABLES,'source_digests':{t:self.r[t]['receipt']['sha256'] for t in TABLES},'facts':self.f}
  return {'version':VERSION,'supplements':[dict(article_group=g,population_foundation=copy.deepcopy(shared),period_linkage='exact_passage_only',claim_classification={'observation_periods':[[1850,2025]],'claim_type':'mechanism_hypothesis'},forecast_period=[2026,2050],forecast_vintage=2024,causal_effect_identified=False) for g in GROUPS]}
 def test_reject_forecast_as_observation_and_changed_fact(self):
  b=self.bundle();check_bundle(b);b['supplements'][0]['claim_classification']['observation_periods']=[[1850,2050]]
  with self.assertRaises(ValueError):check_bundle(b)
  b=self.bundle();b['supplements'][0]['population_foundation']['facts']['fertility']['2025']='2.1'
  with self.assertRaises(ValueError):check_bundle(b)
if __name__=='__main__':unittest.main()
