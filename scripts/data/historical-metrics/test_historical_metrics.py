import collections,hashlib,json,pathlib,subprocess,sys,unittest
R=pathlib.Path(__file__).resolve().parent;O=R.parents[2]/'docs/historical-metrics'
from snapshot_inputs import ensure_snapshot_inputs
ensure_snapshot_inputs(R)
class HistoricalMetricsTests(unittest.TestCase):
 def test_all_actual_historical_series_are_included_once(self):
  p=json.loads((O/'registry.json').read_text());r=p['series'];self.assertEqual(len(r),536);self.assertEqual(len({x['record_key'] for x in r}),536)
  self.assertEqual(collections.Counter(x['source_family'] for x in r),{'indicator':142,'finance':394})
  self.assertEqual(sum(x['historical_rows'] for x in r if x['source_family']=='indicator'),3420)
  self.assertEqual(sum(x['historical_rows'] for x in r if x['source_family']=='finance'),4006)
  self.assertTrue(all(x['historical_years'] and min(x['historical_years'])>=1850 and max(x['historical_years'])<=1899 for x in r))
 def test_no_automatic_weight_and_source_holds(self):
  r=json.loads((O/'registry.json').read_text())['series'];self.assertFalse(any(x['composite_approved'] or x['weight'] is not None for x in r))
  held=[x for x in r if str(x.get('source_key')).startswith(('hist_cost_living_csv','hist_macro_csv','hist_structure_csv'))];self.assertEqual(len(held),49);self.assertTrue(all(x['eligible_cells']==0 for x in held))
  self.assertTrue(all(x['do_not_interpolate'] for x in r))
 def test_comparisons_and_frozen_raw_source_hash(self):
  a=json.loads((R/'live-comparison.json').read_text());b=json.loads((R/'finance-copy-comparison.json').read_text());rows=a['results']+b['results']
  self.assertEqual(len(rows),85);self.assertEqual(sum(x['checked_cells'] for x in rows),12012);self.assertFalse(any(x['changes'] for x in rows));self.assertTrue(all(x['checked_cells']==x['matched'] for x in rows))
  h=hashlib.sha256((R/'statfin15ai-response.json').read_bytes()).hexdigest();self.assertTrue(all(x['response_sha256']==h for x in a['results'] if x['source']=='15ai'))
 def test_input_integrity_and_replay(self):
  p=json.loads((O/'registry.json').read_text());s=p['summary'];
  for f,h in s['source_hashes'].items():self.assertEqual(hashlib.sha256((R/f).read_bytes()).hexdigest(),h,f)
  before={p.name:p.read_bytes() for p in O.glob('*')};subprocess.run([sys.executable,str(R/'build-registry.py')],check=True,capture_output=True)
  self.assertEqual(before,{p.name:p.read_bytes() for p in O.glob('*')})
if __name__=='__main__':unittest.main()
