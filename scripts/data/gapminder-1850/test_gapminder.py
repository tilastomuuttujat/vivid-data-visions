import collections,hashlib,json,pathlib,unittest
R=pathlib.Path(__file__).resolve().parent
class GapminderBatchTests(unittest.TestCase):
 def setUp(self):self.p=json.loads((R/'batch.json').read_text());self.s={x['id']:x for x in self.p['series']}
 def test_scope_and_exact_source_values(self):
  import csv,io
  self.assertEqual(len(self.s),5);self.assertEqual(sum(len(s['values']) for s in self.s.values()),831)
  for key,s in self.s.items():
   raw={int(r['time']):r[s['metadata']['source_concept']] for r in csv.DictReader(io.StringIO((R/(key+'-fi.csv')).read_text()))}
   self.assertEqual(len(s['values']),len({v['year'] for v in s['values']}))
   for v in s['values']:self.assertTrue(1850<=v['year']<=2025);self.assertEqual(v['value'],raw[v['year']]);self.assertNotEqual(v['value_kind'],'observed')
 def test_projection_and_unclear_boundaries_fail_closed(self):
  self.assertTrue(all(not v['is_published'] for s in self.s.values() for v in s['values'] if v['value_kind']=='projection'))
  self.assertTrue(all(not v['is_published'] for v in self.s['child']['values'] if v['year']>=2019))
  self.assertTrue(all(v['value_kind']=='projection' for v in self.s['fertility']['values'] if v['year']>=2024))
  self.assertEqual(sum(not v['is_published'] for s in self.s.values() for v in s['values']),9)
 def test_no_double_weight_or_silent_unit_conversion(self):
  self.assertEqual(self.s['co2_total']['metadata']['dependency_cluster'],self.s['co2_per_capita']['metadata']['dependency_cluster'])
  self.assertEqual(self.s['co2_total']['unit'],'t CO₂ / vuosi');self.assertEqual(self.s['co2_total']['metadata']['source_metadata']['unit'],'MtCO2')
  self.assertTrue(all(s['metadata']['include_in_composite']==False for s in self.s.values()))
  self.assertTrue(all(s['relation_type']=='context' for s in self.s.values()))
 def test_manifest_and_sql_are_same_version(self):
  p=dict(self.p);h=p.pop('content_sha256');self.assertEqual(h,hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
  self.assertEqual(json.loads((R/'import.sql').read_text().split('$payload$')[1]),self.p)
  for s in self.s.values():self.assertEqual(len(s['metadata']['source_commit']),40)
if __name__=='__main__':unittest.main()
