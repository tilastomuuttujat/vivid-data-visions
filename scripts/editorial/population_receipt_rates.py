"""Published area receipt shares remain distinct from age risk and unmet need."""
import json,sys,statistics,math
from pathlib import Path
from articles import canonical,digest
from article_evidence import apply,validate,verify
from period_analysis import RecordRemote
VERSION='population-receipt-rates-2026-11-07-v1'
IDS={'33e4e43f-901c-573b-bbbc-b7e0ea177b60','36c65edb-0893-5c7a-8ba6-6cffda47a40f'}
SCHEMA='CREATE TABLE IF NOT EXISTS editorial__population_receipt_rates(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))'
def source():return json.loads(Path(__file__).with_name('sources').joinpath('population-receipt-rates.json').read_text())
def analysis():
 s=source();r=s['rows'];v=[x['published_percent'] for x in r]
 if s['year']!=2025 or len(r)!=292 or len({x['municipality'] for x in r})!=292 or any(type(x['recipients']) is not int or x['recipients']<0 or not isinstance(x['published_percent'],(int,float)) or not math.isfinite(x['published_percent']) or not 0<=x['published_percent']<=100 for x in r):raise ValueError('Published municipal scope differs')
 if s['national_annual_persons']!=365029 or sum(x['recipients'] for x in r)!=385901:raise ValueError('Receipt accounting changed')
 bins={'below_3':sum(x<3 for x in v),'3_to_below_6':sum(3<=x<6 for x in v),'6_to_below_9':sum(6<=x<9 for x in v),'at_least_9':sum(x>=9 for x in v)}
 findings={
 'distribution':f"Kelan vuoden 2025 julkaisun 292 kuntarivillä saajien julkaistu väestöosuus oli alle 3 prosenttia {bins['below_3']} kunnassa, 3–alle 6 prosenttia {bins['3_to_below_6']} kunnassa, 6–alle 9 prosenttia {bins['6_to_below_9']} kunnassa ja vähintään 9 prosenttia {bins['at_least_9']} kunnassa. Luokat ovat tämän tarkastelun toimituksellinen ryhmittely lähteen yhden desimaalin osuuksista.",
 'unit':f"Kuntien julkaistujen osuuksien painottamaton mediaani oli {statistics.median(v):.1f} prosenttia. Se kuvaa kuntajakauman keskikohtaa, ei koko väestön saajaosuutta: jokainen kunta saa saman painon asukasmäärästä riippumatta.",
 'nonadditivity':'Kuntarivien saajalukujen summa on 385901, kun julkaisun kansallinen vuotuinen henkilömäärä on 365029. Kuntarivejä ei siksi lasketa yhteen erillisten ihmisten kansalliseksi määräksi. Tässä eron syytä ei tunnisteta eikä kansallista osuutta rakenneta kuntaprosenttien keskiarvona.'}
 return dict(source=s,source_sha256=digest(canonical(s)),bins=bins,municipal_median_percent=statistics.median(v),findings=findings,method=dict(published_percent_preserved=True,percent_precision_decimals=1,geography='292 municipal rows in Kela 2025 publication; not all 308 Finnish municipalities',reference='annual 2025 recipients; source municipal share caption 31.12.2025 retained',age_rate_computed=False,denominator_backcalculated=False,age_standardization=False,municipal_counts_additive=False,population_weighted_rate_computed=False,non_take_up_estimated=False,causal_effect_identified=False,comparison_across_years=False))
def check_bundle(b):
 a=analysis()
 if b.get('version')!=VERSION or len(b.get('supplements',[]))!=2 or {s['article_id'] for s in b['supplements']}!=IDS:raise ValueError('Two specific article links required')
 for s in b['supplements']:
  c=s.get('claim_classification',{})
  if s.get('population_receipt_rates')!=a or s.get('id')!='published-municipal-receipt-shares' or s.get('period')!=[2025,2025] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Receipt evidence differs')
  if c.get('claim_type')!='mechanism_hypothesis' or c.get('observation_periods')!=[[2025,2025]] or any(c.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',VERSION)]):raise ValueError('Claim binding differs')
  if not all(any(e['finding']==v for e in s['evidence']) for v in a['findings'].values()):raise ValueError('Findings differ')
def verify_source(db):
 if db.execute('SELECT payload_json FROM editorial__population_receipt_rates WHERE version=?',[VERSION])!=[dict(payload_json=canonical(analysis()))]:raise ValueError('Source readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  validate(db,b);db.execute(SCHEMA);db.execute('INSERT INTO editorial__population_receipt_rates VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(analysis())]);verify_source(db);apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:verify_source(db);validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS population-receipt-rates: 292 published municipal shares; no inferred age denominator; nonadditive counts retained; 2 article links; fresh connection; originals unchanged.')
if __name__=='__main__':main()
