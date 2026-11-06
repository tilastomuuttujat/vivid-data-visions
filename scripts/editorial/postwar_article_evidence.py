"""Source-verified postwar evidence with an immutable correction layer."""
import json,sys
from pathlib import Path
from decimal import Decimal as D
from articles import canonical,digest
from period_analysis import RecordRemote
from article_evidence import apply,validate,verify
ROOT=Path(__file__).with_name('sources')
VERSION='postwar-source-cells-2026-11-06-v1'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__postwar_verified_cells(version TEXT NOT NULL,reference_name TEXT NOT NULL,series_key TEXT NOT NULL,year INTEGER NOT NULL,group_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,reference_name,series_key,year,group_key))'''
def fmt(v):return str(D(v).quantize(D('0.1'))).replace('.',',')
def reference(name):
    cells=[]
    if name=='housing-1950-1970':
        s=json.loads((ROOT/'postwar-housing1950-1970-cells.json').read_text())
        for r in s['rows']:
            for field in ['total','running_water','flush_toilet']:
                key='fi.followup20261021.dwelling_total' if field=='total' else 'svt2025.table1.3.'+field
                cells.append(dict(series_key=key,year=r['year'],group_key='total',value=r[field],source_period=str(r['year']),raw_expected=r[field] if field=='total' else None,raw_series=field=='total'))
        return cells,s
    if name=='vocational-1950-1956':
        s=json.loads((ROOT/'postwar-vocational1956-cells.json').read_text())
        for r in s['rows']:cells.append(dict(series_key='education.postwar.vocational_students1951_1956',year=r['year'],group_key=r['group_key'],group_label=r['group_label'],source_period=r['source_period'],value=r['value'],raw_expected=r['migrated_value_at_review'],raw_series=True))
        return cells,s
    if name=='investment-share-1960-1974':
        p=ROOT/'article15ai-investment-share-1960-1974.json';raw=p.read_bytes();s=json.loads(p.with_suffix('.receipt.json').read_text())
        if digest(raw.decode())!=s['sha256']:raise ValueError('Reference digest mismatch')
        d=json.loads(raw)
        if [c['code'] for c in d['columns']]!=['timeperiod_y','toimiala_79_20180101','taloustoimi_1_20180101','ntp-CP1960']:raise ValueError('Reference dimensions changed')
        for r in d['data']:
            y,sector,t=r['key']
            if sector!='SSS' or t not in ['P51K','P51KS13'] or not 1960<=int(y)<=1974:raise ValueError('Unexpected source cell')
            key='fi.statfin15ai.total.'+t.lower()+'.304b0eb25b';v=r['values'][0]
            cells.append(dict(series_key=key,year=int(y),group_key='FI',source_period=y,value=v,raw_expected=v,raw_series=True))
        if len(cells)!=30:raise ValueError('Reference count mismatch')
        return cells,s
    raise ValueError('Unknown source scope')
def analysis(name):
    cells,s=reference(name);index={(r['series_key'],r['year'],r['group_key']):D(r['value']) for r in cells}
    def get(k,y,g='total'):return index[k,y,g]
    if name=='housing-1950-1970':
        k='fi.followup20261021.dwelling_total';a,b=get(k,1950),get(k,1970);w0=get('svt2025.table1.3.running_water',1950)/a*100;w1=get('svt2025.table1.3.running_water',1970)/b*100;c0=get('svt2025.table1.3.flush_toilet',1950)/a*100;c1=get('svt2025.table1.3.flush_toilet',1970)/b*100
        start_count=format(int(a),',').replace(',',' ');end_count=format(int(b),',').replace(',',' ')
        finding=f'Asuntokanta kasvoi {start_count} asunnosta {end_count} asuntoon vuosina 1950–1970 eli {fmt((b/a-1)*100)} %. Vesijohdolla varustettujen osuus nousi {fmt(w0)} prosentista {fmt(w1)} prosenttiin ja WC:llä varustettujen {fmt(c0)} prosentista {fmt(c1)} prosenttiin.'
        computed=dict(period=[1950,1970],stock_change=str(b-a),stock_change_pct=str((b/a-1)*100),water_share_start=str(w0),water_share_end=str(w1),wc_share_start=str(c0),wc_share_end=str(c1));period=[1950,1970]
    elif name=='vocational-1950-1956':
        k='education.postwar.vocational_students1951_1956';a,b=get(k,1951,'CENTRAL'),get(k,1956,'CENTRAL');c,d=get(k,1951,'PREP_TECHNICAL'),get(k,1956,'PREP_TECHNICAL')
        finding=f'Lukuvuodesta 1950–1951 lukuvuoteen 1955–1956 keskusammattikoulujen oppilasmäärä kasvoi {int(a)}:stä {int(b)}:een ja valmistavien teknillisten ammattikoulujen {int(c)}:sta {int(d)}:aan. Tarkistettu poiminta kattaa kahdeksan koulutyyppiä, ei koko ammatillista koulutusta tai tutkinnon suorittaneita. Kuusi siirrettyä lukua poikkesi alkuperäisestä; laskelma käyttää erillisen tarkistuskerroksen lähdearvoja.'
        computed=dict(period=[1950,1956],central_start=str(a),central_end=str(b),preparatory_technical_start=str(c),preparatory_technical_end=str(d),migrated_differences=sum(r['raw_expected']!=r['value'] for r in cells));period=[1950,1956]
    else:
        k='fi.statfin15ai.total.p51ks13.304b0eb25b';total='fi.statfin15ai.total.p51k.304b0eb25b';a=get(k,1960,'FI')/get(total,1960,'FI')*100;b=get(k,1974,'FI')/get(total,1974,'FI')*100
        finding=f'Julkisten investointien osuus kiinteän pääoman bruttomuodostuksesta oli {fmt(a)} % vuonna 1960 ja {fmt(b)} % vuonna 1974. Osuus pieneni {fmt(a-b)} prosenttiyksikköä. Tämä on saman vuoden käypähintaisista SNA68-luvuista laskettu osuus, ei julkisten investointien reaalisen määrän tai vaikutuksen arvio.'
        computed=dict(period=[1960,1974],share_start=str(a),share_end=str(b),change_percentage_points=str(b-a));period=[1960,1974]
    links=[dict(source_table='editorial__postwar_effective_values',reference_name=name,series_key=k,group_key=g,observation_period=period,stored_years=sorted({r['year'] for r in cells if r['series_key']==k and r['group_key']==g}),observations=sum(r['series_key']==k and r['group_key']==g for r in cells),source_url=s['url'],reference_sha256=digest(canonical(cells)),role='descriptive_context_not_causal_evidence') for k,g in sorted({(r['series_key'],r['group_key']) for r in cells})]
    return dict(statistical_finding=finding,computed=computed,data_links=links,source_discrepancies=[dict(year=r['year'],source_period=r['source_period'],group_key=r['group_key'],migrated_value=r['raw_expected'],verified_source_value=r['value']) for r in cells if r['raw_series'] and D(r['raw_expected'])!=D(r['value'])])
def reconcile(db,name):
    cells,s=reference(name);keys=sorted({r['series_key'] for r in cells if r['raw_series']});years=[r['year'] for r in cells];marks=','.join('?' for k in keys)
    meta=db.execute('SELECT series_key,unit,geography FROM public__indicator_series WHERE published=1 AND series_key IN ('+marks+') ORDER BY series_key',keys)
    unit,geo=('asuntoa','Finland') if name=='housing-1950-1970' else ('oppilasta','Suomi, lähteen historiallinen oppilaitosrajaus') if name=='vocational-1950-1956' else ('Käyvin hinnoin, 1960-1975, milj. mk (SNA68)','Finland')
    if len(meta)!=len(keys) or any(m['unit']!=unit or m['geography']!=geo for m in meta):raise ValueError('Migrated metadata changed')
    rows=db.execute('SELECT series_key,year,group_key,value FROM public__indicator_values WHERE is_published=1 AND year BETWEEN ? AND ? AND series_key IN ('+marks+') ORDER BY series_key,year,group_key',[min(years),max(years)]+keys)
    raw={(r['series_key'],r['year'],r['group_key']):r['value'] for r in rows};expected={(r['series_key'],r['year'],r['group_key']):r['raw_expected'] for r in cells if r['raw_series']}
    if set(raw)!=set(expected) or any(raw[k] is None or D(str(raw[k]))!=D(v) for k,v in expected.items()):raise ValueError('Migrated snapshot changed')
    return len(rows),sum(D(r['raw_expected'])!=D(r['value']) for r in cells if r['raw_series'])
def expected_rows(b):
    return sorted([dict(version=VERSION,reference_name=s['postwar_reference'],series_key=r['series_key'],year=r['year'],group_key=r['group_key'],payload_json=canonical(dict(**r,disposition='new_original_source_cell' if not r['raw_series'] else 'migrated_matches_original' if D(r['value'])==D(r['raw_expected']) else 'original_value_supersedes_migrated_for_editorial_use',source_url=ref['url'],reference_pdf_sha256=ref.get('pdf_sha256'),reference_response_sha256=ref.get('sha256')))) for s in b['supplements'] for cells,ref in [reference(s['postwar_reference'])] for r in cells],key=lambda r:(r['reference_name'],r['series_key'],r['year'],r['group_key']))
def main():
    b=json.load(sys.stdin);db=RecordRemote();n=diffs=0
    try:
        validate(db,b)
        for s in b['supplements']:
            exp=analysis(s['postwar_reference'])
            if any(s.get(k)!=v for k,v in exp.items()):raise ValueError('Finding mismatch')
            n0,d0=reconcile(db,s['postwar_reference']);n+=n0;diffs+=d0
        rows=expected_rows(b);db.execute(SCHEMA);db.execute('BEGIN')
        try:
            for r in rows:db.execute('INSERT INTO editorial__postwar_verified_cells VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING',list(r.values()))
            if db.execute('SELECT * FROM editorial__postwar_verified_cells WHERE version=? ORDER BY reference_name,series_key,year,group_key',[VERSION])!=rows:raise ValueError('Review readback mismatch')
            db.execute('''CREATE VIEW IF NOT EXISTS editorial__postwar_effective_values AS
