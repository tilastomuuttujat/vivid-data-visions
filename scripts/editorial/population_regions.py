"""Regional demographic accounting is not a causal explanation of migration."""
import json,sys
from pathlib import Path
from articles import canonical,digest
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
from population_foundation import references,select
VERSION='population-regions-2026-11-06-v1';SOURCE=Path(__file__).with_name('sources')/'population-regions.json'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__population_regions(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))'''
def source():return json.loads(SOURCE.read_text())
def verify_accounting(s):
 rows=s['rows'];regions={x['region'] for x in rows};keys={(x['region'],x['year']) for x in rows};country={x['year']:x for x in s['country']}
 if len(rows)!=684 or len(keys)!=len(rows) or len(regions)!=19 or keys!={(r,y) for r in regions for y in range(1990,2026)} or set(country)!=set(range(1990,2026)):raise ValueError('Regional coverage differs')
 for x in rows+list(country.values()):
  if x['synt-vm01']-x['synt-vm11']!=x['synt-luonvalisays'] or x['synt-vm41']-x['synt-vm42']!=x['synt-vm4142']:raise ValueError('Natural/migration accounting differs')
  if x['synt-vm43_netto']+x['synt-vm4142']!=x['synt-koknetmuutto'] or x['synt-luonvalisays']+x['synt-koknetmuutto']!=x['synt-valisays'] or x['synt-valisays']+x['synt-vakorjaus']!=x['synt-kokmuutos']:raise ValueError('Regional population accounting differs')
 for y,c in country.items():
  for k in s['metrics']:
   if sum(x[k] for x in rows if x['year']==y)!=c[k]:raise ValueError('Regional totals differ from national source')
  if c['synt-vm43_netto']!=0:raise ValueError('Domestic net migration does not cancel')
 # Independently reconcile all region-year population totals to the shared 11ra input.
 refs=references();key=next(k for k in refs['11ra']['observations'][0]['dimensions'] if k.startswith('alue_'))
 for x in rows:
  if x['synt-vaesto']!=select(refs,'11ra',x['year'],'vaerak-vaesto',**{key:x['region']}):raise ValueError('Regional population differs from foundation')
 for x in rows:
  previous=next((p for p in rows if p['region']==x['region'] and p['year']==x['year']-1),None)
  if previous and x['synt-vaesto']-previous['synt-vaesto']!=x['synt-kokmuutos']:raise ValueError('Population stock and annual change differ')
 return True

def analysis():
 s=source();verify_accounting(s);rows=[x for x in s['rows'] if x['year']==2025];c=next(x for x in s['country'] if x['year']==2025)
 counts={'natural_negative':sum(x['synt-luonvalisays']<0 for x in rows),'domestic_net_positive':sum(x['synt-vm43_netto']>0 for x in rows),'international_net_positive':sum(x['synt-vm4142']>0 for x in rows),'population_growing':sum(x['synt-kokmuutos']>0 for x in rows),'population_declining':sum(x['synt-kokmuutos']<0 for x in rows)}
 f=f"Vuonna 2025 luonnollinen väestönlisäys oli negatiivinen {counts['natural_negative']} maakunnassa 19:stä. Kuntien välinen nettomuutto oli maakuntasummana positiivinen {counts['domestic_net_positive']} maakunnassa ja nettomaahanmuutto positiivinen {counts['international_net_positive']} maakunnassa. Kokonaisväkiluku kasvoi {counts['population_growing']} maakunnassa ja väheni {counts['population_declining']} maakunnassa. Nämä ovat saman vuoden komponentteja, eivät muuttamisen motiivien tai koetun yhteisöllisyyden mittareita."
 country=f"Koko maan vuoden 2025 väkiluvun muutos oli {c['synt-kokmuutos']}: luonnollinen lisäys {c['synt-luonvalisays']}, nettomaahanmuutto {c['synt-vm4142']} ja väkiluvun korjaus {c['synt-vakorjaus']}. Kuntien väliset nettomuutot kumoutuvat koko maan tasolla. Korjauserää ei siirretä syntyvyydeksi tai muuttoliikkeeksi."
 return dict(source=s,source_digest=digest(canonical(s)),counts2025=counts,findings={'regional':f,'country':country},method={'years':[1990,2025],'geography_vintage':2026,'municipalities':308,'regions':19,'flows_and_stocks_reconciled':True,'crosscheck_population_source':'shared population foundation 11ra, all 684 region-years','migration_motives_identified':False,'unique_migrants_counted':False,'causal_effect_identified':False,'loneliness_measured':False,'forecast':False})
def check_bundle(b):
 a=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!={'855bfd25-c957-5425-9858-c18685e49c27','2372b417-dc83-5067-be5a-7bfef51a7fa7'}:raise ValueError('Two regional article links required')
 for s in b['supplements']:
  if s.get('population_regions')!=a or s.get('period')!=[1990,2025] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Regional evidence differs')
  c=s['claim_classification']
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[1990,2025]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Regional claim binding differs')
  if not all(any(e['finding']==v for e in s['evidence']) for v in a['findings'].values()):raise ValueError('Regional findings differ')
def verify_source(db):
 if db.execute('SELECT payload_json FROM editorial__population_regions WHERE version=?',[VERSION])!=[dict(payload_json=canonical(analysis()))]:raise ValueError('Regional readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  db.execute(SCHEMA);db.execute('INSERT INTO editorial__population_regions VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(analysis())]);verify_source(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_source(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-regions: official 308-municipality mapping; 684 region-year accounts; national flows and corrections reconciled; independent 11ra population crosscheck; 2 article links; fresh connection; originals unchanged.')
if __name__=='__main__':main()
