"""Apply source-checked, scoped editorial reviews without rewriting migrated sources."""
import json,math
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse
from articles import canonical,digest
from period_analysis import RecordRemote
ROOT=Path(__file__).resolve().parent
META='series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class'
FIELDS='series_key,year,group_key,group_label,period,value,value_kind,validation_status,is_published,source_url,source_version'
def validate(bundle):
    seen=set()
    for r in bundle['reviews']:
        if r['series_key'] in seen:raise ValueError('Duplicate review')
        seen.add(r['series_key'])
        for k in ('expected_metadata_sha256','expected_rows_sha256'):
            if len(r[k])!=64 or any(c not in '0123456789abcdef' for c in r[k]):raise ValueError('Source digest required')
        if not all(r.get(k) for k in ('decision','limits','evidence_role','reviewed_on')):raise ValueError('Review scope required')
        if r.get('source_resolution_status'):
            if r['source_resolution_status']!='source_located_partial_value_check':raise ValueError('Cannot promote partial source check')
            for k in ('source_url','dataset_url','definition_url'):
                u=urlparse(r[k])
                if u.scheme!='https' or u.hostname not in ('www.oecd.org','data-explorer.oecd.org') or u.username or u.password:raise ValueError('Official OECD source required')
            if not r.get('rounded_checks') or r.get('interpolation_allowed') is not False:raise ValueError('Partial check scope required')
def apply(db,bundle):
    validate(bundle);version=bundle['version'];base=bundle['base_quality_version'];keys=[r['series_key'] for r in bundle['reviews']]
    db.execute('BEGIN')
    try:
        marks=','.join('?' for _ in keys)
        series=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        metadata={s['series_key']:s for s in series};by=defaultdict(list)
        for row in rows:by[row['series_key']].append(row)
        snapshot=digest(canonical(series)+canonical(rows))
        profiles={r['series_key']:json.loads(r['payload_json']) for r in db.execute('SELECT series_key,payload_json FROM editorial__evidence_series_profiles WHERE version=?',[base])}
        checks=0
        for r in bundle['reviews']:
            key=r['series_key'];p=profiles.get(key)
            if not p or key not in metadata:raise ValueError('Reviewed series missing')
            if digest(canonical(metadata[key]))!=r['expected_metadata_sha256'] or digest(canonical(by[key]))!=r['expected_rows_sha256']:raise ValueError('Reviewed source changed')
            if p['metadata_sha256']!=r['expected_metadata_sha256'] or p['rows_sha256']!=r['expected_rows_sha256']:raise ValueError('Quality snapshot mismatch')
            for c in r.get('rounded_checks',[]):
                found=[v for v in by[key] if v['year']==c['year'] and v['group_key']==r['group_key']]
                if len(found)!=1 or not math.isfinite(float(found[0]['value'])) or math.floor(float(found[0]['value'])+0.5)!=c['rounded_percent']:raise ValueError('Rounded source comparison differs')
                checks+=1
        db.execute('CREATE TABLE IF NOT EXISTS editorial__evidence_series_reviews(version TEXT NOT NULL,series_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key))')
        vals=[v for r in bundle['reviews'] for v in (version,r['series_key'],canonical(dict(r,base_quality_version=base)))]
        db.execute('INSERT INTO editorial__evidence_series_reviews VALUES '+','.join('(?,?,?)' for _ in keys)+' ON CONFLICT DO NOTHING',vals)
        verify(db,bundle)
        db.execute('''CREATE VIEW IF NOT EXISTS editorial__education_evidence_review AS
          SELECT r.version,r.series_key,json_extract(r.payload_json,'$.evidence_role') AS evidence_role,
          json_extract(r.payload_json,'$.decision') AS decision,json_extract(r.payload_json,'$.limits') AS limits,
          json_extract(r.payload_json,'$.source_url') AS located_source_url,
          json_extract(r.payload_json,'$.source_resolution_status') AS source_resolution_status,
          json_extract(r.payload_json,'$.requires_derivation_review') AS requires_derivation_review,
          json_extract(r.payload_json,'$.definition_supplement') AS definition_supplement,
          json_extract(r.payload_json,'$.definition_status') AS definition_status,
          json_extract(r.payload_json,'$.reviewed_on') AS reviewed_on,
          json_extract(r.payload_json,'$.expected_metadata_sha256')=json_extract(p.payload_json,'$.metadata_sha256')
          AND json_extract(r.payload_json,'$.expected_rows_sha256')=json_extract(p.payload_json,'$.rows_sha256') AS matches_reviewed_profile
          FROM editorial__evidence_series_reviews r
          JOIN editorial__evidence_series_profiles p ON p.series_key=r.series_key
          AND p.version=json_extract(r.payload_json,'$.base_quality_version')
          WHERE r.rowid=(SELECT max(n.rowid) FROM editorial__evidence_series_reviews n WHERE n.series_key=r.series_key)''')
        after_series=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        after_rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        if digest(canonical(after_series)+canonical(after_rows))!=snapshot:raise ValueError('Original source content changed')
        db.execute('COMMIT');return checks
    except:db.execute('ROLLBACK');raise

def verify(db,bundle):
    actual=db.execute('SELECT series_key,payload_json FROM editorial__evidence_series_reviews WHERE version=? ORDER BY series_key',[bundle['version']])
    expected=sorted([dict(series_key=r['series_key'],payload_json=canonical(dict(r,base_quality_version=bundle['base_quality_version']))) for r in bundle['reviews']],key=lambda r:r['series_key'])
    if actual!=expected:raise ValueError('Review readback differs; use new version')
def main():
    bundle=json.loads((ROOT/'education-evidence-reviews.json').read_text());db=RecordRemote()
    try:checks=apply(db,bundle)
    finally:db.close()
    db=RecordRemote()
    try:
        verify(db,bundle)
        n=db.execute('SELECT count(*) AS n FROM editorial__education_evidence_review WHERE version=? AND matches_reviewed_profile=1',[bundle['version']])[0]['n']
        if n!=len(bundle['reviews']):raise ValueError('Review view incomplete')
    finally:db.close()
    print('PASS scoped education reviews:',len(bundle['reviews']),'; located source documents:',sum(bool(r.get('source_url')) for r in bundle['reviews']),'; rounded year comparisons:',checks)
    print('PASS fresh-connection readback and review view; originals unchanged; no full-series or causal validation asserted.')
if __name__=='__main__':main()
