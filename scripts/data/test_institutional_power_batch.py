import json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
BATCHES=[('institutional_power_1850_1917_20261026',1850,1917,11,12,4),('institutional_power_1918_1945_20261026',1918,1945,15,16,7)]
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
