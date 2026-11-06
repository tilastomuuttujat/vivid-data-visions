"""Reconcile migrated rows with pinned official data before article-level use."""
import json,sys
from decimal import Decimal
from pathlib import Path
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')
SECTORS={'SSS':'total','A':'a','BTE':'b_e','F':'f','GTT':'g_t'}
def reference(name):
    if name not in ('work-1960-1974','public-consumption-1946-1959'):raise ValueError('Unknown reference scope')
    p=ROOT/('article15ai-'+name+'.json');raw=p.read_bytes();receipt=json.loads(p.with_suffix('.receipt.json').read_text())
    if digest(raw.decode())!=receipt['sha256']:raise ValueError('Reference changed')
    data=json.loads(raw);keys=[c['code'] for c in data['columns'] if c['type']!='c'];cols=[c['code'] for c in data['columns'] if c['type']=='c'];expected_unit='ntp-TP' if name=='work-1960-1974' else 'ntp-VOLIND'
    if cols!=[expected_unit]:raise ValueError('Reference unit changed')
    if keys!=['timeperiod_y','toimiala_79_20180101','taloustoimi_1_20180101']:raise ValueError('Reference dimensions changed')
    rows={}
    for e in data['data']:
        k=dict(zip(keys,e['key']));sector=k['toimiala_79_20180101'];y=int(k['timeperiod_y']);v=e['values'][0]
        if k['taloustoimi_1_20180101']!=('E1' if name=='work-1960-1974' else 'P3KS13'):raise ValueError('Reference transaction changed')
        if not Decimal(v).is_finite():raise ValueError('Nonfinite reference')
        key=('fi.statfin15ai.'+SECTORS[sector]+'.e1.fe4e7bf6af') if name=='work-1960-1974' else 'fi.statfin15ai.total.p3ks13.eb971a1c0a'
        if (key,y) in rows:raise ValueError('Duplicate reference cell')
        rows[(key,y)]=v
    if len(rows)!=(75 if name=='work-1960-1974' else 14):raise ValueError('Reference scope changed')
    return rows,receipt

def rounded(v):return str(v.quantize(Decimal('0.1'))).replace('.',',')
def analysis(name):
    rows,receipt=reference(name)
    links=[]
    for key in sorted({k for k,y in rows}):
        vv=[dict(year=y,value=v) for (k,y),v in sorted(rows.items()) if k==key]
        links.append(dict(source_table='public__indicator_values',series_key=key,group_key='FI',observation_period=[vv[0]['year'],vv[-1]['year']],observations=len(vv),values_sha256=digest(canonical(vv)),reference_sha256=receipt['sha256'],reference_url=receipt['url'],role='descriptive_context_not_causal_evidence'))
    if name=='work-1960-1974':
        prefix='fi.statfin15ai.';suffix='.e1.fe4e7bf6af';values=lambda sector,y:Decimal(rows[(prefix+sector+suffix,y)])
        changes=[]
        for sector,label in [('a','Maatalous, metsätalous ja kalatalous'),('b_e','Teollisuus'),('f','Rakentaminen'),('g_t','Palvelut')]:
            start,end=values(sector,1960),values(sector,1974)
            changes.append(dict(sector=sector,start_thousand=str(start),end_thousand=str(end),change_thousand=str(end-start),start_share_pct=str(start/values('total',1960)*100),end_share_pct=str(end/values('total',1974)*100)))
        for y in range(1960,1975):
            if abs(sum(values(s,y) for s in ['a','b_e','f','g_t'])-values('total',y))>Decimal('2.5'):raise ValueError('Sector totals do not reconcile within source rounding')
        c={r['sector']:r for r in changes}
        finding='Vuosina 1960–1974 maa-, metsä- ja kalatalouden osuus kotimaan työllisistä pieneni '+rounded(Decimal(c['a']['start_share_pct']))+' prosentista '+rounded(Decimal(c['a']['end_share_pct']))+' prosenttiin. Palvelujen osuus kasvoi '+rounded(Decimal(c['g_t']['start_share_pct']))+' prosentista '+rounded(Decimal(c['g_t']['end_share_pct']))+' prosenttiin. Teollisuuden työllisten määrä muuttui '+rounded(Decimal(c['b_e']['start_thousand']))+' tuhannesta '+rounded(Decimal(c['b_e']['end_thousand']))+' tuhanteen ja rakentamisen '+rounded(Decimal(c['f']['start_thousand']))+' tuhannesta '+rounded(Decimal(c['f']['end_thousand']))+' tuhanteen.'
        computed=dict(period=[1960,1974],sectors=changes,total_start_thousand=str(values('total',1960)),total_end_thousand=str(values('total',1974)))
    else:
        key=next(iter(rows))[0];a=Decimal(rows[(key,1946)]);b=Decimal(rows[(key,1959)]);change=(b/a-1)*100
        finding='Julkisten kulutusmenojen volyymi-indeksi (1926=100) oli vuonna 1946 '+rounded(a)+' ja vuonna 1959 '+rounded(b)+'. Päätetason nousu oli '+rounded(change)+' prosenttia. Kyse on julkisyhteisöjen kulutuksen volyymista, ei valtion budjetista, julkisista kokonaismenoista tai tulonsiirroista.'
        computed=dict(period=[1946,1959],start_index=str(a),end_index=str(b),change_percent=str(change),annual_values=[dict(year=y,index=v) for (k,y),v in sorted(rows.items())])
    return dict(data_links=links,computed=computed,statistical_finding=finding)

