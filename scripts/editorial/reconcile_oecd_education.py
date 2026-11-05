"""Match migrated attainment data to an immutable original OECD snapshot."""
import csv,io,json,hashlib
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
from articles import canonical,digest
from period_analysis import RecordRemote
from evidence_review import META,FIELDS
ROOT=Path(__file__).resolve().parent

def load_reference():
    raw=(ROOT/'sources/oecd-education-2026-11-05.csv').read_bytes()
    receipt=json.loads((ROOT/'sources/oecd-education-2026-11-05.receipt.json').read_text())
    if hashlib.sha256(raw).hexdigest()!=receipt['data_receipt']['sha256']:raise ValueError('Original CSV digest mismatch')
    for k in ('url','final_url'):
        u=urlparse(receipt['data_receipt'][k])
        if u.scheme!='https' or u.hostname!='sdmx.oecd.org' or u.username or u.password:raise ValueError('Official OECD source required')
    rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))));selectors=receipt['selectors']
    if len(rows)!=48:raise ValueError('Unexpected source count; review new snapshot')
    seen=set()
    for r in rows:
        if r['DATAFLOW']!='OECD.EDU.IMEP:DSD_EAG_LSO_EA@DF_LSO_NEAC_DISTR_EA(1.0)' or r['UNIT_MULT']!='0':raise ValueError('Source flow or unit changed')
        if any(r[k] not in selectors[k].split('+') for k in selectors):raise ValueError('Source population or measurement mismatch')
        if r['OBS_STATUS'] not in ('A','B'):raise ValueError('Unreviewed OECD observation status')
        d=Decimal(r['OBS_VALUE'])
        if not d.is_finite() or not 0<=d<=100:raise ValueError('Invalid percentage')
        key=(r['ATTAINMENT_LEV'],int(r['TIME_PERIOD']))
        if key in seen:raise ValueError('Ambiguous OECD observation')
        seen.add(key)
    return receipt,rows

def compare(spec,original,reference):
    source={int(r['TIME_PERIOD']):r for r in reference if r['ATTAINMENT_LEV']==spec['attainment_level']}
    if len(original)!=spec['expected_rows'] or len(source)!=spec['expected_rows']:raise ValueError('Unexpected original or reference count')
    if any(r['group_key']!=spec['group_key'] for r in original):raise ValueError('Original population changed')
    if len({r['year'] for r in original})!=len(original):raise ValueError('Duplicate original year')
    comparisons=[]
    for r in original:
        q=source.get(r['year'])
        if not q or r['value'] is None or Decimal(str(r['value']))!=Decimal(q['OBS_VALUE']):raise ValueError('Direct OECD value does not match')
        comparisons.append(dict(series_key=spec['series_key'],year=r['year'],original_value=str(r['value']),original_value_kind=r['value_kind'],official_value=q['OBS_VALUE'],official_obs_status=q['OBS_STATUS'],is_series_break=q['OBS_STATUS']=='B',match='exact_decimal_value',unit='percent_of_same_sex_age_population',age='25-34',sex='total',geography='FIN'))
    start,end=spec['target_years']
    missing=sorted(set(range(start,end+1))-set(source))
    if missing!=[2001,2002] or sorted(r['year'] for r in comparisons if r['is_series_break'])!=[2016]:raise ValueError('Coverage or break flags changed; new review required')
    return comparisons,missing

