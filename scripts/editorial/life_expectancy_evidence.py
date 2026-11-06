"""Freeze period life expectancy without manufacturing annual observations or care effects."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).parent

def reference():
 review=json.loads((ROOT/'life-expectancy-source-review.json').read_text());p=ROOT/'sources/life12am-1851-1970.json';raw=p.read_text();receipt=json.loads(p.with_suffix('.receipt.json').read_text())
 if digest(raw)!=receipt['sha256'] or digest(raw)!=review['sha256']:raise ValueError('Reference changed')
 data=json.loads(raw)
 if [c['code'] for c in data['columns']]!=['timeperiod_y','sukupuoli_9_20180101','eodote_0']:raise ValueError('Dimensions changed')
 labels=dict(zip(receipt['metadata']['variables'][0]['values'],receipt['metadata']['variables'][0]['valueTexts']));periods={k:[int(v) for v in labels[k].split('-')] for k in review['periods']}
 if periods!=review['periods'] or len(periods)!=15 or periods['1851']!=[1851,1860] or periods['1966']!=[1966,1970]:raise ValueError('Calculation periods changed')
 for k,(start,end) in periods.items():
  if start!=int(k) or end-start!=(9 if start<=1931 else 4):raise ValueError('Annualisation prohibited')
 rows=data['data'];values={(r['key'][0],r['key'][1]):D(r['values'][0]) for r in rows}
 if len(rows)!=30 or set(values)!={(k,g) for k in periods for g in ['1','2']}:raise ValueError('Source coverage changed')
 if any(not v.is_finite() or not 0<v<120 for v in values.values()):raise ValueError('Invalid life expectancy')
 if any(values[tuple(k.split(':'))]!=D(v) for k,v in review['benchmark_values'].items()):raise ValueError('Benchmark changed')
 if values['1851','2']-values['1851','1']!=D('3.44') or values['1966','2']-values['1966','1']!=D('7.76'):raise ValueError('Computed gap changed')
 return review,canonical(data)

def validate_reference(b):
 r,_=reference()
 if len(b['supplements'])!=1:raise ValueError('Unexpected bundle')
 s=b['supplements'][0]
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=list(r['periods'].values()) or s['evidence'][0]['finding']!=r['finding'] or s['limits']!=r['limits'] or s['data_links'][0]['reference_sha256']!=r['sha256']:raise ValueError('Bundle reference differs')

def check(db):
 r,payload=reference();rows=db.execute('SELECT version,reference_sha256,review_json,payload_json FROM editorial__life_expectancy_source_snapshots WHERE version=?',[r['version']])
 if rows!=[dict(version=r['version'],reference_sha256=r['sha256'],review_json=canonical(r),payload_json=payload)]:raise ValueError('Snapshot readback differs')

def store(db):
 r,payload=reference();db.execute('BEGIN')
 try:
  db.execute('CREATE TABLE IF NOT EXISTS editorial__life_expectancy_source_snapshots(version TEXT PRIMARY KEY,reference_sha256 TEXT NOT NULL,review_json TEXT NOT NULL,payload_json TEXT NOT NULL)')
  db.execute('INSERT INTO editorial__life_expectancy_source_snapshots VALUES(?,?,?,?) ON CONFLICT DO NOTHING',[r['version'],r['sha256'],canonical(r),payload]);check(db);db.execute('COMMIT')
 except:db.execute('ROLLBACK');raise

def main():
 b=json.load(sys.stdin);validate_reference(b);db=RecordRemote()
 try:validate(db,b);store(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:check(db);validate(db,b);verify(db,b)
 finally:db.close()
 print('PASS life expectancy supplement: 1 article, 30 source values, 15 original calculation periods; fresh connection readback; original articles unchanged; no annual interpolation or causal attribution.')
if __name__=='__main__':main()