SELECT c.version,c.reference_name,c.series_key,c.year,c.group_key,
json_extract(c.payload_json,'$.source_period') AS source_period,
json_extract(c.payload_json,'$.value') AS verified_value,
json_extract(c.payload_json,'$.raw_expected') AS migrated_value,
json_extract(c.payload_json,'$.disposition') AS disposition,
json_extract(c.payload_json,'$.source_url') AS source_url
FROM editorial__postwar_verified_cells c
WHERE c.rowid=(SELECT max(n.rowid) FROM editorial__postwar_verified_cells n WHERE n.reference_name=c.reference_name AND n.series_key=c.series_key AND n.year=c.year AND n.group_key=c.group_key)''')
            db.execute('COMMIT')
        except:db.execute('ROLLBACK');raise
        apply(db,b)
    finally:db.close()
    db=RecordRemote()
    try:
        validate(db,b);verify(db,b)
        if db.execute('SELECT * FROM editorial__postwar_verified_cells WHERE version=? ORDER BY reference_name,series_key,year,group_key',[VERSION])!=rows:raise ValueError('Fresh review mismatch')
        for s in b['supplements']:reconcile(db,s['postwar_reference'])
    finally:db.close()
    print('PASS postwar article evidence:',len(b['supplements']),'; source cells:',len(rows),'; migrated cells:',n,'; discrepancies isolated:',diffs,'; fresh verification; originals unchanged.')
if __name__=='__main__':main()
