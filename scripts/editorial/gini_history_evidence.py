"""Preserve separate income concepts and data regimes; no interpolation or causal tax effect."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')
CODES=['SL1TJKT','4L1TJKT','6L1TJKT','SL1','4L1','6L1'];YEARS=[1966,1971,1976,1981]+list(range(1986,2025))
PERIODS=[[y,y] for y in YEARS[:4]]+[[1986,2024]]
def reference():
 p=ROOT/'gini11x3-1966-2024.json';raw=p.read_text();receipt=json.loads(p.with_suffix('.receipt.json').read_text());s=json.loads(raw)
 if digest(raw)!=receipt['sha256']:raise ValueError('Reference changed')
 if [c['code'] for c in s['columns']]!=['tulolaji_12_20190417','timeperiod_y','Gini']:raise ValueError('Dimensions changed')
 rows=s['data'];m={}
 for r in rows:
  k,y=r['key'];v=r['values'][0];m[k,int(y)]=None if v in ('....','...') else D(v)
 if len(rows)!=258 or set(m)!={(k,y) for k in CODES for y in YEARS}:raise ValueError('Coverage changed')
 if {key for key,v in m.items() if v is None}!=({(k,y) for k in CODES[:3] for y in YEARS[:4]}|{(k,2024) for k in CODES[3:]}):raise ValueError('Unavailable values changed')
 if any(v is not None and (not v.is_finite() or not 0<=v<=100) for v in m.values()):raise ValueError('Invalid Gini')
 return s,receipt,m

def analysis():
 s,r,m=reference();fmt=lambda v:str(v.quantize(D('.1'))).replace('.',',');get=lambda k,y:fmt(m[k,y])
 finding=f"Kulutustutkimukseen perustuvassa otossarjassa käytettävissä olevien rahatulojen Gini-kerroin oli {get('SL1',1966)} vuonna 1966 ja {get('SL1',1981)} vuonna 1981. Pitkän tarkastelun myöhemmässä ensisijaisessa sarjassa kerroin oli {get('SL1TJKT',1995)} vuonna 1995, {get('SL1TJKT',2007)} vuonna 2007 ja {get('SL1TJKT',2024)} vuonna 2024; vuosien 1995–2024 ero on {fmt(m['SL1TJKT',2024]-m['SL1TJKT',1995])} prosenttiyksikköä. Vuonna 2024 tuotannontekijätulojen Gini oli {get('4L1TJKT',2024)}, bruttorahatulojen {get('6L1TJKT',2024)} ja käytettävissä olevien rahatulojen {get('SL1TJKT',2024)}. Tulokäsitteet sisältävät myyntivoitot."
 return dict(statistical_finding=finding,statistical_reference=dict(table='11x3',unit='Gini_0_100',reference_sha256=r['sha256'],symbol_rules={'....':'not_obtained_not_zero','...':'confidential_not_zero'},cells=s['data']),data_links=[dict(source_table='editorial__article_evidence_supplements',series_key='fi.statfin11x3.'+k+'.Gini',group_key='FI',observation_period=[1986,2024] if k in CODES[:3] else [1966,2023],stored_years=list(range(1986,2025)) if k in CODES[:3] else YEARS[:-1],observations=39 if k in CODES[:3] else 42,source_url=r['url'],reference_sha256=r['sha256'],role='separate_income_concept_not_causal_effect') for k in CODES])

def check_bundle(b):
 e=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in e.items()) or not any(x['finding']==e['statistical_finding'] for x in s['evidence']):raise ValueError('Calculation changed')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=PERIODS:raise ValueError('Interpolation prohibited')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS Gini history evidence: 1 article; 258 preserved source cells, 243 numeric, 12 unavailable and 3 confidential; 6 separate income/data concepts; fresh connection readback; originals unchanged; no interpolation or causal attribution.')
if __name__=='__main__':main()
