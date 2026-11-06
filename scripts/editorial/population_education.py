"""School-age population, pupil counts and educational outcomes remain distinct."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest,canonical
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
ROOT=Path(__file__).with_name('sources')/'population-education';VERSION='population-education-2026-11-06-v1';NAMES=['age-national','age-municipal','pupils']
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_education(version TEXT NOT NULL,source_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,source_key))'''
def sources():
 result={}
 for name in NAMES:
  raw=(ROOT/(name+'.json')).read_text();meta=(ROOT/(name+'.metadata.json')).read_text();r=json.loads((ROOT/(name+'.receipt.json')).read_text())
  if digest(raw)!=r['sha256'] or digest(meta)!=r['metadata_sha256']:raise ValueError('Education source digest differs')
  j=json.loads(raw);dims=[c['code'] for c in j['columns'] if c['type']!='c'];codes=[c['code'] for c in j['columns'] if c['type']=='c'];cells=[]
  if len(codes)!=1 or sum(len(x['values']) for x in j['data'])!=r['cells']:raise ValueError('Education source shape changed')
  for row in j['data']:
   if len(row['key'])!=len(dims) or len(row['values'])!=1 or not row['values'][0].isdigit():raise ValueError('Unavailable education count')
   cells.append(dict(dimensions=dict(zip(dims,row['key'])),value=int(row['values'][0])))
  keys=[canonical(c['dimensions']) for c in cells]
  if len(keys)!=len(set(keys)):raise ValueError('Duplicate education count')
  result[name]=dict(receipt=r,metadata=json.loads(meta),response=j,cells=cells)
 return result

def cohorts(cells):
 out={}
 for c in cells:
  d=c['dimensions'];area=next(d[k] for k in d if k.startswith('alue_'));key=(area,int(d['timeperiod_y']));age=int(d['ikaryhma_10_20180101']);out.setdefault(key,{})[age]=c['value']
 for counts in out.values():
  if set(counts)!=set(range(7,16)):raise ValueError('School ages incomplete')
 return {key:sum(v.values()) for key,v in out.items()}
def pupil_totals(cells):
 out={}
 for c in cells:
  d=c['dimensions'];out.setdefault(int(d['timeperiod_y']),{})[int(d['vluokka_2_20180101'])]=c['value']
 if any(set(v)!=set(range(1,10)) for v in out.values()):raise ValueError('Nine school grades required')
 return {str(y):dict(grades={str(k):n for k,n in v.items()},total=sum(v.values())) for y,v in sorted(out.items())}
def analysis():
 s=sources();national=cohorts(s['age-national']['cells']);municipal=cohorts(s['age-municipal']['cells']);pupils=pupil_totals(s['pupils']['cells']);areas=sorted({a for a,y in municipal if a!='SSS'});years=sorted(y for a,y in national if a=='SSS')
 if years!=list(range(1972,2026)) or len(areas)!=308 or set(pupils)!={str(y) for y in range(2020,2026)}:raise ValueError('Education coverage changed')
 for y in [1990,2025]:
  if sum(municipal[a,y] for a in areas)!=national['SSS',y] or municipal['SSS',y]!=national['SSS',y]:raise ValueError('Municipal school ages do not reconcile')
 regional=[dict(area=a,age7to15_1990=municipal[a,1990],age7to15_2025=municipal[a,2025],change=municipal[a,2025]-municipal[a,1990]) for a in areas];declining=sum(x['change']<0 for x in regional);growing=sum(x['change']>0 for x in regional);stable=sum(x['change']==0 for x in regional)
 pct=lambda a,b:str(((D(b)/a-1)*100).quantize(D('.1'))).replace('.',',')
 base=national['SSS',1990];last=national['SSS',2025];p0=pupils['2020'];p1=pupils['2025']
 finding=f"Vuoden lopun 7–15-vuotiaita oli koko maassa {base} vuonna 1990 ja {last} vuonna 2025; päätevuosien muutos oli {pct(base,last)} %. Samalla vuoden 2026 kuntajaolla tarkasteltuna määrä väheni {declining} kunnassa, kasvoi {growing} kunnassa ja pysyi samana {stable} kunnassa (yhteensä 308). Kansallinen muutos ei siten kuvaa kaikkien kuntien kehitystä."
 pupil_finding=f"Vuosiluokkien 1–9 oppilaita oli lähdetaulukossa yhteensä {p0['total']} vuonna 2020 ja {p1['total']} vuonna 2025. Ensimmäisellä vuosiluokalla oppilaita oli {p0['grades']['1']} ja {p1['grades']['1']}; yhdeksännellä {p0['grades']['9']} ja {p1['grades']['9']}. Nämä ovat vuosiluokittaisia oppilasmääriä, eivät samojen lasten seurantaa, koulutuspaikkojen kapasiteettia tai ikäluokan osallistumisastetta."
 return dict(national_age7to15=[dict(year=y,population=national['SSS',y]) for y in years],municipal_age7to15=regional,pupil_grade_counts=pupils,findings={'cohorts':finding,'pupils':pupil_finding},source_digests={k:v['receipt']['sha256'] for k,v in s.items()},method={'resident_population_reference':'31 December; age 7–15 on that date','pupil_reference':'20 September; grades 1–9, all institution types, both sexes combined; excluded preschool, preparatory education and home education categories','regional_geography':'1 January 2026 municipal division; preceding years exclude adjustments for partial municipal transfers','participation_rate_computed':False,'causal_effect_identified':False,'forecast':False,'same_cohort_followed':False,'school_capacity_measured':False})

def check_bundle(b):
 expected=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!={'804b66e5-1816-5761-ad2a-ab5662a21f61','db7169c2-6da5-5a11-94b6-116601424a7b'}:raise ValueError('Two education articles required')
 for s in b['supplements']:
  if s.get('population_education')!=expected or s.get('period')!=[1972,2025] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Education evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[1972,2025]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Education claim binding differs')
  if not all(any(e['finding']==f for e in s['evidence']) for f in expected['findings'].values()):raise ValueError('Education findings differ')

def payloads():return {k:{'receipt':v['receipt'],'metadata':v['metadata'],'response':v['response']} for k,v in sources().items()}
def verify_sources(db):
 expected=[dict(source_key=k,payload_json=canonical(v)) for k,v in sorted(payloads().items())]
 if db.execute('SELECT source_key,payload_json FROM editorial__population_education WHERE version=? ORDER BY source_key',[VERSION])!=expected:raise ValueError('Education readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA)
  for k,v in payloads().items():db.execute('INSERT INTO editorial__population_education VALUES(?,?,?) ON CONFLICT DO NOTHING',[VERSION,k,canonical(v)])
  verify_sources(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_sources(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-education: 54 national cohort years; 308 municipalities at two endpoints reconciled; 6 years of nine actual grades; 2 article links; no attendance-rate or capacity inference; fresh connection; originals unchanged.')
if __name__=='__main__':main()
