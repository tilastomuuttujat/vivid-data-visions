"""Article-linked electricity balances; preserve symbols and separate energy from capacity."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')
CODES=['SSS','1','1.1','1.4','2']
def number(v):
 if v=='-':return D(0) # Official table: '-' means none, not missing.
 n=D(v)
 if not n.is_finite():raise ValueError('Invalid source number')
 return n
def reference():
 p=ROOT/'electricity12sv-1960-1990.json';raw=p.read_text();receipt=json.loads(p.with_suffix('.receipt.json').read_text());s=json.loads(raw)
 if digest(raw)!=receipt['sha256']:raise ValueError('Source changed')
 if [c['code'] for c in s['columns']]!=['timeperiod_y','energia_30_20200915','maara_gwh']:raise ValueError('Source dimensions changed')
 rows=s['data'];m={(int(r['key'][0]),r['key'][1]):number(r['values'][0]) for r in rows}
 if len(rows)!=155 or set(m)!={(y,k) for y in range(1960,1991) for k in CODES}:raise ValueError('Source coverage changed')
 for y in range(1960,1991):
  if m[y,'SSS']<=0 or m[y,'1']<0 or not 0<=m[y,'1.1']<=m[y,'1'] or not 0<=m[y,'1.4']<=m[y,'1'] or abs(m[y,'1']+m[y,'2']-m[y,'SSS'])>1:raise ValueError('Electricity balance invalid')
 return s,receipt,m

def analysis():
 s,r,m=reference();fmt=lambda v:str(v.quantize(D('.1'))).replace('.',',');pct=lambda y,k:100*m[y,k]/m[y,'SSS']
 finding=f"Sähkön kokonaiskulutus nousi vuoden 1960 {fmt(m[1960,'SSS']/1000)} TWh:sta vuoden 1990 {fmt(m[1990,'SSS']/1000)} TWh:iin eli {fmt(m[1990,'SSS']/m[1960,'SSS'])}-kertaiseksi. Vesivoiman osuus kokonaiskulutuksesta muuttui {fmt(pct(1960,'1.1'))} prosentista {fmt(pct(1990,'1.1'))} prosenttiin. Vuonna 1990 ydinvoiman osuus kokonaiskulutuksesta oli {fmt(pct(1990,'1.4'))} % ja sähkön nettotuonnin {fmt(pct(1990,'2'))} %. Vesivoiman tuotanto silti kasvoi {fmt(m[1960,'1.1']/1000)} TWh:sta {fmt(m[1990,'1.1']/1000)} TWh:iin: pienempi osuus ei tässä tarkoita pienempää tuotantomäärää."
 links=[dict(source_table='editorial__article_evidence_supplements',series_key='fi.statfin12sv.'+k,group_key='FI',observation_period=[1960,1990],observations=31,stored_years=list(range(1960,1991)),source_url=r['url'],reference_sha256=r['sha256'],role='article_linked_frozen_reference_not_causal_evidence') for k in CODES]
 return dict(statistical_finding=finding,data_links=links,statistical_reference=dict(table='12sv',unit='GWh',scope='Finland',reference_sha256=r['sha256'],symbol_rules={'-':'none_zero','.':'missing_not_zero','..':'not_logically_applicable_not_zero'},cells=s['data']))

def check_bundle(b):
 expected=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in expected.items()) or not any(e['finding']==expected['statistical_finding'] for e in s['evidence']):raise ValueError('Article calculation differs')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=[[1960,1990]]:raise ValueError('Unscoped observation years')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS electricity article evidence: 1 article, 155 original source cells, 31 years, 5 measures; balances checked; fresh connection readback; original articles unchanged.')
if __name__=='__main__':main()