def apply(db,bundle,receipt,reference):
    version=bundle['version'];keys=[s['series_key'] for s in bundle['series']]
    if len(keys)!=2 or len(set(keys))!=2:raise ValueError('Exact two-series scope required')
    db.execute('BEGIN')
    try:
        marks=','.join('?' for _ in keys)
        metadata=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        before=digest(canonical(metadata)+canonical(rows));M={s['series_key']:s for s in metadata}
        comparisons=[];reviews=[]
        for spec in bundle['series']:
            key=spec['series_key'];original=[r for r in rows if r['series_key']==key]
            if key not in M or digest(canonical(M[key]))!=spec['expected_metadata_sha256'] or digest(canonical(original))!=spec['expected_rows_sha256']:raise ValueError('Migrated source changed')
            matched,missing=compare(spec,original,reference);comparisons.extend(matched)
            reviews.append(dict(series_key=key,base_quality_version=bundle['base_quality_version'],expected_metadata_sha256=spec['expected_metadata_sha256'],expected_rows_sha256=spec['expected_rows_sha256'],reviewed_on='2026-11-05',evidence_role='direct_official_descriptive_reference',decision='Kaikki 24 arvoa täsmäävät desimaalilukuina OECD:n suoraan FIN / sukupuolet yhteensä / 25–34-vuotiaat -poimintaan. Käytä virallista lähdepoimintaa, ei omaa ikäryhmien yhdistelmää.',source_url=receipt['data_receipt']['url'],source_resolution_status='all_stored_values_matched_direct_official_snapshot',requires_derivation_review=False,original_derivation_reconstructed=False,original_derivation_note='Alkuperäisen tuonnin laskentakaavaa ei ole rekonstruoitu. Täsmäävä virallinen 25–34-vuotiaiden osuus poistaa oman ikäryhmäpainotuksen tarpeen tässä vertailuaineistossa.',matched_values=24,missing_years=missing,break_years=[2016],interpolation_allowed=False,source_snapshot_version=version,limits='Lähdearvojen täsmääminen ei todista peruskoulu-uudistuksen vaikutusta eikä poista vuoden 2016 katkosta. Vuosia 2001–2002 ei täytetä. Aiemmat alkuperäiset arviomerkinnät ja siirtometatiedot säilyvät.'))
        snapshot=dict(receipt=receipt,rows=reference)
        db.execute('CREATE TABLE IF NOT EXISTS editorial__oecd_source_snapshots(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__oecd_attainment_comparisons(version TEXT NOT NULL,series_key TEXT NOT NULL,year INTEGER NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key,year))')
        db.execute('INSERT INTO editorial__oecd_source_snapshots VALUES(?,?) ON CONFLICT DO NOTHING',[version,canonical(snapshot)])
        db.execute('INSERT INTO editorial__oecd_attainment_comparisons VALUES '+','.join('(?,?,?,?)' for _ in comparisons)+' ON CONFLICT DO NOTHING',[v for r in comparisons for v in (version,r['series_key'],r['year'],canonical(r))])
        db.execute('INSERT INTO editorial__evidence_series_reviews VALUES '+','.join('(?,?,?)' for _ in reviews)+' ON CONFLICT DO NOTHING',[v for r in reviews for v in (version,r['series_key'],canonical(r))])
        verify(db,bundle,snapshot,comparisons,reviews)
        db.execute('''CREATE VIEW IF NOT EXISTS editorial__oecd_attainment_verified AS
          SELECT c.version,c.series_key,c.year,json_extract(c.payload_json,'$.official_value') AS official_value,
          json_extract(c.payload_json,'$.original_value_kind') AS original_value_kind,
          json_extract(c.payload_json,'$.official_obs_status') AS official_obs_status,
          json_extract(c.payload_json,'$.is_series_break') AS is_series_break,
          json_extract(s.payload_json,'$.receipt.data_receipt.url') AS source_url,
          json_extract(s.payload_json,'$.receipt.data_receipt.retrieved_at') AS source_retrieved_at
          FROM editorial__oecd_attainment_comparisons c JOIN editorial__oecd_source_snapshots s ON s.version=c.version''')
        after_m=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        after_r=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        if digest(canonical(after_m)+canonical(after_r))!=before:raise ValueError('Original source content changed')
        db.execute('COMMIT');return snapshot,comparisons,reviews
    except:db.execute('ROLLBACK');raise

def verify(db,bundle,snapshot,comparisons,reviews):
    version=bundle['version']
    if db.execute('SELECT payload_json FROM editorial__oecd_source_snapshots WHERE version=?',[version])!=[{'payload_json':canonical(snapshot)}]:raise ValueError('Snapshot differs; use new version')
    expected=sorted([dict(series_key=r['series_key'],year=r['year'],payload_json=canonical(r)) for r in comparisons],key=lambda r:(r['series_key'],r['year']))
    if db.execute('SELECT series_key,year,payload_json FROM editorial__oecd_attainment_comparisons WHERE version=? ORDER BY series_key,year',[version])!=expected:raise ValueError('Comparison readback differs')
    expected=sorted([dict(series_key=r['series_key'],payload_json=canonical(r)) for r in reviews],key=lambda r:r['series_key'])
    if db.execute('SELECT series_key,payload_json FROM editorial__evidence_series_reviews WHERE version=? ORDER BY series_key',[version])!=expected:raise ValueError('Review readback differs')

def main():
    bundle=json.loads((ROOT/'oecd-attainment-review.json').read_text());receipt,ref=load_reference();db=RecordRemote()
    try:snapshot,comparisons,reviews=apply(db,bundle,receipt,ref)
    finally:db.close()
    db=RecordRemote()
    try:
        verify(db,bundle,snapshot,comparisons,reviews)
        n=db.execute('SELECT count(*) AS n FROM editorial__oecd_attainment_verified WHERE version=?',[bundle['version']])[0]['n']
        if n!=48:raise ValueError('Verified reference view incomplete')
    finally:db.close()
    print('PASS direct OECD reconciliation: 2 series; 48 exact decimal matches; missing years 2001,2002 in both source selections; 2016 break flags retained.')
    print('PASS fresh-connection snapshot, comparison, review and reference-view verification; originals unchanged; original derivation not reconstructed; no causal effect inferred.')
if __name__=='__main__':main()
