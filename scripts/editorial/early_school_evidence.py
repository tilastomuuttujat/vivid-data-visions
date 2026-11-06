"""School-year reporting snapshots, not school-age participation rates or curriculum effects."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources');PERIODS=[[1871,1872],[1875,1876],[1885,1886]]
def reference():
 p=ROOT/'early-school1871-1886-review.json';raw=p.read_text();r=json.loads(raw);rows=r['rows'];m={(x['period'],x['group_key']):x for x in rows}
 if len(rows)!=6 or set(m)!={(str(a)+'-'+str(b),g) for a,b in PERIODS for g in ['historical_urban','historical_rural']}:raise ValueError('Historical school scope changed')
 for x in rows:
  if x['period']!=str(x['start'])+'-'+str(x['end']) or any(type(x[k]) is not int or x[k]<0 for k in ['boys','girls','total']) or x['boys']+x['girls']!=x['total']:raise ValueError('School-year or sex totals invalid')
 if r['annual_calendar_series'] is not False or r['source_quality']['population_school_age_denominator_available'] is not False:raise ValueError('Invalid participation interpretation')
 return r,digest(raw),m

def analysis():
 r,sha,m=reference();count=lambda n:format(n,',').replace(',',' ');pct=lambda x:str((D(x['girls'])/D(x['total'])*100).quantize(D('.1'))).replace('.',',');u=m['1885-1886','historical_urban'];v=m['1885-1886','historical_rural']
 finding=f"Koulutoimen Ylihallituksen raportin kaupunkitaulussa oppilaita ilmoitettiin {count(m['1871-1872','historical_urban']['total'])} lukuvuonna 1871–1872, {count(m['1875-1876','historical_urban']['total'])} lukuvuonna 1875–1876 ja {count(u['total'])} lukuvuonna 1885–1886. Maaseudun taulun vastaavat määrät olivat {count(m['1871-1872','historical_rural']['total'])}, {count(m['1875-1876','historical_rural']['total'])} ja {count(v['total'])}. Viimeisen vertailulukuvuoden ilmoitetuista oppilaista tyttöjä oli kaupunkitaulussa {pct(u)} % ja maaseututaulussa {pct(v)} %. Nämä ovat raportoitujen oppilaiden määriä ja jakaumia, eivät kouluiässä olevien lasten osallistumisasteita."
 return dict(statistical_finding=finding,statistical_reference=dict(version=r['version'],reference_sha256=sha,pdf_sha256=r['pdf_sha256'],rows=r['rows'],source_quality=r['source_quality'],unit=r['unit'],annual_calendar_series=False),data_links=[dict(source_table='editorial__article_evidence_supplements',series_key='historical.school_pupils.'+g+'.'+sex,group_key=g,stored_periods=['1871-1872','1875-1876','1885-1886'],observations=3,observation_period=[1871,1886],source_url=r['url'],reference_sha256=sha,role='reported_school_year_counts_not_population_enrolment_rate') for g in ['historical_urban','historical_rural'] for sex in ['boys','girls','total']])

def check_bundle(b):
 e=analysis()
 if len(b['supplements'])!=1:raise ValueError('Unexpected batch')
 s=b['supplements'][0]
 if any(s.get(k)!=v for k,v in e.items()) or not any(x['finding']==e['statistical_finding'] for x in s['evidence']):raise ValueError('School source differs')
 if s.get('period_linkage')!='exact_passage_only' or s['claim_classification']['observation_periods']!=PERIODS:raise ValueError('School-year interpolation prohibited')

def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify(db,b);check_bundle(b)
 finally:db.close()
 print('PASS early-school evidence: 1 article, 18 source counts, 3 school years; sex totals reconcile; original scope exclusions preserved; fresh connection; originals unchanged.')
if __name__=='__main__':main()
