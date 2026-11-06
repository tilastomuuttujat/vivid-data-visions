"""Population, registered employment and annual work volume are separate measures."""
import json,sys,itertools,importlib.util
from decimal import Decimal as D
from pathlib import Path
from articles import digest,canonical
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
ROOT=Path(__file__).resolve().parents[2];SOURCES=Path(__file__).with_name('sources')/'population-work'
VERSION='population-work-2026-11-06-v1'
PATHS={'115w':'src/components/kokonaiskuva/employment-age-data.json','15ai':'src/components/erotus-tuotanto/production-data.json'}
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_work(version TEXT NOT NULL,source_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,source_key))'''
def sources():
 out={}
 for tab,path in PATHS.items():
  raw=(SOURCES/(tab+'.json')).read_text();receipt=json.loads((SOURCES/(tab+'.receipt.json')).read_text());pinned=(ROOT/path).read_text()
  if digest(raw)!=receipt['sha256'] or digest(pinned)!=receipt['existing_atlas_sha256']:raise ValueError('Work source snapshot changed')
  p=json.loads(pinned);j=json.loads(raw)
  if tab=='115w':
   spec=importlib.util.spec_from_file_location('age_source',ROOT/'scripts/data/fetch-employment-age-effect.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
   groups=p['groups'];meta={'variables':[{'code':'ikaryhma_10_20180101','values':[x['id'] for x in groups],'valueTexts':[x['label'] for x in groups]}]}
   actual=mod.decode(meta,raw.encode(),receipt['query'])
   if actual['rows']!=p['rows']:raise ValueError('Registered employment reference differs')
  else:
   dims=[c['code'] for c in j['columns'] if c['type']!='c'];metrics=[c['code'] for c in j['columns'] if c['type']=='c'];want={('B1GMH','ntp-R2015P'):'gdp',('E1','ntp-TP2010'):'employed',('E2','ntp-MH2010'):'hours',('EP','ntp-TP'):'population'};rows={}
   for x in j['data']:
    d=dict(zip(dims,x['key']))
    for metric,value in zip(metrics,x['values']):
     name=want.get((d['taloustoimi_1_20180101'],metric))
     if name:
      if value in ['.','..','...','....','']:raise ValueError('Work volume source is missing')
      rows.setdefault(int(d['timeperiod_y']),{})[name]=D(value)
   if set(rows)!={x['year'] for x in p['points']}:raise ValueError('Work volume years differ')
   for x in p['points']:
    if any(rows[x['year']].get(k)!=D(str(x[k])) for k in ['gdp','employed','hours','population']):raise ValueError('Work volume reference differs')
  out[tab]={'receipt':receipt,'data':p,'original_response':j}
 return out

def employment_points(p,base_year=1990):
 rows=p['rows'];base=next(r for r in rows if r['year']==base_year);n=len(p['groups']);weights=[D(x)/base['totalPopulation'] for x in base['population']];result=[]
 for r in rows:
  if len(r['population'])!=n or len(r['employed'])!=n or sum(r['population'])!=r['totalPopulation'] or sum(r['employed'])!=r['totalEmployed'] or any(p<=0 or e<0 or e>p for p,e in zip(r['population'],r['employed'])):raise ValueError('Employment age identity fails')
  actual=100*D(r['totalEmployed'])/r['totalPopulation'];standard=100*sum(w*D(e)/pop for w,e,pop in zip(weights,r['employed'],r['population']))
  result.append(dict(year=r['year'],population=r['totalPopulation'],employed=r['totalEmployed'],employed_population_pct=str(actual),fixed_1990_age_weights_pct=str(standard),composition_gap_pp=str(actual-standard)))
 return result

def production_points(p):
 return [dict(year=x['year'],annual_domestic_employed_thousands=str(D(str(x['employed']))),hours_millions=str(D(str(x['hours']))),mean_population_thousands=str(D(str(x['population']))),hours_per_employed=str(D(str(x['hours']))*1000/D(str(x['employed']))),hours_per_resident=str(D(str(x['hours']))*1000/D(str(x['population'])))) for x in p['points']]

def analysis():
 r=sources();e=employment_points(r['115w']['data']);p=production_points(r['15ai']['data']);em={x['year']:x for x in e};pr={x['year']:x for x in p};a,b=em[1990],em[2024];pa,pb=pr[1990],pr[2024]
 pct=lambda x:str(D(str(x)).quantize(D('.1'))).replace('.',',')
 reg=f"Rekisteripohjaisessa työssäkäyntitilastossa työllisten osuus koko väestöstä oli {pct(a['employed_population_pct'])} % vuonna 1990 ja {pct(b['employed_population_pct'])} % vuonna 2024. Kun vuoden 2024 ikäryhmäkohtaiset työllisyysosuudet painotetaan vuoden 1990 väestön ikäjakaumalla, vertailuluku on {pct(b['fixed_1990_age_weights_pct'])} %. Toteuman ja tämän vertailuluvun ero on {pct(b['composition_gap_pp'])} prosenttiyksikköä. Kyse on laskennallisesta ikärakennevertailusta, ei väestön ikääntymisen kausaalivaikutuksesta tai vaihtoehtoisen historian ennusteesta."
 vol=f"Kansantalouden tilinpidossa vuotuinen työpanos oli {pa['hours_millions']} miljoonaa tuntia vuonna 1990 ja {pb['hours_millions']} miljoonaa tuntia vuonna 2024. Kotimaisia työllisiä oli vastaavasti {pa['annual_domestic_employed_thousands']} ja {pb['annual_domestic_employed_thousands']} tuhatta. Työtunteja työllistä kohti kertyi näistä laskettuna {pct(pa['hours_per_employed'])} ja {pct(pb['hours_per_employed'])}; asukasta kohti {pct(pa['hours_per_resident'])} ja {pct(pb['hours_per_resident'])}. Määrä, työllisten määrä ja keskimääräinen vuotuinen työpanos kuvaavat eri muutoksia."
 return dict(registered_employment=e,annual_work_volume=p,findings={'registered':reg,'volume':vol},method={'base_year':1990,'standardization':'sum of fixed 1990 whole-population age weights times each year registered employed/population within age group','identity':'actual - actual_1990 = (standardized - actual_1990) + (actual - standardized)','causal_effect_identified':False,'register_population':'all resident ages, end of year; registered employment reference week at end of year','national_accounts_population':'annual domestic employment, annual hours, annual mean resident population; distinct statistical concepts','forecast':False,'historical_extrapolation':False,'national_accounts_provisional_years':[2025],'limitations':'1990 is a chosen pre-recession comparison year, not a neutral trend baseline; registered employment classification changed in 2005; broad age groups leave within-group composition differences; accounting comparison does not identify policy effects.'},source_digests={t:r[t]['receipt']['sha256'] for t in r})

def check_bundle(b):
 expected=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2:raise ValueError('Two work and finance links required')
 if {x['article_id'] for x in b['supplements']}!={'2372b417-dc83-5067-be5a-7bfef51a7fa7','dac526d7-e658-593e-8512-1c52e5838cb4'}:raise ValueError('Unexpected work article')
 for s in b['supplements']:
  if s.get('population_work')!=expected or s.get('period')!=[1987,2024] or s.get('period_linkage')!='exact_passage_only':raise ValueError('Work evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[1987,2024]] or c.get('source_version')!=VERSION or c.get('article_revision')!=s['article_revision'] or c.get('body_sha256')!=s['body_sha256'] or s.get('causal_effect_identified') is not False:raise ValueError('Work classification differs')
  if not all(any(e['finding']==v for e in s['evidence']) for v in expected['findings'].values()):raise ValueError('Work findings changed')

def snapshot_payloads():return {t:{'source':s['receipt'],'data':s['data']} for t,s in sources().items()}
def verify_sources(db):
 expected=[dict(source_key=t,payload_json=canonical(s)) for t,s in sorted(snapshot_payloads().items())]
 if db.execute('SELECT source_key,payload_json FROM editorial__population_work WHERE version=? ORDER BY source_key',[VERSION])!=expected:raise ValueError('Work source readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA)
  for t,p in snapshot_payloads().items():db.execute('INSERT INTO editorial__population_work VALUES(?,?,?) ON CONFLICT DO NOTHING',[VERSION,t,canonical(p)])
  verify_sources(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_sources(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-work bridge: 2 existing atlas datasets rechecked; registered age cells and annual work volume kept separate; 2 article links; fixed 1990 weights; fresh connection; originals unchanged.')
if __name__=='__main__':main()
