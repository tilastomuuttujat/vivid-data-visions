import copy,json,unittest
from pathlib import Path
from test_historical_school_review import DB
from income_evidence_review import load_sources,source_cells,match,descriptive_pairs,apply,META,FIELDS
from articles import canonical,digest
ROOT=Path(__file__).resolve().parent
class Tests(unittest.TestCase):
 def data(self):
  b=json.loads((ROOT/'income-evidence-review.json').read_text());refs,receipts=load_sources(b);db=DB()
  for table,cols in [('public__indicator_series',META),('public__indicator_values',FIELDS)]:
   db.execute('CREATE TABLE '+table+'('+','.join(k+(' INTEGER' if k in ('year','published','is_published','start_year','end_year') else ' TEXT') for k in cols.split(','))+')')
  db.execute('CREATE TABLE editorial__evidence_series_reviews(version TEXT,series_key TEXT,payload_json TEXT,PRIMARY KEY(version,series_key))')
  for spec in b['series']:
   m=dict.fromkeys(META.split(','));m.update(series_key=spec['series_key'],unit=spec['unit'],title='Test');db.execute('INSERT INTO public__indicator_series VALUES('+','.join('?' for _ in m)+')',list(m.values()))
   cells,_=source_cells(spec,refs[spec['family']])
   for (year,group),v in cells.items():
    r=dict.fromkeys(FIELDS.split(','));r.update(series_key=spec['series_key'],year=year,group_key=group,value=v,value_kind='observed',source_url=spec['source_url']);db.execute('INSERT INTO public__indicator_values VALUES('+','.join('?' for _ in r)+')',list(r.values()))
   rr=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key=? ORDER BY series_key,year,group_key',[spec['series_key']]);spec['expected_metadata_sha256']=digest(canonical(m));spec['expected_rows_sha256']=digest(canonical(rr))
  return db,b,refs,receipts
 def test_complete_readback_idempotence_and_nulls_not_zero(self):
  db,b,refs,receipts=self.data();before=db.execute('SELECT * FROM public__indicator_values');first=apply(db,b,refs,receipts);self.assertEqual(first,apply(db,b,refs,receipts))
  self.assertEqual(db.execute('SELECT * FROM public__indicator_values'),before)
  self.assertEqual(first[0]['matched_cells'],5288);self.assertEqual(first[0]['missing_source_cells'],256)
  self.assertEqual(len(first[0]['descriptive_pairs']),6)
  self.assertTrue(all(not r['median_aggregation_allowed'] and not r['causal_effect_identified'] for r in first[1]))
 def test_exact_cell_and_population_keys_required(self):
  db,b,refs,receipts=self.data();spec=b['series'][0];rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key=?',[spec['series_key']]);rows[0]['group_key']='wrong'
  with self.assertRaises(ValueError):match(spec,rows,refs[spec['family']])
  rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key=?',[spec['series_key']]);rows[0]['value']='1'
  with self.assertRaises(ValueError):match(spec,rows,refs[spec['family']])
 def test_unknown_education_and_unadjusted_comparison_explicit(self):
  b=json.loads((ROOT/'income-evidence-review.json').read_text());refs,_=load_sources(b);pairs=descriptive_pairs(b,refs)
  self.assertTrue(all('tuntematon' in p['education_9'] and not p['causal_effect_identified'] for p in pairs))
  self.assertEqual({p['age'] for p in pairs},{'18-64','25-34'})
