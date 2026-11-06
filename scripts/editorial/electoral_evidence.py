"""Resident-only electoral reference; never mix it with expatriate-inclusive rates."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).parent

def reference():
 m=json.loads((ROOT/'electoral-source-review.json').read_text());raw=(ROOT/'sources/electoral12i9-1908-2023.json').read_text();receipt=json.loads((ROOT/'sources/electoral12i9-1908-2023.receipt.json').read_text())
 if digest(raw)!=m['reference_sha256'] or receipt['sha256']!=m['reference_sha256']:raise ValueError('Reference changed')
 s=json.loads(raw)
 if [c['code'] for c in s['columns']]!=['timeperiod_y','sukupuoli_9_20180101']+m['measures']:raise ValueError('Dimensions changed')
 rows=s['data'];values={(int(r['key'][0]),r['key'][1]):list(map(D,r['values'])) for r in rows}
 if len(rows)!=114 or set(values)!={(y,g) for y in m['years'] for g in m['groups']}:raise ValueError('Coverage changed')
 for (y,g),v in values.items():
  if len(v)!=3 or any(not n.is_finite() for n in v) or v[0]<=0 or not 0<=v[1]<=v[0] or abs(v[1]/v[0]*100-v[2])>D('.051'):raise ValueError('Invalid source counts or rate')
 for y in m['years']:
  if any(values[y,'SSS'][i]!=values[y,'1'][i]+values[y,'2'][i] for i in (0,1)):raise ValueError('Sex totals differ')
 if next(y for y in m['years'] if values[y,'2'][2]>values[y,'1'][2])!=1987:raise ValueError('Finding changed')
 for y,g,v in [(1908,'1','68.9'),(1908,'2','60.3'),(1966,'1','86.1'),(1966,'2','83.9'),(1983,'1','81.2'),(1983,'2','80.9'),(1987,'1','76.2'),(1987,'2','76.6'),(1983,'SSS','81'),(2023,'SSS','72')]:
  if values[y,g][2]!=D(v):raise ValueError('Benchmark changed')
 return m,canonical(s)

def reconcile(db,m):
 rows=db.execute('SELECT year,group_key,value FROM public__indicator_values WHERE series_key=? AND is_published=1 AND year BETWEEN 1908 AND 2023 ORDER BY year',[m['migrated_series_key']])
 if len(rows)!=20 or {(r['year'],r['group_key']) for r in rows}!={(int(y),'total') for y in m['migrated_rates']}:raise ValueError('Migrated scope changed')
 if any(r['value'] is None or D(str(r['value']))!=D(str(m['migrated_rates'][str(r['year'])])) for r in rows):raise ValueError('Migrated value changed')
 meta=db.execute('SELECT unit,title FROM public__indicator_series WHERE series_key=?',[m['migrated_series_key']])
 if len(meta)!=1 or meta[0]['unit']!='%' or 'vuosikirjan nimittäjä' not in meta[0]['title']:raise ValueError('Migrated denominator changed')
 return rows

def store(db):
 m,payload=reference();before=reconcile(db,m)
 db.execute('CREATE TABLE IF NOT EXISTS editorial__electoral_source_snapshots(version TEXT PRIMARY KEY,reference_sha256 TEXT NOT NULL,review_json TEXT NOT NULL,payload_json TEXT NOT NULL)')
 args=[m['version'],m['reference_sha256'],canonical(m),payload]
 db.execute('INSERT INTO editorial__electoral_source_snapshots VALUES(?,?,?,?) ON CONFLICT DO NOTHING',args)
 check(db)
 if reconcile(db,m)!=before:raise ValueError('Raw data changed')

def check(db):
 m,payload=reference();rows=db.execute('SELECT version,reference_sha256,review_json,payload_json FROM editorial__electoral_source_snapshots WHERE version=?',[m['version']])
 if rows!=[dict(version=m['version'],reference_sha256=m['reference_sha256'],review_json=canonical(m),payload_json=payload)]:raise ValueError('Reference readback differs')
 reconcile(db,m)

def main():
 b=json.load(sys.stdin);m,_=reference()
 if len(b['supplements'])!=1 or b['supplements'][0]['data_links'][0]['reference_sha256']!=m['reference_sha256']:raise ValueError('Article reference differs')
 db=RecordRemote()
 try:validate(db,b);store(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:check(db);validate(db,b);verify(db,b)
 finally:db.close()
 print('PASS electoral supplement: 1 article, 342 resident-reference cells, 20 migrated rates verified; fresh connection readback; original articles and raw series unchanged.')
if __name__=='__main__':main()
