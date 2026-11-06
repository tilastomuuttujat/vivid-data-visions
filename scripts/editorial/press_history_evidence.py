"""Historical publication-title snapshots are not readership or viewpoint counts."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources');LANGS=['finnish','swedish','finnish_swedish','german','russian'];YEARS=[1886,1895,1900,1905,1909];PERIODS=[[y,y] for y in YEARS]
def reference():
 p=ROOT/'press1886-1909-review.json';raw=p.read_text();r=json.loads(raw);rows=r['rows'];m={(x['year'],x['scope']):x for x in rows}
 if len(rows)!=6 or set(m)!={(y,'all_newspapers_and_periodicals') for y in YEARS}|{(1909,'historical_political_newspapers')}:raise ValueError('Press scope changed')
 for x in rows:
  if any(type(x[k]) is not int or x[k]<0 for k in ['total']+LANGS) or sum(x[k] for k in LANGS)!=x['total']:raise ValueError('Language totals differ')
 if r['annual_total_series'] is not False or r['source_quality']['readership_or_circulation_available'] is not False:raise ValueError('Invalid readership interpretation')
 return r,digest(raw),m

def analysis():
 r,sha,m=reference();a=m[1886,'all_newspapers_and_periodicals'];b=m[1909,'all_newspapers_and_periodicals'];p=m[1909,'historical_political_newspapers'];pct=lambda x:str((D(x['finnish'])/x['total']*100).quantize(D('.1'))).replace('.',',')
 finding=f"Vuoden 1910 vuosikirjan taulukossa sanomalehtien ja aikakauskirjojen yhteismäärä oli {a['total']} vuoden 1886 havaintohetkellä, {m[1895,'all_newspapers_and_periodicals']['total']} vuonna 1895, {m[1900,'all_newspapers_and_periodicals']['total']} vuonna 1900, {m[1905,'all_newspapers_and_periodicals']['total']} vuonna 1905 ja {b['total']} marraskuussa 1909. Lähteen suomenkieliseksi luokittelemien nimikkeiden määrä muuttui {a['finnish']}:sta {b['finnish']}:ään ja osuus {pct(a)} prosentista {pct(b)} prosenttiin. Vuoden 1909 kokonaismäärästä {p['total']} oli erikseen luokiteltu valtiollisiksi sanomalehdiksi, joista {p['finnish']} suomenkielisiksi, {p['swedish']} ruotsinkielisiksi ja {p['russian']} venäjänkieliseksi."
 return dict(statistical_finding=finding,statistical_reference=dict(version=r['version'],reference_sha256=sha,pdf_sha256=r['pdf_sha256'],rows=r['rows'],unit=r['unit'],source_quality=r['source_quality'],annual_total_series=False),data_links=[dict(source_table='editorial__article_evidence_supplements',series_key='historical.press.'+k,group_key='historical_Finland_all_titles',stored_years=YEARS,observations=5,observation_period=[1886,1909],source_url=r['url'],reference_sha256=sha,role='publication_supply_not_readership_or_pluralism') for k in ['total']+LANGS])

def check_bundle(b):
 e=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in e.items()) or not any(x['finding']==e['statistical_finding'] for x in s['evidence']):raise ValueError('Press source differs')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=PERIODS:raise ValueError('Snapshot interpolation prohibited')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS historical press evidence: 1 article, 36 original title counts; 5 snapshots; newspaper/periodical distinction and language totals checked; fresh connection; originals unchanged.')
if __name__=='__main__':main()
