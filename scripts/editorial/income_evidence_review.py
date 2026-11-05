"""Match income/wage source cells and preserve descriptive comparison limits."""
import hashlib,itertools,json
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
from collections import defaultdict
from articles import canonical,digest
from evidence_review import META,FIELDS,verify as verify_reviews
from period_analysis import RecordRemote
ROOT=Path(__file__).resolve().parent

def load_sources(bundle):
    result={};receipts=[]
    for s in bundle['sources']:
        u=urlparse(s['url'])
        if u.scheme!='https' or u.hostname!='pxdata.stat.fi':raise ValueError('Official StatFin source required')
        path=ROOT/s['file']
        if path.parent!=ROOT/'sources':raise ValueError('Unexpected source path')
        raw=path.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=s['sha256']:raise ValueError('Source response digest differs')
        doc=json.loads(raw,parse_float=Decimal);ids=doc['id'];cats=[]
        for d in ids:
            ix=doc['dimension'][d]['category']['index'];cats.append(ix if isinstance(ix,list) else [k for k,v in sorted(ix.items(),key=lambda x:x[1])])
        requested={q['code']:q['selection']['values'] for q in s['request']['query']}
        if set(ids)!=set(requested) or any(set(cat)!=set(requested[d]) for d,cat in zip(ids,cats)):raise ValueError('Source selection differs')
        values=doc['value'];rows=[]
        for i,keys in enumerate(itertools.product(*cats)):
            value=values[i] if isinstance(values,list) else values.get(str(i));dims=dict(zip(ids,keys))
            if value is not None and (not Decimal(str(value)).is_finite() or Decimal(str(value))<0):raise ValueError('Invalid source value')
            rows.append(dict(dimensions=dims,value=value))
        if len(rows)!=s['expected_cells'] or sum(r['value'] is None for r in rows)!=s['expected_null_cells']:raise ValueError('Source cell coverage differs')
        result[s['name']]=rows;receipts.append(dict(s,retrieved_on=bundle['retrieved_on']))
    return result,receipts

def source_cells(spec,rows):
    cells={};missing=[]
    for r in rows:
        d=r['dimensions']
        if d['contentscode']!=spec['measure']:continue
        wage=spec['family']=='wages2024';age='ikaryhma_10_20180101' if wage else 'ikaryhma_22_20191201';edu='koulutusaste_17_20180101' if wage else 'koulutusaste_21_20231110'
        group='age='+d[age]+'|sex='+d['sukupuoli_9_20180101']+'|education='+d[edu]
        if wage:group+='|field='+d['koulutusala_3_20180101']
        key=(int(d['timeperiod_y']),group)
        if key in cells or key in missing:raise ValueError('Duplicate source cell')
        if r['value'] is None:missing.append(key)
        else:cells[key]=str(r['value'])
    return cells,missing

def match(spec,rows,reference):
    actual={(r['year'],r['group_key']):r for r in rows};expected,missing=source_cells(spec,reference)
    if len(rows)!=len(actual) or len(rows)!=spec['expected_rows'] or set(actual)!=set(expected):raise ValueError('Migrated cell population differs')
    for key,r in actual.items():
        if r['value'] is None or Decimal(str(r['value']))!=Decimal(expected[key]):raise ValueError('Source value differs')
        if r['source_url']!=spec['source_url'] or r['value_kind']!='observed':raise ValueError('Source provenance or kind differs')
    return expected,missing

def descriptive_pairs(bundle,refs):
    pairs=[]
    for spec in bundle['series']:
        if spec['family']!='income' or spec['measure']=='tjt-henkiloita':continue
        cells,_=source_cells(spec,refs['income'])
        for age in ('18-64','25-34'):
            years=[]
            for year in (2010,2024):
                high=Decimal(cells[(year,'age='+age+'|sex=SSS|education=78')]);low=Decimal(cells[(year,'age='+age+'|sex=SSS|education=9')])
                if low<=0:raise ValueError('Ratio denominator not positive')
                years.append(dict(year=year,education_78_value=str(high),education_9_value=str(low),difference_eur=str(high-low),ratio=str(high/low)))
            pairs.append(dict(series_key=spec['series_key'],age=age,sex='total',education_78='Ylempi korkeakouluaste tai tutkijakoulutusaste',education_9='Ei perusasteen jälkeistä tutkintoa tai koulutusaste tuntematon',unit='euroa/vuosi, vuoden 2024 rahassa',years=years,scope='Same source table, age and sex; changing education-group composition remains unadjusted.',causal_effect_identified=False,limits='Ei tutkinnon tuotto, ei samojen henkilöiden seuranta eikä verojen tai tulonsiirtojen kausaalinen erittely.'))
    return pairs

