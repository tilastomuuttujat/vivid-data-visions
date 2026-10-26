import json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
BATCHES=[('institutional_power_1850_1917_20261026',1850,1917,11,12,4),('institutional_power_1918_1945_20261026',1918,1945,15,16,7),('institutional_power_1946_1975_20261026',1946,1975,14,15,10),('institutional_power_1976_1995_20261026',1976,1995,14,14,6),('institutional_power_1996_2025_20261026',1996,2025,16,16,5)]
class InstitutionalBatchTest(unittest.TestCase):
 def test_references_scope_and_evidence(self):
  for batch,a,b,n,obs,reused in BATCHES:
   with self.subTest(batch=batch):
    p=json.loads((ROOT/f'scripts/data/batches/{batch}.json').read_text())
    ids={s['source_id'] for s in p['sources']};self.assertEqual(len(p['entries']),n)
    self.assertEqual(len({e['case_key'] for e in p['entries']}),n)
    self.assertEqual(sum(len(e['observations']) for e in p['entries']),obs)
    self.assertEqual(sum(e['reuse_existing_item'] for e in p['entries']),reused)
    for e in p['entries']:
     self.assertTrue(a<=e['year_start']<=e['year_end']<=b)
     self.assertTrue(set(e['source_ids'])<=ids)
     self.assertTrue(set(e['dimension_codes'])<=p['taxonomy'].keys())
     self.assertTrue(all(set(o['source_ids'])<=set(e['source_ids']) for o in e['observations']))
     self.assertFalse(e['causal_effect_identified']);self.assertIsNone(e['numeric_effect'])
     self.assertTrue(all(not o['inference'] for o in e['observations']))
 def test_sql_contains_exact_payload_and_bounds(self):
  for batch,a,b,*_ in BATCHES:
   sql=(ROOT/f'scripts/data/batches/{batch}.sql').read_text();raw=sql.split('$payload$')[1]
   self.assertEqual(json.loads(raw),json.loads((ROOT/f'scripts/data/batches/{batch}.json').read_text()))
   self.assertIn(f'::int<{a}',sql);self.assertIn(f'::int>{b}',sql)

 def test_1946_1975_timing_and_governance_limits(self):
  p=json.loads((ROOT/'scripts/data/batches/institutional_power_1946_1975_20261026.json').read_text())
  rows={e['case_key'].split(':')[-1]:e for e in p['entries']}
  self.assertEqual(rows['school1972']['formal_authority_status'],'phased_implementation_scope_clipped')
  self.assertEqual(rows['dissolutions']['documented_event_years'],[1953,1961,1971,1975])
  self.assertIn('eläkeyhtiöiden',rows['pensions1961']['case_limitations'])

 def test_1976_1995_scope_and_timing(self):
  p=json.loads((ROOT/'scripts/data/batches/institutional_power_1976_1995_20261026.json').read_text())
  rows={e['case_key'].split(':')[-1]:e for e in p['entries']}
  self.assertEqual(p['period'],[1976,1995])
  self.assertEqual(rows['cooperation1978']['year_end'],1979)
  self.assertEqual(rows['election1994']['year_start'],1991)
  self.assertEqual(rows['election1994']['year_end'],1994)
  self.assertEqual(rows['eu1995']['year_end'],1995)
  self.assertEqual(rows['rights1995']['year_start'],1995)

 def test_1996_2025_distinguishes_authority_and_implementation(self):
  p=json.loads((ROOT/'scripts/data/batches/institutional_power_1996_2025_20261026.json').read_text())
  rows={e['case_key'].split(':')[-1]:e for e in p['entries']}
  self.assertEqual(rows['gdpr2018']['year_start'],2016)
  self.assertEqual(rows['gdpr2018']['year_end'],2018)
  self.assertEqual(rows['fiscal2013']['year_end'],2025)
  self.assertEqual(rows['emergency2020']['formal_authority_status'],'documented_activation_episode')
  self.assertEqual(rows['judicial2021']['formal_authority_status'],'documented_judicial_boundary')
  self.assertIn('46.',rows['employment2025']['case_limitations'])
  self.assertIn('1.7.2024',rows['lobby2024']['observations'][0]['statement'])
