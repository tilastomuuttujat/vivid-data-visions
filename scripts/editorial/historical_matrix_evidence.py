"""Target historical matrix gaps with verified series; keep articles and raw imports immutable."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')
SECTORS={'SSS':'total','A':'a','BTE':'b_e','F':'f','GTT':'g_t'}
def fmt(v):return str(D(v).quantize(D('0.1'))).replace('.',',')
def reference(name):
 if name=='school-region-sex-1920-1930':
  b=json.loads(Path(__file__).with_name('historical-school-review.json').read_text());cells=[dict(series_key=c['series_key'],year=c['year'],group_key=c['group_key'],value=c['value'],period=c['period']) for c in b['cells'] if c['series_key'].endswith('.literacy_school')]
  if len(cells)!=10:raise ValueError('School scope changed')
  return cells,dict(**b['source'],reference_version=b['version'])
 if name not in ('labour-years-1860-1959','public-volume-1860-1945'):raise ValueError('Unknown reference')
 p=ROOT/('matrix15ai-'+name+'.json');raw=p.read_bytes();receipt=json.loads(p.with_suffix('.receipt.json').read_text())
 if digest(raw.decode())!=receipt['sha256']:raise ValueError('Reference changed')
 data=json.loads(raw);columns=[c['code'] for c in data['columns']]
 expected_unit='ntp-TWY' if name.startswith('labour') else 'ntp-VOLIND'
 if columns!=['timeperiod_y','toimiala_79_20180101','taloustoimi_1_20180101',expected_unit]:raise ValueError('Reference dimensions changed')
 cells=[]
 for r in data['data']:
  y,sector,transaction=r['key'];v=r['values'][0]
  if not D(v).is_finite():raise ValueError('Nonfinite value')
  if transaction!=('E2' if name.startswith('labour') else 'P3KS13'):raise ValueError('Reference transaction changed')
  key='fi.statfin15ai.'+SECTORS[sector]+'.e2.44b95f3002' if name.startswith('labour') else 'fi.statfin15ai.total.p3ks13.eb971a1c0a'
  cells.append(dict(series_key=key,year=int(y),group_key='FI',value=v,period=y))
 expected={(k,y,'FI') for k in ({c['series_key'] for c in cells}) for y in range(1860,1960 if name.startswith('labour') else 1946)}
 if len(cells)!=(500 if name.startswith('labour') else 86) or {(c['series_key'],c['year'],c['group_key']) for c in cells}!=expected:raise ValueError('Reference coverage changed')
 return cells,receipt

def analysis(name):
 cells,src=reference(name);m={(c['series_key'],c['year'],c['group_key']):D(c['value']) for c in cells}
 if name.startswith('labour'):
  get=lambda s,y:m['fi.statfin15ai.'+s+'.e2.44b95f3002',y,'FI'];bench=[]
  for y in [1860,1913,1959]:bench.append(dict(year=y,agriculture_share_pct=str(get('a',y)/get('total',y)*100),industry_share_pct=str(get('b_e',y)/get('total',y)*100),services_share_pct=str(get('g_t',y)/get('total',y)*100)))
  for y in range(1860,1960):
   if abs(sum(get(s,y) for s in ['a','b_e','f','g_t'])-get('total',y))>D('2.5'):raise ValueError('Sector sum outside rounding bound')
  a,b,c=bench;finding=f"Alkutuotannon osuus rekonstruoiduista henkilötyövuosista oli {fmt(a['agriculture_share_pct'])} % vuonna 1860, {fmt(b['agriculture_share_pct'])} % vuonna 1913 ja {fmt(c['agriculture_share_pct'])} % vuonna 1959. Teollisuuden osuus muuttui vuoden 1860 {fmt(a['industry_share_pct'])} prosentista vuoden 1959 {fmt(c['industry_share_pct'])} prosenttiin ja palvelujen {fmt(a['services_share_pct'])} prosentista {fmt(c['services_share_pct'])} prosenttiin. Henkilötyövuosi ei ole työllisten henkilöiden määrä tai työtuntien määrä."
  computed=dict(period=[1860,1959],benchmarks=bench,unit='share_of_reconstructed_person_years');period=[1860,1959]
 elif name.startswith('public'):
  k=cells[0]['series_key'];bench=[dict(year=y,index=str(m[k,y,'FI'])) for y in [1860,1913,1938,1945]]
  finding='Julkisten kulutusmenojen volyymi-indeksi (1926=100) oli '+', '.join(str(r['year'])+': '+fmt(r['index']) for r in bench)+'. Historiallinen määräindeksi ei ole valtion budjetti tai julkisten kokonaismenojen osuus BKT:sta. Päätevuodet eivät tarkoita tasaista kasvua eikä sotavuosien tasoa pidä rinnastaa rauhan ajan palveluihin.'
  computed=dict(period=[1860,1945],benchmarks=bench,unit='volume_index_1926_100');period=[1860,1945]
 else:
  k=cells[0]['series_key'];get=lambda g,y:m[k,y,g]/10
  finding=f"Kansakoulukurssia korkeamman sivistyksen saaneiden osuus 15 vuotta täyttäneestä läsnäolevasta väestöstä oli vuonna 1920 kaupungeissa {fmt(get('FI_URBAN',1920))} % ja maaseudulla {fmt(get('FI_RURAL',1920))} %, vuonna 1930 vastaavasti {fmt(get('FI_URBAN',1930))} % ja {fmt(get('FI_RURAL',1930))} %. Naisten osuus nousi {fmt(get('FI_F',1920))} prosentista {fmt(get('FI_F',1930))} prosenttiin ja miesten {fmt(get('FI_M',1920))} prosentista {fmt(get('FI_M',1930))} prosenttiin. Lähteen promilleluvut on muunnettu prosenteiksi jakamalla kymmenellä."
  computed=dict(period=[1920,1930],values=[dict(year=c['year'],group_key=c['group_key'],source_permille=c['value'],percent=str(D(c['value'])/10)) for c in cells],unit='percent_age15plus_historical_education_above_primary');period=[1920,1930]
 links=[]
 for k,g in sorted({(c['series_key'],c['group_key']) for c in cells}):
  rr=sorted([c for c in cells if c['series_key']==k and c['group_key']==g],key=lambda c:c['year'])
  links.append(dict(source_table='editorial__historical_school_verified' if name.startswith('school') else 'public__indicator_values',series_key=k,group_key=g,observation_period=period,observations=len(rr),stored_years=[r['year'] for r in rr],values_sha256=digest(canonical(rr)),source_url=src['url'],reference_sha256=src['sha256'],role='descriptive_context_not_causal_evidence'))
 return dict(computed=computed,statistical_finding=finding,data_links=links)

def reconcile(db,name):
 cells,src=reference(name);keys=sorted({c['series_key'] for c in cells});years=[c['year'] for c in cells];marks=','.join('?' for k in keys)
 rows=db.execute('SELECT series_key,year,group_key,value,period FROM public__indicator_values WHERE is_published=1 AND year BETWEEN ? AND ? AND series_key IN ('+marks+') ORDER BY series_key,year,group_key',[min(years),max(years)]+keys)
 actual={(r['series_key'],r['year'],r['group_key']):r for r in rows};expected={(r['series_key'],r['year'],r['group_key']):r for r in cells}
 if len(rows)!=len(cells) or set(actual)!=set(expected):raise ValueError('Migrated scope changed')
 for key,c in expected.items():
  r=actual[key]
  if r['value'] is None or not D(str(r['value'])).is_finite() or D(str(r['value']))!=D(c['value']):raise ValueError('Migrated value mismatch')
  if name.startswith('school') and r['period']!=c['period']:raise ValueError('Source period mismatch')
 if name.startswith('school'):
  checked=db.execute('SELECT series_key,year,group_key,source_value,source_unit,source_sha256,original_title_rejected FROM editorial__historical_school_verified WHERE version=? AND series_key=? ORDER BY year,group_key',[src['reference_version'],keys[0]])
  if len(checked)!=10 or any(r['source_sha256']!=src['sha256'] or r['source_unit']!='permille' or r['original_title_rejected']!=1 or D(r['source_value'])!=D(expected[(r['series_key'],r['year'],r['group_key'])]['value']) for r in checked):raise ValueError('Verified definition changed')
 else:
  meta=db.execute('SELECT series_key,unit,geography,published FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys);unit='Tuhatta työvuotta' if name.startswith('labour') else 'Volyymi-indeksi (1926=100)'
  if len(meta)!=len(keys) or any(r['unit']!=unit or r['geography']!='Finland' or r['published']!=1 for r in meta):raise ValueError('Migrated definition changed')
 return len(rows)
def main():
 b=json.load(sys.stdin);db=RecordRemote();n=0
 try:
  for s in b['supplements']:
   name=s['matrix_reference'];expected=analysis(name)
   if any(s.get(k)!=v for k,v in expected.items()) or not any(e['finding']==expected['statistical_finding'] for e in s['evidence']):raise ValueError('Calculation mismatch')
   n+=reconcile(db,name)
  apply(db,b)
 finally:db.close()
 db=RecordRemote()
 try:
  validate(db,b);verify(db,b)
  for s in b['supplements']:reconcile(db,s['matrix_reference'])
 finally:db.close()
 print('PASS historical matrix evidence:',len(b['supplements']),'; reconciled source cells:',n,'; fresh connection; originals unchanged.')
if __name__=='__main__':main()
