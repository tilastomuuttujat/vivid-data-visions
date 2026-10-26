import json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
BATCH='institutional_power_1850_1917_20261026'
class InstitutionalBatchTest(unittest.TestCase):
 def test_references_scope_and_evidence(self):
  p=json.loads((ROOT/f'scripts/data/batches/{BATCH}.json').read_text())
  ids={s['source_id'] for s in p['sources']};self.assertEqual(len(p['entries']),11)
  self.assertEqual(len({e['case_key'] for e in p['entries']}),11)
  for e in p['entries']:
   self.assertTrue(1850<=e['year_start']<=e['year_end']<=1917)
   self.assertTrue(set(e['source_ids'])<=ids)
   self.assertTrue(set(e['dimension_codes'])<=p['taxonomy'].keys())
   self.assertFalse(e['causal_effect_identified']);self.assertIsNone(e['numeric_effect'])
   self.assertTrue(all(not o['inference'] for o in e['observations']))
 def test_sql_contains_exact_payload(self):
  sql=(ROOT/f'scripts/data/batches/{BATCH}.sql').read_text();raw=sql.split('$payload$')[1]
  self.assertEqual(json.loads(raw),json.loads((ROOT/f'scripts/data/batches/{BATCH}.json').read_text()))
