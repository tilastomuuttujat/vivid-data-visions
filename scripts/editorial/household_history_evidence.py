"""Household counts are neither population shares nor loneliness prevalence."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources');CODES=['SSS','1','2','3','4','5','6','7']
def reference():
 p=ROOT/'households116a-1985-2024.json';raw=p.read_text();r=json.loads(p.with_suffix('.receipt.json').read_text());s=json.loads(raw)
 if digest(raw)!=r['sha256']:raise ValueError('Reference changed')
 if [c['code'] for c in s['columns']]!=['Vuosi','Talotyyppi','Alue','Asuntokunnan koko','Lkm']:raise ValueError('Dimensions changed')
 m={}
 for row in s['data']:
  y,building,area,size=row['key'];v=D(row['values'][0])
  if building!='SSS' or area!='SSS' or not v.is_finite() or v<0 or v!=v.to_integral_value():raise ValueError('Invalid household count or scope')
  m[int(y),size]=v
 if len(s['data'])!=320 or set(m)!={(y,k) for y in range(1985,2025) for k in CODES}:raise ValueError('Coverage changed')
 for y in range(1985,2025):
  if m[y,'SSS']<=0 or sum(m[y,k] for k in CODES[1:])!=m[y,'SSS']:raise ValueError('Size categories do not sum to total')
 return s,r,m

def analysis():
 s,r,m=reference();fmt=lambda v:str(v.quantize(D('.1'))).replace('.',',');count=lambda v:format(int(v),',').replace(',',' ');share=lambda y,k:100*m[y,k]/m[y,'SSS'];large=lambda y:100*sum(m[y,k] for k in CODES[3:])/m[y,'SSS']
 finding=f"Yhden henkilön asuntokuntia oli vuonna 1985 {count(m[1985,'1'])}, vuonna 2000 {count(m[2000,'1'])} ja vuonna 2024 {count(m[2024,'1'])}. Niiden osuus kaikista asuntokunnista nousi vastaavasti {fmt(share(1985,'1'))} prosentista {fmt(share(2000,'1'))} prosenttiin ja {fmt(share(2024,'1'))} prosenttiin. Vähintään kolmen henkilön asuntokuntien osuus pieneni vuoden 1985 {fmt(large(1985))} prosentista vuoden 2024 {fmt(large(2024))} prosenttiin. Nimittäjä on asuntokuntien lukumäärä, ei henkilöiden määrä."
 return dict(statistical_finding=finding,statistical_reference=dict(table='116a_2024_archive',unit='household_dwelling_units',reference_sha256=r['sha256'],scope=dict(area='SSS',building_type='SSS'),exclusive_size_groups=CODES[1:],last_group='7_or_more_persons',cells=s['data']),data_links=[dict(source_table='editorial__article_evidence_supplements',series_key='fi.statfinpas116a.households.size_'+k,group_key='FI',observation_period=[1985,2024],stored_years=list(range(1985,2025)),observations=40,source_url=r['url'],reference_sha256=r['sha256'],role='household_structure_not_loneliness_measure') for k in CODES])

def check_bundle(b):
 e=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in e.items()) or not any(x['finding']==e['statistical_finding'] for x in s['evidence']):raise ValueError('Article calculation differs')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=[[1985,2024]]:raise ValueError('Unscoped observation years')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS household history evidence: 1 article, 320 source cells, 40 years; size groups sum to totals; fresh connection readback; originals unchanged; no loneliness or causal attribution.')
if __name__=='__main__':main()
