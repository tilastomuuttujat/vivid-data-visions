"""Annual benefit receipt is distinct from eligibility, need and non-take-up."""
import json,sys
from pathlib import Path
from articles import canonical,digest
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
ROOT=Path(__file__).with_name('sources')/'population-security';VERSION='population-security-2026-11-06-v1'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_security(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))'''
def sources():return {str(y):json.loads((ROOT/(str(y)+'.json')).read_text()) for y in [2024,2025]}
def analysis():
 r=sources();points=[]
 for y,s in r.items():
  rows=s['age_by_sex'];ages=[str(a)+'–'+str(a+4) for a in range(0,85,5)]+['85–']
  if len(rows)!=36 or {(x['sex'],x['age']) for x in rows}!={(sex,a) for sex in ['Miehet','Naiset'] for a in ages} or any(type(x['recipients']) is not int or x['recipients']<0 for x in rows):raise ValueError('Benefit age scope differs')
  byage={a:sum(x['recipients'] for x in rows if x['age']==a) for a in ages};house=s['household_national']
  if len(house)!=6 or sum(house[1:])!=house[0]:raise ValueError('Benefit household accounting differs')
  points.append(dict(year=int(y),age_recipients=byage,total_persons=sum(byage.values()),total_households=house[0],single_living_households=house[1],other_one_person_households=house[2],childless_couples=house[3],two_parent_households=house[4],single_parent_households=house[5]))
 a,b=points;find=f"Kelan perustoimeentulotukijulkaisun ikä- ja sukupuolitaulukon yhteenlaskettu saajahenkilömäärä oli {a['total_persons']} vuonna 2024 ja {b['total_persons']} vuonna 2025. 20–24-vuotiaita saajia oli vastaavasti {a['age_recipients']['20–24']} ja {b['age_recipients']['20–24']}. Kyse on kahden vuoden ikäryhmittäisistä saajista, ei samojen henkilöiden seurannasta tai ryhmien etuusoikeuden vertailusta."
 house=f"Saajakotitalouksia oli {a['total_households']} vuonna 2024 ja {b['total_households']} vuonna 2025. Vuoden 2025 kotitalouksista {b['single_living_households']} oli yksin asuvia ja {b['single_parent_households']} yksinhuoltajaperheitä. Henkilöt ja kotitaloudet ovat eri laskentayksiköitä. Kotitalouden tyyppi määräytyy lähteessä vuoden viimeisen perustoimeentulotuen maksun mukaan."
 return dict(points=points,source_snapshots=r,source_digests={y:digest(canonical(s)) for y,s in r.items()},findings={'age':find,'household':house},method={'annual_receipt':True,'individual_longitudinal_followup':False,'eligibility_estimated':False,'non_take_up_estimated':False,'population_rate_computed':False,'age_standardization_performed':False,'benefit_forecast':False,'causal_effect_identified':False,'scope':'Kela basic social assistance; not supplementary or preventive assistance and not all social benefits; report geography retained','denominator_rule':'No division by the foundation whole-Finland year-end population: consistent geography, age at reference date, unknown groups and annual exposure must first be checked.'})
def check_bundle(b):
 a=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!={'33e4e43f-901c-573b-bbbc-b7e0ea177b60','36c65edb-0893-5c7a-8ba6-6cffda47a40f'}:raise ValueError('Two social security articles required')
 for s in b['supplements']:
  if s.get('population_security')!=a or s.get('period')!=[2024,2025] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Benefit evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[2024,2025]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Benefit claim binding differs')
  if not all(any(e['finding']==v for e in s['evidence']) for v in a['findings'].values()):raise ValueError('Benefit findings differ')
def verify_source(db):
 if db.execute('SELECT payload_json FROM editorial__population_security WHERE version=?',[VERSION])!=[dict(payload_json=canonical(analysis()))]:raise ValueError('Benefit source readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA);db.execute('INSERT INTO editorial__population_security VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(analysis())]);verify_source(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_source(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-security: 72 official age/sex cells; two years of household totals reconciled; 2 article links; no eligibility, non-take-up or population-rate inference; fresh connection; originals unchanged.')
if __name__=='__main__':main()
