import csv,decimal,hashlib,io,json,pathlib,unittest
R=pathlib.Path(__file__).resolve().parent;D=decimal.Decimal
class SupplementTests(unittest.TestCase):
 def setUp(self):
  self.p=json.loads((R/'batch.json').read_text());self.s={s['series_key'].split('fi.historical20261026.')[1]:s for s in self.p['series']}
  self.raw={int(r['year']):r for r in csv.DictReader(io.StringIO((R/'sources/jst-finland.csv').read_text()))}
 def test_scope_and_gap_preservation(self):
  self.assertEqual(len(self.s),32);self.assertEqual(sum(len(s['values']) for s in self.s.values()),4774)
  for s in self.s.values():
   self.assertLess(s['start_year'],1900);self.assertGreaterEqual(s['start_year'],1850);self.assertLessEqual(s['end_year'],2025)
   self.assertEqual(len(s['values']),len({v['year'] for v in s['values']}));self.assertFalse(s['metadata']['include_in_composite']);self.assertIsNone(s['metadata']['composite_weight'])
   self.assertTrue(all(v['value_kind']=='estimate' for v in s['values']))
   if s['metadata'].get('source_variable'):
    code=s['metadata']['source_variable'];expected={y:r[code] for y,r in self.raw.items() if r[code]}
    self.assertEqual({v['year']:v['value'] for v in s['values']},expected)
 def test_formulas_recalculate_exactly(self):
  for key,s in self.s.items():
   if s['metadata'].get('calculation_type'):
    a,b=s['metadata']['inputs']
    for v in s['values']:self.assertEqual(D(v['value']),D(self.raw[v['year']][a])/D(self.raw[v['year']][b])*100)
  wage={v['year']:D(v['value']) for v in self.s['jst.real_wage_index']['values']};self.assertEqual(wage[1990],100)
 def test_units_and_source_estimation_flags(self):
  self.assertEqual(self.s['jst.stir']['unit'],'% vuodessa');self.assertIn('suhdeluku',self.s['jst.bill_rate']['unit'])
  self.assertEqual(self.s['jst.crisisJST']['metadata']['measurement_scale'],'binary_category')
  for v in self.s['jst.lev']['values']:
   self.assertEqual(v['meta']['source_interpolated'],v['year'] in (1990,1991))
   if v['year'] in (1990,1991):self.assertFalse(v['meta']['breakpoint_eligible'])
 def test_source_snapshots_and_cpi(self):
  m=json.loads((R/'sources/manifest.json').read_text())
  for src in m.values():self.assertEqual(hashlib.sha256((R/'sources'/src['subset']).read_bytes()).hexdigest(),src['subset_sha256'])
  c={v['year']:v['value'] for v in self.s['statfin11xy.cpi1914']['values']};self.assertEqual(c[1860],'78');self.assertEqual(c[2025],'283504')
  w=json.loads((R/'sources/wood-extract.json').read_text());self.assertEqual(D(w['records'][0]['domestic']).quantize(D('0.01')),D('1.16'));self.assertEqual(w['records'][0]['imported'],'-')
  for col in ('domestic','energy'):
   self.assertEqual({v['year']:v['value'] for v in self.s['luke.roundwood_'+col]['values']},{r['year']:r[col] for r in w['records'] if r[col] not in (None,'','-','.','..','...')})
 def test_source_return_identity(self):
  # RORE safe return is an explicitly derived average, not an independent asset.
  for y,r in self.raw.items():self.assertLess(abs(D(r['safe_tr'])-(D(r['bill_rate'])+D(r['bond_tr']))/2),D('0.0000001'))
 def test_sql_and_hash(self):
  p=dict(self.p);h=p.pop('content_sha256');self.assertEqual(h,hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
  self.assertEqual(json.loads((R/'import.sql').read_text().split('$payload$')[1]),self.p)
if __name__=='__main__':unittest.main()
