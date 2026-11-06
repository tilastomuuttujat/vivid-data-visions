"""Oldest age groups, realised homecare use and conditional projections differ."""
import json,sys
from pathlib import Path
from articles import digest,canonical
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
from population_foundation import references,age,select
VERSION='population-care-2026-11-06-v1';REVIEW=Path(__file__).with_name('sources')/'homecare2025-review.json'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_care(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))'''
def analysis():
 r=references();review=json.loads(REVIEW.read_text());points=[]
 for tab,years in [('11rc',range(1865,2026)),('128t',range(2026,2051))]:
  for y in years:
   a,b,c=(int(age(r,tab,y,start,end)) for start,end in [(65,74),(75,84),(85,110)])
   if a+b+c!=int(age(r,tab,y,65,110)):raise ValueError('Oldest age partitions differ')
   points.append(dict(year=y,age65to74=a,age75to84=b,age85plus=c,age75plus=b+c,age65plus=a+b+c,kind='observed' if tab=='11rc' else 'projection_2024'))
 p={x['year']:x for x in points};a=p[2025];b=p[2050]
 if review['year']!=2025 or review['regular_clients_75plus_rounded']!=88000 or review['coverage_75plus_published_percent']!=13 or review['fulltext_checked'] is not True:raise ValueError('Homecare reference differs')
 historical=f"Vuonna 1950 vähintään 75-vuotiaita oli {p[1950]['age75plus']} ja vähintään 85-vuotiaita {p[1950]['age85plus']}. Vuonna 1990 vastaavat määrät olivat {p[1990]['age75plus']} ja {p[1990]['age85plus']}, vuonna 2025 {a['age75plus']} ja {a['age85plus']}. Ikäryhmät ovat sisäkkäisiä: 85 vuotta täyttäneet sisältyvät 75 vuotta täyttäneisiin."
 future=f"Tilastokeskuksen vuoden 2024 ehdollisessa ennusteessa vähintään 75-vuotiaita olisi {b['age75plus']} ja vähintään 85-vuotiaita {b['age85plus']} vuonna 2050. Jälkimmäinen määrä olisi yli kaksinkertainen vuoden 2025 toteumaan verrattuna. Ennusteen oletuksina ovat kokonaishedelmällisyysluku 1,26, nettomaahanmuutto 40 000 vuodessa vuodesta 2026 ja aleneva ikäkohtainen kuolleisuus. Ennustetta ei ole laskettu uudelleen vuoden 2025 toteumasta. Väestömäärä ei ole hoivan tarpeen tai menojen ennuste."
 service=f"THL:n vuoden 2025 kotihoitoraportin sivulla 2 kotihoidon asiakkaita oli 163 055 ja säännöllisen kotihoidon asiakkaita 110 479. Säännöllistä kotihoitoa sai 88 000 vähintään 75-vuotiasta eli lähteen mukaan 13 % samanikäisestä väestöstä. Nämä ovat vuoden aikana palvelua saaneita, eivät tietyn päivän asiakaskanta tai kaikki apua tarvitsevat. Saman raportin vertailussa säännöllisten asiakkaiden määrä kasvoi 2 253 henkilöllä vuoteen 2024 verrattuna, mutta raportin mukaan kasvua selittää osaltaan kattavampi ostopalvelutietojen toimittaminen. Raportti kuvaa julkisesti järjestettyä kotihoitoa, ja tiedoissa on edelleen puutteita. Palvelujen käyttö ei mittaa täyttymätöntä avuntarvetta eikä läheisten työtunteja."
 return dict(age_points=points,homecare_review=review,findings={'historical':historical,'projection':future,'services':service},source_digests={t:r[t]['receipt']['sha256'] for t in ['11rc','128t']},method={'disjoint_age_groups':['65–74','75–84','85+'],'nested_age_groups':['65+','75+','85+'],'observed_period':[1865,2025],'projection_period':[2026,2050],'projection_vintage':2024,'care_need_estimated':False,'future_coverage_held_constant':False,'unpaid_care_estimated':False,'causal_effect_identified':False})
def check_bundle(b):
 expected=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!={'be9ee685-6d5f-52c3-9d3a-d36c9b13918c','3134a926-f6af-5b71-afae-94f0ab4f18b0'}:raise ValueError('Two care article links required')
 for s in b['supplements']:
  if s.get('population_care')!=expected or s.get('period_linkage')!='exact_passage_only' or s.get('forecast_period')!=[2026,2050] or s.get('causal_effect_identified') is not False:raise ValueError('Care evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[1865,2025]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Care claim binding differs')
  if not all(any(e['finding']==f for e in s['evidence']) for f in expected['findings'].values()):raise ValueError('Care findings differ')
def verify_source(db):
 if db.execute('SELECT payload_json FROM editorial__population_care WHERE version=?',[VERSION])!=[dict(payload_json=canonical(analysis()))]:raise ValueError('Care reference readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA);db.execute('INSERT INTO editorial__population_care VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(analysis())]);verify_source(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_source(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-care: observed 75+/85+ history; separate 2024 projection; original THL 2025 report checked; 2 exact article links; no care-need or unpaid-work inference; fresh connection; originals unchanged.')
if __name__=='__main__':main()
