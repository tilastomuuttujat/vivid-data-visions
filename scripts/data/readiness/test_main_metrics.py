import json,pathlib,unittest,hashlib
R=pathlib.Path(__file__).resolve().parent;P=R.parents[2]/'docs/data-readiness/approved-main-metrics.json'
class MainMetricsTests(unittest.TestCase):
 def test_registry_contract(self):
  p=json.loads(P.read_text());self.assertEqual(len(p['approved']),18);self.assertEqual(len(p['not_approved']),2)
  for a in p['approved']:
   self.assertFalse(a['composite_approved']);self.assertFalse(a['causal_effect_approved']);self.assertIsNone(a['weight']);self.assertIsNone(a['normalization']);self.assertTrue(a['do_not_interpolate'])
   self.assertEqual(len(a['cells']),len(set(a['approved_years'])));self.assertTrue(all(1850<=c['year']<=2025 for c in a['cells']))
  self.assertTrue(all(x['status']=='not_approved' for x in p['not_approved']))
  h=p.pop('content_sha256');self.assertEqual(h,hashlib.sha256(json.dumps(p,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
 def test_gaps_and_periods_are_preserved(self):
  p=json.loads(P.read_text());a={x['metric_id']:x for x in p['approved']}
  self.assertEqual(len(a['gini']['cells']),3);self.assertEqual(len(a['energy']['cells']),4)
  self.assertEqual(a['homelessness']['break_years'],[2018]);self.assertEqual(a['turnout_parliament']['break_years'],[1975])
  self.assertEqual(a['life_male']['cells'][0]['period'],'1851-1860')
  self.assertEqual(a['infant_mortality']['coverage']['first'],1850)
 def test_source_and_arithmetic_checks(self):
  c=json.loads((R/'approval-source-comparison.json').read_text());self.assertEqual(sum(x['matches'] for x in c),435);self.assertFalse(any(x['mismatches'] for x in c))
  q=json.loads((R/'approval-income-check.json').read_text());self.assertTrue(q['passed']);self.assertEqual(q['checked'],51)
 def test_fresh_source_values_reproduce_database_snapshot(self):
  import itertools
  rows=json.loads((R/'main-metric-values.json').read_text()); checked=0
  for table,sexes,content in [('12am',{'1':'statfin.12am.v20261019.eodote_0.sex1','2':'statfin.12am.v20261019.eodote_0.sex2'},'eodote_0'),('12aq',{'SSS':'statfin.12aq.v20261019.imr.sexSSS'},'imr')]:
   d=json.loads((R/('approval-source-'+table+'.json')).read_text());cats=[]
   for dim in d['id']:
    index=d['dimension'][dim]['category']['index'];cats.append([k for k,v in sorted(index.items(),key=lambda x:x[1])])
   src={}
   for i,c in enumerate(itertools.product(*cats)):
    key=dict(zip(d['id'],c));sex=key['sukupuoli_9_20180101']
    if sex in sexes and key['contentscode']==content:src[sexes[sex],int(key['timeperiod_y'])]=d['value'].get(str(i)) if isinstance(d['value'],dict) else d['value'][i]
   for row in rows:
    if row['series_key'] in sexes.values():
     self.assertAlmostEqual(float(row['value']),float(src[row['series_key'],row['year']]),places=8);checked+=1
  self.assertEqual(checked,435)
 def test_income_recomputes_from_stored_inputs(self):
  rows=json.loads((R/'main-metric-income-inputs.json').read_text());a={(x['series_key'],x['year']):float(x['value']) for x in rows};checked=0
  for x in json.loads((R/'main-metric-values.json').read_text()):
   if x['series_key']=='fi.atlas1960.household_disposable_real_per_capita':
    y=x['year'];calc=1000*a['fi.atlas1960.household_disposable_nominal',y]/a['fi.statfin15ai.total.ep.fe4e7bf6af',y]*a['fi.atlas1960.cost_of_living_1951',2025]/a['fi.atlas1960.cost_of_living_1951',y]
    self.assertAlmostEqual(calc,float(x['value']),places=6);checked+=1
  self.assertEqual(checked,51)
if __name__=='__main__':unittest.main()
