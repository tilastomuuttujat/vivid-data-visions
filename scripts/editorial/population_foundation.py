"""Shared, versioned demographic evidence; observations never become forecasts."""
import json,sys,re
from pathlib import Path
from decimal import Decimal
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')/'population-foundation'
VERSION='population-foundation-2026-11-06-v1'
BUNDLE_VERSION='article-population-links-2026-11-06-v2'
TABLES=['12dx','12dt','11rc','11ra','128t']
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_foundation(version TEXT NOT NULL,source_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,source_key))'''
def source(tab):
 raw=(ROOT/(tab+'.json')).read_text();meta=(ROOT/(tab+'.metadata.json')).read_text();receipt=json.loads((ROOT/(tab+'.receipt.json')).read_text())
 if digest(raw)!=receipt['sha256'] or digest(meta)!=receipt['metadata_sha256']:raise ValueError('Population source digest differs')
 j=json.loads(raw);dims=[x['code'] for x in j['columns'] if x['type']!='c'];metrics=[x['code'] for x in j['columns'] if x['type']=='c'];cells=[]
 for r in j['data']:
  if len(r['key'])!=len(dims) or len(r['values'])!=len(metrics):raise ValueError('Population shape differs')
  for code,value in zip(metrics,r['values']):
   numeric=bool(re.fullmatch(r'-?\d+(?:\.\d+)?',value))
   if not numeric and value not in ['.','..','...','....','.....']:raise ValueError('Unknown population missing marker')
   cells.append(dict(dimensions=dict(zip(dims,r['key'])),metric=code,raw=value,value=str(Decimal(value)) if numeric else None,kind=receipt['kind']))
 if len(cells)!=receipt['cells']:raise ValueError('Population cell count differs')
 return dict(method_review=json.loads((ROOT/'method-review.json').read_text()),receipt=receipt,columns=j['columns'],comments=j.get('comments',[]),metadata=j.get('metadata',[]),observations=cells)
def references():return {t:source(t) for t in TABLES}
def select(refs,tab,year,metric,**dims):
 found=[x for x in refs[tab]['observations'] if x['dimensions'].get('timeperiod_y')==str(year) and x['metric']==metric and all(x['dimensions'].get(k)==v for k,v in dims.items())]
 if len(found)!=1 or found[0]['value'] is None:raise ValueError('Missing population fact')
 return Decimal(found[0]['value'])
def age(refs,tab,year,start,end):
 obs=refs[tab]['observations'];agekey='ikaryhma_10_20180101'
 if tab=='11rc':
  m={x['dimensions'][agekey]:x for x in obs if x['dimensions']['timeperiod_y']==str(year)}
  keys=[k for k in m if k!='SSS' and int(k.split('-')[0])>=start and int(k.split('-')[0])<=end]
 else:
  m={x['dimensions'][agekey]:x for x in obs if x['dimensions']['timeperiod_y']==str(year)}
  keys=[k for k in m if k!='SSS' and start<=int(k.split('-')[0])<=end]
 if not keys or any(m[k]['value'] is None for k in keys):raise ValueError('Unavailable age composition')
 return sum(Decimal(m[k]['value']) for k in keys)
def facts(refs=None):
 r=refs or references();out={}
 for y in [1850,1868,1950,1990,2010,2016,2025]:
  out[str(y)]={m:str(select(r,'12dx',y,m)) for m in ['synt-vaesto','synt-vm01','synt-vm11','synt-luonvalisays']}
 out['fertility']={str(y):str(select(r,'12dt',y,'tfr')) for y in [1900,1950,2010,2024,2025]}
 out['ages']={}
 for tab,years in [('11rc',[1865,1950,1990,2025]),('128t',[2030,2040,2050])]:
  for y in years:
   groups={k:str(age(r,tab,y,a,b)) for k,a,b in [('under15',0,14),('15to64',15,64),('65plus',65,110)]}
   total=select(r,tab,y,'vaerak-vaesto' if tab=='11rc' else 'vaesto_e24',ikaryhma_10_20180101='SSS')
   if sum(Decimal(v) for v in groups.values())!=total:raise ValueError('Age groups do not reconcile')
   groups.update(total=str(total),kind='observed' if tab=='11rc' else 'projection_2024',dependency_ratio=str(((Decimal(groups['under15'])+Decimal(groups['65plus']))/Decimal(groups['15to64'])*100).quantize(Decimal('.1'))))
   out['ages'][str(y)]=groups
 out['migration2025']={m:str(select(r,'12dx',2025,m)) for m in ['synt-vm41','synt-vm42','synt-vm4142']}
 out['regional2025']=[]
 key=next(x for x in r['11ra']['observations'][0]['dimensions'] if x.startswith('alue_'))
 for area in sorted({x['dimensions'][key] for x in r['11ra']['observations']}):
  out['regional2025'].append(dict(area=area,population=str(select(r,'11ra',2025,'vaerak-vaesto',**{key:area})),over65_share=str(select(r,'11ra',2025,'vaesto_yli64_p',**{key:area}))))
 return out
GROUPS={'work','education','care','social_security','regions','public_finance'}
def check_bundle(b):
 r=references();f=facts(r)
 if b['version']!=BUNDLE_VERSION or len(b['supplements'])!=6 or {s.get('article_group') for s in b['supplements']}!=GROUPS:raise ValueError('Six population article groups required')
 for s in b['supplements']:
  if s.get('population_foundation')!={'version':VERSION,'source_keys':TABLES,'source_digests':{t:r[t]['receipt']['sha256'] for t in TABLES},'facts':f}:raise ValueError('Shared population reference differs')
  c=s['claim_classification']
  if any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',b['version'])]):raise ValueError('Population classification source differs')
  if s.get('period_linkage')!='exact_passage_only' or c.get('observation_periods')!=[[1850,2025]] or s.get('forecast_period')!=[2026,2050] or s.get('forecast_vintage')!=2024:raise ValueError('Observation and forecast separation required')
  if c.get('claim_type')!='mechanism_hypothesis' or s.get('causal_effect_identified') is not False:raise ValueError('Demographic context is not causal identification')
def apply_foundation(db,b):
 check_bundle(b);db.execute(SCHEMA)
 # Each snapshot is immutable; an existing version must match exactly.
 for tab,payload in references().items():
  db.execute('INSERT INTO editorial__population_foundation VALUES(?,?,?) ON CONFLICT DO NOTHING',[VERSION,tab,canonical(payload)])
 verify_foundation(db)
 apply(db,b)
def verify_foundation(db):
 rows=db.execute('SELECT source_key,payload_json FROM editorial__population_foundation WHERE version=? ORDER BY source_key',[VERSION])
 expected=[dict(source_key=t,payload_json=canonical(p)) for t,p in sorted(references().items())]
 if rows!=expected:raise ValueError('Population foundation readback differs')
def main():
 b=json.load(sys.stdin);db=RecordRemote()
 try:apply_foundation(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_foundation(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 r=references();numeric=sum(x['value'] is not None for p in r.values() for x in p['observations'])
 print('PASS population foundation: 5 official snapshots; '+str(numeric)+' numeric cells; 6 article groups; observed/2024-projection separation; age sums reconciled; fresh connection; originals unchanged.')
if __name__=='__main__':main()