def reconcile(db,name):
    expected,_=reference(name);keys=sorted({k for k,y in expected});first=min(y for k,y in expected);last=max(y for k,y in expected);marks=','.join('?' for k in keys)
    meta=db.execute('SELECT series_key,unit,geography,published FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
    unit='Tuhatta henkilöä' if name=='work-1960-1974' else 'Volyymi-indeksi (1926=100)'
    if len(meta)!=len(keys) or any(m['unit']!=unit or m['geography']!='Finland' or m['published']!=1 for m in meta):raise ValueError('Migrated concept metadata mismatch')
    rows=db.execute('SELECT series_key,year,group_key,value,value_kind,validation_status,source_url,source_version FROM public__indicator_values WHERE is_published=1 AND year BETWEEN ? AND ? AND series_key IN ('+marks+') ORDER BY series_key,year,group_key',[first,last]+keys)
    if len(rows)!=len(expected) or any(r['group_key']!='FI' for r in rows):raise ValueError('Migrated row scope mismatch')
    if {(r['series_key'],r['year']) for r in rows}!=set(expected):raise ValueError('Migrated year coverage mismatch')
    for r in rows:
        if r['value'] is None or not Decimal(str(r['value'])).is_finite() or Decimal(str(r['value']))!=Decimal(expected[(r['series_key'],r['year'])]):raise ValueError('Migrated value mismatch')
        if r['value_kind'] not in ('observed','estimate'):raise ValueError('Unexpected value kind')
    return len(rows)

def main():
    b=json.load(sys.stdin);db=RecordRemote();n=0
    try:
        for s in b['supplements']:
            name=s['series_review_name'];expected=analysis(name)
            if any(s.get(k)!=v for k,v in expected.items()):raise ValueError('Calculation or provenance mismatch')
            if not any(e['finding']==expected['statistical_finding'] for e in s['evidence']):raise ValueError('Finding not linked')
            n+=reconcile(db,name)
        apply(db,b)
    finally:db.close()
    db=RecordRemote()
    try:
        validate(db,b);verify(db,b)
        for s in b['supplements']:reconcile(db,s['series_review_name'])
    finally:db.close()
    print('PASS article series evidence:',len(b['supplements']),'; official cells reconciled:',n,'; fresh connection; originals unchanged.')
if __name__=='__main__':main()
