import decimal,hashlib,json,pathlib,unittest
R=pathlib.Path(__file__).resolve().parent;D=decimal.Decimal
class ForestTests(unittest.TestCase):
 def setUp(self):self.p=json.loads((R/'batch.json').read_text());self.s={s['id']:s for s in self.p['series']}
 def test_exact_values_and_no_filled_years(self):
  self.assertEqual(len(self.s),11);self.assertEqual(sum(len(s['values']) for s in self.s.values()),1018)
  for s in self.s.values():
   raw=json.loads((R/'sources'/(s['metadata']['source_table']+'.response.json')).read_text());dims=[c['code'] for c in raw['columns'] if c['type']!='c']
   lookup={tuple(r['key']):r['values'][0] for r in raw['data']}
   keys=[]
   for v in s['values']:
    self.assertEqual(v['value'],lookup[tuple(v['meta']['source_coordinates'][c] for c in dims)])
    self.assertGreaterEqual(v['year'],1850);self.assertLessEqual(v['year'],2025)
    if s['frequency']=='inventory_period':self.assertEqual(v['year'],v['meta']['inventory_end']);self.assertIn('VMI',v['period'])
    keys.append((v['year'],v['group_key']))
   self.assertEqual(len(keys),len(set(keys)))
 def test_border_variants_are_not_merged(self):
  for s in (self.s['growth_inventory'],self.s['growth_per_hectare']):
   old=[v for v in s['values'] if v['meta']['inventory_code'] in ('01','02a')]
   self.assertTrue(old)
   self.assertTrue(all(v['group_key'].endswith('.BORDERS_PRE1944') for v in old))
   self.assertTrue(any(v['meta']['inventory_code']=='02b' and v['group_key']=='FI' for v in s['values']))
 def test_holds_and_source_conflict(self):
  held=[v for s in self.s.values() for v in s['values'] if not v['is_published']]
  self.assertEqual(len(held),31)
  self.assertEqual(self.p['quality_flags'][0]['difference_1000ha'],'40')
  for s in self.s.values():
   for v in s['values']:
    self.assertEqual(v['is_published'],not v['meta']['hold_reasons'])
    if s['id']=='removals' and v['year']<=1944:self.assertFalse(v['is_published'])
    if s['metadata']['source_table']=='area' and v['meta']['inventory_code']=='01' and v['group_key']=='FI':self.assertFalse(v['is_published'])
 def test_independent_latest_anchors_and_units(self):
  stock=next(v for v in self.s['growing_stock']['values'] if v['group_key']=='FI' and v['year']==2024)
  growth=next(v for v in self.s['growth_inventory']['values'] if v['group_key']=='FI' and v['year']==2024)
  self.assertEqual(D(stock['value']),D('2578'));self.assertEqual(D(growth['value']),D('103.20'))
  self.assertEqual(growth['meta']['inventory_start'],2020);self.assertFalse(growth['meta']['growth_is_calendar_year_observation'])
  self.assertEqual(self.s['stock_density']['metadata']['land_scope'],'forest_land')
  self.assertEqual(self.s['growing_stock']['metadata']['land_scope'],'forest_and_poor_forest_land')
  for s in self.s.values():self.assertFalse(s['metadata']['same_year_growth_minus_removals_approved']);self.assertFalse(s['metadata']['include_in_composite']);self.assertIsNone(s['metadata']['composite_weight'])
 def test_hashes_and_import(self):
  for rec in (R/'sources').glob('*.receipt.json'):
   x=json.loads(rec.read_text())
   for ext,v in x['files'].items():self.assertEqual(hashlib.sha256((R/'sources'/(x['key']+'.'+ext)).read_bytes()).hexdigest(),v['sha256'])
  p=dict(self.p);h=p.pop('content_sha256');self.assertEqual(h,hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
  self.assertEqual(json.loads((R/'import.sql').read_text().split('$payload$')[1]),self.p)
if __name__=='__main__':unittest.main()