def apply(db,bundle,refs,receipts):
    version=bundle['version'];keys=[s['series_key'] for s in bundle['series']];marks=','.join('?' for _ in keys)
    if len(keys)!=7 or len(set(keys))!=7:raise ValueError('Exact seven-series scope required')
    db.execute('BEGIN')
    try:
        metadata=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        before=digest(canonical(metadata)+canonical(rows));M={r['series_key']:r for r in metadata};reviews=[];checks=[]
        for spec in bundle['series']:
            key=spec['series_key'];rr=[r for r in rows if r['series_key']==key]
            if key not in M or digest(canonical(M[key]))!=spec['expected_metadata_sha256'] or digest(canonical(rr))!=spec['expected_rows_sha256']:raise ValueError('Reviewed input changed')
            matched,missing=match(spec,rr,refs[spec['family']]);wage=spec['family']=='wages2024'
            checks.append(dict(series_key=key,matched=len(matched),missing_source_cells=len(missing),missing_cells=[list(k) for k in missing],source_cell_sha256=digest(canonical(sorted((y,g,v) for (y,g),v in matched.items()))),unit=spec['unit'],family=spec['family']))
            if wage:
                definition='Vuoden 2024 kokoaikaiset palkansaajat. Kuukausittainen bruttoansio tai palkansaajien lukumäärä mittarin mukaan. Keskiarvo ja mediaani erillään; alaryhmien mediaaneja ei keskiarvoisteta.'
                limits='Ei koko väestön toimeentulo. Ei kerrota työllisyysasteella. Palkkatilasto uudistui 2024; ei ketjuteta aiempiin vuosiin ilman erillistä vertailukelpoisuustarkistusta. Ikä- ja koulutusluokat poikkeavat tulotaulukosta.'
            else:
                definition='Vuosien 2010–2024 asuntoväestön tulo- tai henkilömäärämittari koulutus-, ikä- ja sukupuoliryhmittäin. Tulot vuoden 2024 rahassa. Ekvivalentti asuntokunnan tulo, henkilökohtainen nettotulo ja tuotannontekijätulo ovat eri mittareita.'
                limits='Asunnottomat ja laitoksissa asuvat eivät kuulu asuntoväestöön. Koulutusryhmä 9 sisältää myös tuntemattoman koulutusasteen. Mediaanien erot eivät ole tuloerien additiivinen jako, eikä koulutusryhmien ero ole tutkinnon kausaalivaikutus.'
            reviews.append(dict(series_key=key,base_quality_version=bundle['base_quality_version'],expected_metadata_sha256=spec['expected_metadata_sha256'],expected_rows_sha256=spec['expected_rows_sha256'],reviewed_on=bundle['retrieved_on'],evidence_role='descriptive_same_table_strata_only',decision='Kaikki sarjaan siirretyt arvot tarkistettu uudelleen haetusta alkuperäisestä StatFin-vastauksesta. Tyhjät lähdesolut säilyvät puuttuvina.',limits=limits,source_url=spec['source_url'],source_document_status='fresh_pxweb_response_exact_cells_checked',definition_status='official_source_concept_and_values_checked',definition_supplement=definition,unit=spec['unit'],matched_cells=len(matched),unavailable_source_cells=len(missing),causal_effect_identified=False,median_aggregation_allowed=False,cross_family_population_equivalence=False,interpolation_allowed=False))
        pairs=descriptive_pairs(bundle,refs)
        payload=dict(receipts=receipts,series_checks=checks,descriptive_pairs=pairs,matched_cells=sum(c['matched'] for c in checks),missing_source_cells=sum(c['missing_source_cells'] for c in checks),causal_effect_identified=False)
        db.execute('CREATE TABLE IF NOT EXISTS editorial__income_source_reviews(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__income_descriptive_pairs(version TEXT NOT NULL,series_key TEXT NOT NULL,age TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key,age))')
        db.execute('INSERT INTO editorial__income_source_reviews VALUES(?,?) ON CONFLICT DO NOTHING',[version,canonical(payload)])
        db.execute('INSERT INTO editorial__evidence_series_reviews VALUES '+','.join('(?,?,?)' for _ in reviews)+' ON CONFLICT DO NOTHING',[v for r in reviews for v in (version,r['series_key'],canonical(r))])
        db.execute('INSERT INTO editorial__income_descriptive_pairs VALUES '+','.join('(?,?,?,?)' for _ in pairs)+' ON CONFLICT DO NOTHING',[v for p in pairs for v in (version,p['series_key'],p['age'],canonical(p))])
        verify(db,bundle,payload,reviews)
        after_m=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys);after_r=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        if digest(canonical(after_m)+canonical(after_r))!=before:raise ValueError('Original source changed')
        db.execute('COMMIT');return payload,reviews
    except:db.execute('ROLLBACK');raise

def verify(db,bundle,payload,reviews):
    version=bundle['version'];verify_reviews(db,dict(bundle,reviews=reviews))
    if db.execute('SELECT payload_json FROM editorial__income_source_reviews WHERE version=?',[version])!=[{'payload_json':canonical(payload)}]:raise ValueError('Source review differs; use new version')
    expected=sorted([dict(series_key=p['series_key'],age=p['age'],payload_json=canonical(p)) for p in payload['descriptive_pairs']],key=lambda r:(r['series_key'],r['age']))
    if db.execute('SELECT series_key,age,payload_json FROM editorial__income_descriptive_pairs WHERE version=? ORDER BY series_key,age',[version])!=expected:raise ValueError('Descriptive pair readback differs')

def main():
    b=json.loads((ROOT/'income-evidence-review.json').read_text());refs,receipts=load_sources(b);db=RecordRemote()
    try:p,reviews=apply(db,b,refs,receipts)
    finally:db.close()
    db=RecordRemote()
    try:verify(db,b,p,reviews)
    finally:db.close()
    print('PASS education income source review:',len(reviews),'series;',p['matched_cells'],'exact source matches;',p['missing_source_cells'],'missing source cells retained;',len(p['descriptive_pairs']),'same-table descriptive endpoint comparisons.')
    print('PASS fresh-connection source-review, use-limit and comparison readback; originals unchanged; no median pooling, interpolation or causal attribution.')
if __name__=='__main__':main()
