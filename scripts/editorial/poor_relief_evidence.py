"""Historical administrative aid counts are not the prevalence of need or modern poverty."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources');YEARS=[1881,1883,1885,1887];GROUPS=['FI','historical_urban','historical_rural'];PERIODS=[[y,y] for y in YEARS]
def reference():
 p=ROOT/'poor-relief1881-1887-review.json';raw=p.read_text();r=json.loads(raw);cells=r['cells'];m={(c['year'],c['group_key'],c['measure']):D(c['value']) for c in cells};rate='reported_recipients_pct_of_population';count='reported_recipients_count'
 expected={(y,g,rate) for y in YEARS for g in GROUPS}|{(y,g,count) for y in [1881,1887] for g in GROUPS}
 if len(cells)!=18 or set(m)!=expected or r['publication_year']!=1891 or r['annual_series'] is not False:raise ValueError('Historical scope changed')
 for (y,g,k),v in m.items():
  if not v.is_finite() or v<0 or (k==rate and v>100) or (k==count and v!=v.to_integral_value()):raise ValueError('Invalid historical value')
 for y in [1881,1887]:
  if m[y,'FI',count]!=m[y,'historical_urban',count]+m[y,'historical_rural',count]:raise ValueError('Historical counts do not reconcile')
 if r['source_quality'].get('recipient_share_is_poverty_rate') is not False:raise ValueError('Invalid poverty interpretation')
 return r,digest(raw),m

def analysis():
 r,sha,m=reference();count=lambda y:format(int(m[y,'FI','reported_recipients_count']),',').replace(',',' ');pct=lambda y,g:str(m[y,g,'reported_recipients_pct_of_population'].quantize(D('.01'))).replace('.',',')
 finding=f"Tilastollisen päätoimiston julkaisu ilmoitti kunnallisen köyhäinhoidon avunsaajia {count(1881)} vuonna 1881 ja {count(1887)} vuonna 1887. Julkaistut osuudet väkiluvusta olivat koko maassa {pct(1881,'FI')} % ja {pct(1887,'FI')} %, kaupungeissa {pct(1881,'historical_urban')} % ja {pct(1887,'historical_urban')} % sekä maaseudulla {pct(1881,'historical_rural')} % ja {pct(1887,'historical_rural')} %. Välivuosista lähteessä on lisäksi vuoden 1883 ja 1885 luvut. Kyse on raportoidusta kunnallisen avun saamisesta, ei kaikista apua tarvinneista tai köyhyysrajan alittaneista ihmisistä."
 return dict(statistical_finding=finding,statistical_reference=dict(version=r['version'],reference_sha256=sha,pdf_sha256=r['pdf_sha256'],cells=r['cells'],source_quality=r['source_quality'],annual_series=False),data_links=[dict(source_table='editorial__article_evidence_supplements',series_key='historical.poor_relief.'+g+'.'+k,group_key=g,stored_years=YEARS if k.endswith('population') else [1881,1887],observations=4 if k.endswith('population') else 2,observation_period=[1881,1887],source_url=r['url'],reference_sha256=sha,role='reported_administrative_coverage_not_poverty_prevalence') for g in GROUPS for k in ['reported_recipients_pct_of_population','reported_recipients_count']])

def check_bundle(b):
 e=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in e.items()) or not any(x['finding']==e['statistical_finding'] for x in s['evidence']):raise ValueError('Historical source differs')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=PERIODS:raise ValueError('Sparse years changed')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS original poor-relief evidence: 1 article, 18 source values; 4 sparse historical years; historical urban/rural counts reconcile; source-quality limits preserved; fresh connection; originals unchanged.')
if __name__=='__main__':main()
