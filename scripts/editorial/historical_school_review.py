"""Version original-page school definitions and cell checks; retain migrated originals."""
import json,re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
from articles import canonical,digest
from evidence_review import META,FIELDS,verify as verify_reviews
from period_analysis import RecordRemote
ROOT=Path(__file__).resolve().parent

def validate(bundle):
    u=urlparse(bundle['source']['url'])
    if u.scheme!='https' or u.hostname!='otos.stat.fi' or u.username or u.password:raise ValueError('Official yearbook source required')
    if not re.fullmatch('[a-f0-9]{64}',bundle['source']['sha256']):raise ValueError('Document digest required')
    reviews={r['series_key']:r for r in bundle['reviews']}
    if len(reviews)!=2 or len(bundle['cells'])!=17:raise ValueError('Expected two-series, seventeen-cell scope')
    seen=set()
    for r in reviews.values():
        if not all(r.get(k) for k in ('effective_title','definition_supplement','limits','source_locator','unit','expected_metadata_sha256','expected_rows_sha256')):raise ValueError('Definition and source scope required')
        if r['interpolation_allowed'] or r['causal_effect_identified']:raise ValueError('Unsupported interpretation')
        if r['series_key'].endswith('.literacy_school') and not (r.get('original_title_rejected') and r.get('title_correction_required')):raise ValueError('Incorrect original title must be rejected')
    for c in bundle['cells']:
        key=(c['series_key'],c['year'],c['group_key'])
        if key in seen or c['series_key'] not in reviews:raise ValueError('Duplicate or unknown source cell')
        seen.add(key)
        if c['pdf_page']!=reviews[c['series_key']]['source_pdf_page'] or not c['locator']:raise ValueError('Cell locator mismatch')
        if c['unit']!=('permille' if c['series_key'].endswith('.literacy_school') else 'pupils'):raise ValueError('Source unit mismatch')

def match_cells(bundle,rows):
    actual={(r['series_key'],r['year'],r['group_key']):r for r in rows}
    if len(actual)!=len(rows) or len(rows)!=len(bundle['cells']):raise ValueError('Unexpected migrated cells')
    for c in bundle['cells']:
        r=actual.get((c['series_key'],c['year'],c['group_key']))
        if not r or r['value'] is None or Decimal(str(r['value']))!=Decimal(c['value']) or r['period']!=c['period']:raise ValueError('Source cell value or period differs')

def apply(db,bundle):
    validate(bundle);version=bundle['version'];keys=[r['series_key'] for r in bundle['reviews']];marks=','.join('?' for _ in keys)
    db.execute('BEGIN')
    try:
        metadata=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        rows=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        before=digest(canonical(metadata)+canonical(rows));M={r['series_key']:r for r in metadata}
        for r in bundle['reviews']:
            current=[x for x in rows if x['series_key']==r['series_key']]
            if r['series_key'] not in M or digest(canonical(M[r['series_key']]))!=r['expected_metadata_sha256'] or digest(canonical(current))!=r['expected_rows_sha256']:raise ValueError('Reviewed source changed')
        match_cells(bundle,rows)
        db.execute('CREATE TABLE IF NOT EXISTS editorial__historical_school_sources(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__historical_school_cells(version TEXT NOT NULL,series_key TEXT NOT NULL,year INTEGER NOT NULL,group_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key,year,group_key))')
        db.execute('INSERT INTO editorial__historical_school_sources VALUES(?,?) ON CONFLICT DO NOTHING',[version,canonical(bundle['source'])])
        db.execute('INSERT INTO editorial__historical_school_cells VALUES '+','.join('(?,?,?,?,?)' for _ in bundle['cells'])+' ON CONFLICT DO NOTHING',[v for c in bundle['cells'] for v in (version,c['series_key'],c['year'],c['group_key'],canonical(c))])
        db.execute('INSERT INTO editorial__evidence_series_reviews VALUES '+','.join('(?,?,?)' for _ in keys)+' ON CONFLICT DO NOTHING',[v for r in bundle['reviews'] for v in (version,r['series_key'],canonical(r))])
        verify(db,bundle)
        db.execute('''CREATE VIEW IF NOT EXISTS editorial__historical_school_verified AS
          SELECT c.version,c.series_key,c.year,c.group_key,
          json_extract(c.payload_json,'$.value') AS source_value,
          json_extract(c.payload_json,'$.period') AS source_period,
          json_extract(c.payload_json,'$.unit') AS source_unit,
          json_extract(c.payload_json,'$.locator') AS cell_locator,
          json_extract(r.payload_json,'$.effective_title') AS effective_title,
          json_extract(r.payload_json,'$.original_title_rejected') AS original_title_rejected,
          json_extract(r.payload_json,'$.definition_supplement') AS definition,
          json_extract(r.payload_json,'$.limits') AS use_limits,
          json_extract(r.payload_json,'$.comparability_break_school_year') AS comparability_break_school_year,
          json_extract(s.payload_json,'$.url') AS source_url,
          json_extract(s.payload_json,'$.sha256') AS source_sha256
          FROM editorial__historical_school_cells c
          JOIN editorial__evidence_series_reviews r ON r.version=c.version AND r.series_key=c.series_key
          JOIN editorial__historical_school_sources s ON s.version=c.version''')
        after_m=db.execute('SELECT '+META+' FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        after_r=db.execute('SELECT '+FIELDS+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        if digest(canonical(after_m)+canonical(after_r))!=before:raise ValueError('Original source changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise

def verify(db,bundle):
    version=bundle['version'];verify_reviews(db,bundle)
    if db.execute('SELECT payload_json FROM editorial__historical_school_sources WHERE version=?',[version])!=[{'payload_json':canonical(bundle['source'])}]:raise ValueError('Source receipt differs; use new version')
    expected=sorted([dict(series_key=c['series_key'],year=c['year'],group_key=c['group_key'],payload_json=canonical(c)) for c in bundle['cells']],key=lambda x:(x['series_key'],x['year'],x['group_key']))
    if db.execute('SELECT series_key,year,group_key,payload_json FROM editorial__historical_school_cells WHERE version=? ORDER BY series_key,year,group_key',[version])!=expected:raise ValueError('Historical cell readback mismatch')

def main():
    b=json.loads((ROOT/'historical-school-review.json').read_text());db=RecordRemote()
    try:apply(db,b)
    finally:db.close()
    db=RecordRemote()
    try:
        verify(db,b)
        n=db.execute('SELECT count(*) AS n FROM editorial__historical_school_verified WHERE version=?',[b['version']])[0]['n']
        if n!=17:raise ValueError('Verified historical view incomplete')
    finally:db.close()
    print('PASS historical school source review: 2 series; 17 exact source cells; 1 original title rejected and corrected in review layer; school-year and 1930-1931 scope-break rules retained.')
    print('PASS fresh-connection source, cell, definition and verified-view readback; migrated sources unchanged; no interpolation or causal claim.')
if __name__=='__main__':main()
