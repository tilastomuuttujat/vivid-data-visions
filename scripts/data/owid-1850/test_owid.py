import collections,csv,decimal,hashlib,io,json,pathlib,unittest
R=pathlib.Path(__file__).resolve().parent
class OwidTests(unittest.TestCase):
 def setUp(self):self.p=json.loads((R/'batch.json').read_text());self.ss=self.p['series']
 def test_scope_and_exact_values(self):
  self.assertEqual(len(self.ss),35);self.assertEqual({s['inventory_number'] for s in self.ss},set(range(1,36)))
  self.assertEqual(sum(len(s['values']) for s in self.ss),4711)
  for s in self.ss:
   rows=list(csv.DictReader(io.StringIO((R/'sources'/(s['slug']+'.csv')).read_text())))
   expected={int(r['Year']):r[s['csv_column']] for r in rows if 1850<=int(r['Year'])<=2025 and r[s['csv_column']]}
   self.assertEqual({v['year']:v['value'] for v in s['values']},expected)
   self.assertEqual(len(expected),len(s['values']))
 def test_holds_and_projection(self):
  self.assertEqual(sum(v['is_published'] for s in self.ss for v in s['values']),3861)
  for s in self.ss:
   for v in s['values']:
    self.assertGreaterEqual(v['year'],1850);self.assertLessEqual(v['year'],2025)
    self.assertNotEqual(v['value_kind'],'observed')
    if v['hold_reasons'] or v['value_kind']=='projection':self.assertFalse(v['is_published'])
    if 20<=s['inventory_number']<=29 and v['year']<=1917:self.assertFalse(v['is_published'])
   if s['inventory_number'] in (15,16,19):self.assertFalse(any(v['is_published'] for v in s['values']))
 def test_semantics_and_lineage(self):
  for s in self.ss:
   self.assertFalse(s['metadata']['include_in_composite']);self.assertIsNone(s['metadata']['composite_weight'])
   for ext,k in [('csv','snapshot_csv_sha256'),('metadata.json','snapshot_metadata_sha256')]:
    self.assertEqual(hashlib.sha256((R/'sources'/(s['slug']+'.'+ext)).read_bytes()).hexdigest(),s['metadata'][k])
  d={s['inventory_number']:s for s in self.ss}
  self.assertEqual(d[23]['metadata']['measurement_scale'],'nominal')
  self.assertEqual(d[4]['unit'],'deaths per 100 live births')
  self.assertEqual(d[6]['frequency'],'birth_cohort_year');self.assertEqual(d[8]['frequency'],'birth_decade')
  self.assertEqual({d[i]['metadata']['dependency_cluster'] for i in range(30,36)},{'territorial_co2'})
 def test_version_and_sql(self):
  p=dict(self.p);h=p.pop('content_sha256')
  self.assertEqual(h,hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
  self.assertEqual(json.loads((R/'import.sql').read_text().split('$payload$')[1]),self.p)
 def test_co2_components_reconcile_at_source_precision(self):
  d={s['inventory_number']:{v['year']:decimal.Decimal(v['value']) for v in s['values']} for s in self.ss}
  # Coal/oil/gas are not the whole total: cement/flaring/other components may remain.
  for y,total in d[30].items():
   components=sum(d[i][y] for i in (31,32,33))
   self.assertLessEqual(components,total+max(decimal.Decimal('10'),abs(total)*decimal.Decimal('0.00001')))
if __name__=='__main__':unittest.main()
