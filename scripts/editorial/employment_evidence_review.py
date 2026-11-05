"""Exact StatFin employment reconciliation and explicit population denominators."""
import json
from decimal import Decimal
from articles import canonical,digest
from evidence_review import META,FIELDS,verify as verify_reviews
from income_evidence_review import ROOT,load_sources
from period_analysis import RecordRemote

def cells(spec,reference):
    result={}
    for r in reference:
        d=r['dimensions']
        if d['paaasial_toimin_3_20180101']!=spec['activity']:continue
        if d['sukupuoli_9_20180101']!='SSS' or d['ikaryhma_10_20180101']!='18-64' or d['contentscode']!='tyokay-vaesto':raise ValueError('Unexpected population')
        area=d['alue_28_20250101'];key=(int(d['timeperiod_y']),('FI' if area=='SSS' else area)+'|education='+d['koulutusaste_17_20180101'])
        if key in result or r['value'] is None:raise ValueError('Duplicate or unavailable cell')
        result[key]=Decimal(str(r['value']))
    return result

def match(spec,rows,reference):
    expected=cells(spec,reference);actual={(r['year'],r['group_key']):r for r in rows}
    if len(rows)!=3800 or len(actual)!=len(rows) or set(actual)!=set(expected):raise ValueError('Cell population differs')
    for key,r in actual.items():
        if r['value'] is None or Decimal(str(r['value']))!=expected[key] or r['source_url']!=spec['source_url'] or r['value_kind']!='observed':raise ValueError('Value or provenance differs')
    return expected

def rates(bundle,reference):
    cc={s['activity']:cells(s,reference) for s in bundle['series']};out=[]
    for (year,group),p in sorted(cc['SSS'].items()):
        e,u,o,st=(cc[c][year,group] for c in ('11','12','21-99','22'))
        if p<=0 or min(e,u,o,st)<0 or p!=e+u+o or st>o:raise ValueError('Population accounting fails')
        out.append(dict(year=year,group_key=group,population=int(p),employed=int(e),unemployed=int(u),outside=int(o),students_subset=int(st),employment_population_pct=str(100*e/p),unemployment_labour_force_pct=str(100*u/(e+u)) if e+u else None,outside_population_pct=str(100*o/p)))
    return out

def verify(db,b,p,reviews):
    verify_reviews(db,dict(b,reviews=reviews))
    if db.execute('SELECT payload_json FROM editorial__employment_source_reviews WHERE version=?',[b['version']])!=[dict(payload_json=canonical(p))]:raise ValueError('Review readback differs')

def apply(db,b,reference,receipts):
    keys=[s['series_key'] for s in b['series']];marks=','.join('?' for _ in keys)
    if len(set(keys))!=5 or {s['activity'] for s in b['series']}!={'SSS','11','12','21-99','22'}:raise ValueError('Exact five-series scope required')
    def snapshot():
        return (db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys),db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys))
    db.execute('BEGIN')
    try:
        metadata,rows=snapshot();before=digest(canonical(metadata)+canonical(rows));mm={r['series_key']:r for r in metadata};reviews=[]
        for s in b['series']:
            k=s['series_key'];rr=[r for r in rows if r['series_key']==k]
            if digest(canonical(mm[k]))!=s['expected_metadata_sha256'] or digest(canonical(rr))!=s['expected_rows_sha256']:raise ValueError('Reviewed input changed')
            match(s,rr,reference)
            reviews.append(dict(series_key=k,base_quality_version=b['base_quality_version'],expected_metadata_sha256=s['expected_metadata_sha256'],expected_rows_sha256=s['expected_rows_sha256'],reviewed_on=b['retrieved_on'],evidence_role='descriptive_same_table_strata_only',decision='3800 alkuperäistä StatFin-solua tarkistettu täsmällisin luokituskoodein.',source_url=s['source_url'],source_document_status='fresh_pxweb_response_exact_cells_checked',definition_status='official_source_concept_and_values_checked',definition_supplement='18–64-vuotiaat, sukupuolet yhteensä; rekisteripohjainen pääasiallinen toiminta vuoden viimeisellä viikolla. Koko maa ja 19 maakuntaa vuoden 2025 alueluokituksella.',limits='Vuoden 2005 luokitusmuutos huomioitava. Opiskelijat ovat työvoiman ulkopuolisten osajoukko. Työllisyysosuus E/P; työttömyysaste U/(E+U). Ei työvoimatutkimuksen kuukausiluku. Koulutus 9_X sisältää tuntemattoman koulutuksen. Tulotilaston asuntoväestö on eri populaatio; koulutusluokkia 3_4 ja 5_6 ei yhdistetä suoraan tulotaulukon luokkiin.',matched_cells=3800,causal_effect_identified=False,interpolation_allowed=False))
        points=rates(b,reference);p=dict(receipts=receipts,matched_cells=len(rows),accounting_checked_cells=len(points),rates=points,definitions=dict(employment='100*E/P',unemployment='100*U/(E+U)',outside='100*O/P',identity='P=E+U+O; students<=O'),causal_effect_identified=False)
        db.execute('CREATE TABLE IF NOT EXISTS editorial__employment_source_reviews(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))')
        db.execute('INSERT INTO editorial__employment_source_reviews VALUES(?,?) ON CONFLICT DO NOTHING',[b['version'],canonical(p)])
        db.execute('INSERT INTO editorial__evidence_series_reviews VALUES '+','.join('(?,?,?)' for _ in reviews)+' ON CONFLICT DO NOTHING',[v for r in reviews for v in (b['version'],r['series_key'],canonical(r))])
        verify(db,b,p,reviews);m,r=snapshot()
        if digest(canonical(m)+canonical(r))!=before:raise ValueError('Originals changed')
        db.execute('COMMIT');return p,reviews
    except:db.execute('ROLLBACK');raise

def main():
    b=json.loads((ROOT/'employment-evidence-review.json').read_text());refs,receipts=load_sources(b);db=RecordRemote()
    try:p,reviews=apply(db,b,refs['employment'],receipts)
    finally:db.close()
    db=RecordRemote()
    try:verify(db,b,p,reviews)
    finally:db.close()
    print('PASS employment review: 5 series;',p['matched_cells'],'exact source matches;',p['accounting_checked_cells'],'population identities and rate points.')
    print('PASS fresh-connection readback; original migrated records unchanged; descriptive interpretation only.')
if __name__=='__main__':main()
