"""COFOG tasks, age groups and fiscal sustainability are different concepts."""
import json,sys,re
from decimal import Decimal as D
from pathlib import Path
from articles import canonical,digest
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
from population_foundation import references,age
ROOT=Path(__file__).with_name('sources')/'population-fiscal';VERSION='population-fiscal-2026-11-06-v1'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_fiscal(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))'''
def source():
 raw=(ROOT/'12a6.json').read_text();meta=(ROOT/'12a6.metadata.json').read_text();receipt=json.loads((ROOT/'12a6.receipt.json').read_text())
 if digest(raw)!=receipt['sha256'] or digest(meta)!=receipt['metadata_sha256']:raise ValueError('Fiscal source digest differs')
 j=json.loads(raw);dims=[c['code'] for c in j['columns'] if c['type']!='c'];metrics=[c['code'] for c in j['columns'] if c['type']=='c'];points=[]
 for row in j['data']:
  d=dict(zip(dims,row['key']));sector=next(v for k,v in d.items() if k.startswith('sektori'));task=next(v for k,v in d.items() if k.startswith('julkisyht'))
  if sector!='S13' or d['taloustoimi_1_20180101']!='OTES':raise ValueError('Fiscal sector or consolidation changed')
  for metric,rawvalue in zip(metrics,row['values']):
   if not re.fullmatch(r'-?\d+(?:\.\d+)?',rawvalue) and rawvalue not in ['.','..','...','....']:raise ValueError('Unknown fiscal missing code')
   points.append(dict(year=int(d['timeperiod_y']),task=task,metric=metric,value=rawvalue if re.fullmatch(r'-?\d+(?:\.\d+)?',rawvalue) else None,raw=rawvalue))
 if len(points)!=2100 or len({(x['year'],x['task'],x['metric']) for x in points})!=2100:raise ValueError('Fiscal coverage differs')
 return dict(receipt=receipt,metadata=json.loads(meta),response=j,points=points)
def lookup(s,y,task,metric='jmete-cp'):
 rows=[x for x in s['points'] if x['year']==y and x['task']==task and x['metric']==metric]
 if len(rows)!=1 or rows[0]['value'] is None:raise ValueError('Unavailable fiscal value')
 return D(rows[0]['value'])
def validate_totals(s):
 for y in range(1990,2025):
  for metric,tol in [('jmete-cp',D('5')),('jmete-bkt_suhde',D('.5')),('percapita',D('5'))]:
   if abs(sum(lookup(s,y,'G'+str(k).zfill(2),metric) for k in range(1,11))-lookup(s,y,'SSS',metric))>tol:raise ValueError('Main fiscal tasks do not reconcile within source rounding')
  for x in [x for x in s['points'] if x['year']==y and len(x['task'])==5]:
   if (y<2001)!=(x['value'] is None):raise ValueError('Detailed fiscal source period differs')
  if y>=2001:
   for metric,tol in [('jmete-cp',D('4.5')),('jmete-bkt_suhde',D('.45')),('percapita',D('4.5'))]:
    if abs(sum(lookup(s,y,'G10'+str(k).zfill(2),metric) for k in range(1,10))-lookup(s,y,'G10',metric))>tol:raise ValueError('Social protection subtasks do not reconcile within rounding')
 return True

def analysis():
 s=source();validate_totals(s);refs=references();endpoints={}
 for y in [2001,2024]:
  endpoints[str(y)]={'social_protection_eur_m':str(lookup(s,y,'G10')),'old_age_eur_m':str(lookup(s,y,'G1002')),'social_protection_gdp_pct':str(lookup(s,y,'G10','jmete-bkt_suhde')),'old_age_gdp_pct':str(lookup(s,y,'G1002','jmete-bkt_suhde')),'health_gdp_pct':str(lookup(s,y,'G07','jmete-bkt_suhde')),'education_gdp_pct':str(lookup(s,y,'G09','jmete-bkt_suhde')),'old_age_share_of_social_protection_pct':str((100*lookup(s,y,'G1002')/lookup(s,y,'G10')).quantize(D('.1'))),'population65plus':int(age(refs,'11rc',y,65,110)),'provisional':y==2024}
 a,b=endpoints['2001'],endpoints['2024'];f=f"Julkisyhteisöjen sulautetut sosiaaliturvamenot (COFOG G10) olivat {a['social_protection_eur_m']} miljoonaa euroa vuonna 2001 ja {b['social_protection_eur_m']} miljoonaa euroa vuonna 2024 ennakkotietona. BKT-osuudet olivat lähteen mukaan {a['social_protection_gdp_pct']} ja {b['social_protection_gdp_pct']} %. Vanhuuden tehtäväluokan G1002 menot olivat vastaavasti {a['old_age_eur_m']} ja {b['old_age_eur_m']} miljoonaa euroa, ja niiden osuus G10-menoista oli pyöristettynä {a['old_age_share_of_social_protection_pct']} ja {b['old_age_share_of_social_protection_pct']} %. Eurot ovat käypähintaisia; muutosta ei nimetä reaalikasvuksi."
 pop=f"Vähintään 65-vuotiaita oli yhteisessä väestöpohjassa {a['population65plus']} vuonna 2001 ja {b['population65plus']} vuonna 2024. COFOG-tehtäväluokka ei kuitenkaan ole saajien ikäluokka: menoja ei jaeta tämän ikäryhmän määrällä etuudensaajakohtaiseksi kustannukseksi. Väestömäärän ja menojen samanaikainen kasvu ei erottele ikärakenteen, etuustason, indeksien, palvelujen tai muiden päätösten vaikutuksia."
 return dict(source=s,endpoints=endpoints,population_source_sha256=refs['11rc']['receipt']['sha256'],findings={'spending':f,'population':pop},method={'sector':'S13 consolidated general government, not only central government','transaction':'OTES consolidated expenditure','main_tasks_years':[1990,2024],'detailed_tasks_years':[2001,2024],'provisional_years':[2024],'nominal_money':True,'deflation_performed':False,'gdp_ratio_is_not_price_adjustment':True,'age_specific_recipient_cost_estimated':False,'demographic_cost_effect_identified':False,'causal_effect_identified':False,'fiscal_sustainability_estimated':False,'forecast':False})
def check_bundle(b):
 a=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!={'dac526d7-e658-593e-8512-1c52e5838cb4','3f654773-8325-5bcf-b078-4dc45b2423e7'}:raise ValueError('Two public finance articles required')
 for s in b['supplements']:
  if s.get('population_fiscal')!=a or s.get('period')!=[1990,2024] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Fiscal evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[1990,2024]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Fiscal claim binding differs')
  if not all(any(e['finding']==v for e in s['evidence']) for v in a['findings'].values()):raise ValueError('Fiscal findings differ')
def verify_source(db):
 if db.execute('SELECT payload_json FROM editorial__population_fiscal WHERE version=?',[VERSION])!=[dict(payload_json=canonical(analysis()))]:raise ValueError('Fiscal readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA);db.execute('INSERT INTO editorial__population_fiscal VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(analysis())]);verify_source(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_source(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-fiscal: consolidated S13 task accounts; pre-2001 detail missingness and source rounding preserved; nominal/GDP/age measures separated; 2 article links; fresh connection; originals unchanged.')
if __name__=='__main__':main()
