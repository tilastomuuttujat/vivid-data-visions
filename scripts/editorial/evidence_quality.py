"""Structural review of migrated education evidence; original sources remain read only."""
import json,math,re
from collections import Counter,defaultdict
from urllib.parse import urlparse
from articles import canonical,digest
from period_analysis import RecordRemote
BASE='education-evidence-reuse-2026-11-05-v2'
VERSION='education-evidence-quality-2026-11-05-v1'
def safe_url(value):
    if not isinstance(value,str):return None
    try:
        u=urlparse(value.strip())
        if u.scheme!='https' or not u.hostname or u.username or u.password or u.fragment:return None
        if re.search(r'(token|secret|api.?key|password|signature|credential)',u.query,re.I):return None
        return value.strip()
    except ValueError:return None
def number(v):
    if v is None or str(v).strip()=='':return False
    try:return math.isfinite(float(v))
    except (ValueError,TypeError,OverflowError):return False
def profile(series,rows):
    flags=[];groups=defaultdict(list)
    for r in rows:groups[str(r['group_key'])].append(r)
    missing=[f for f in ('title','description','unit','geography','frequency') if not str(series.get(f) or '').strip()]
    if missing:flags.append('missing_definition_fields')
    kinds=Counter(str(r['value_kind'] or 'missing') for r in rows)
    states=Counter(str(r['validation_status'] or 'missing') for r in rows)
    labels=defaultdict(set);summaries=[]
    for key,rr in sorted(groups.items()):
        for r in rr:labels[key].add(str(r['group_label'] or ''))
        years=sorted({r['year'] for r in rr if isinstance(r['year'],int) and 1850<=r['year']<=2025})
        annual=str(series.get('frequency') or '').casefold() in ('annual','yearly','year','vuosi','vuosittain','a')
        summaries.append(dict(group_key=key,labels=sorted(labels[key]),rows=len(rr),year_min=min(years) if years else None,year_max=max(years) if years else None,distinct_years=len(years),
          interior_missing_years=(max(years)-min(years)+1-len(years)) if years and annual else None,
          annual_gap_assumption=annual))
    if any(len(v)>1 for v in labels.values()):flags.append('group_label_changes')
    if any(not number(r['value']) for r in rows if r['value'] is not None):flags.append('non_numeric_or_nonfinite_values')
    if any(r['value'] is None for r in rows):flags.append('null_values')
    if any(not isinstance(r['year'],int) or not 1850<=r['year']<=2025 for r in rows):flags.append('outside_historical_year_scope')
    if any(str(r['value_kind'] or '')!='observed' for r in rows):flags.append('value_kind_requires_review')
    if not rows:flags.append('no_rows')
    catalogue=safe_url(series.get('source_url'))
    urls=sorted({u for r in rows if (u:=safe_url(r['source_url']))})
    raw_sources=sorted({str(r['source_url']).strip() for r in rows if r['source_url'] is not None and str(r['source_url']).strip()})
    if catalogue:
        source=dict(status='catalogue_url_present_unverified',effective_url=catalogue,original_url=series.get('source_url'),basis='migrated series metadata')
    elif len(urls)==1 and len(raw_sources)==1 and rows and all(safe_url(r['source_url'])==urls[0] for r in rows):
        source=dict(status='unanimous_row_url_candidate',effective_url=urls[0],original_url=series.get('source_url'),basis='All stored observation rows carry the exact same safe HTTPS URL; document content not verified.')
    else:
        source=dict(status='requires_source_retrieval',effective_url=None,original_url=series.get('source_url'),basis='No complete unambiguous observation-level URL fallback.',distinct_safe_row_urls=len(urls))
        flags.append('unresolved_source_url')
    # Matching metadata alone does not validate concepts or statistical comparability.
    signature=digest(canonical({k:series.get(k) for k in ('title','description','unit','geography','frequency')}))
    return dict(series_key=series['series_key'],metadata_sha256=digest(canonical(series)),rows_sha256=digest(canonical(rows)),
      missing_definition_fields=missing,flags=sorted(set(flags)),row_count=len(rows),finite_numeric_rows=sum(number(r['value']) for r in rows),
      groups=summaries,value_kinds=dict(kinds),validation_statuses=dict(states),source_resolution=source,
      concept_metadata_signature=signature,status='needs_semantic_review',
      limits='Structural profile only. Observed label, finite number, source URL and metadata match do not establish validity, comparability or causal support.')
def run(db):
    db.execute('BEGIN')
    try:
        base_rows=db.execute('SELECT payload_json FROM editorial__evidence_audits WHERE version=?',[BASE])
        if len(base_rows)!=1:raise ValueError('Expected complete education audit missing')
        base=json.loads(base_rows[0]['payload_json']);keys=[s['series_key'] for s in base['series']]
        if not keys:raise ValueError('No selected education series')
        marks=','.join('?' for _ in keys)
        series=db.execute('SELECT series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        if len(series)!=len(keys) or any(s['published']!=1 for s in series):raise ValueError('Selected source metadata changed')
        fields='series_key,year,group_key,group_label,period,value,value_kind,validation_status,is_published,source_url,source_version'
        rows=db.execute('SELECT '+fields+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        before=digest(canonical(series)+canonical(rows))
        by=defaultdict(list)
        for row in rows:by[row['series_key']].append(row)
        profiles=[profile(s,by[s['series_key']]) for s in series]
        flags=Counter(f for p in profiles for f in p['flags'])
        source_states=Counter(p['source_resolution']['status'] for p in profiles)
        kinds=Counter()
        for p in profiles:kinds.update(p['value_kinds'])
        summary=dict(version=VERSION,base_audit=BASE,series_count=len(series),row_count=len(rows),
          finite_numeric_rows=sum(p['finite_numeric_rows'] for p in profiles),
          group_count=sum(len(p['groups']) for p in profiles),flag_counts=dict(flags),source_resolution_counts=dict(source_states),
          series_with_interior_annual_gaps=sum(any(g['interior_missing_years'] not in (None,0) for g in p['groups']) for p in profiles),
          source_snapshot_sha256=before,all_status='needs_semantic_review',
          limits='No original metadata or observations changed; inferred URL candidates require original-document verification; gaps are within group span only, not missing observations over 1850–2050.')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__evidence_quality_runs(version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__evidence_series_profiles(version TEXT NOT NULL,series_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key))')
        db.execute('CREATE TABLE IF NOT EXISTS editorial__source_resolution_candidates(version TEXT NOT NULL,series_key TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,series_key))')
        db.execute('INSERT INTO editorial__evidence_quality_runs VALUES(?,?) ON CONFLICT DO NOTHING',[VERSION,canonical(summary)])
        for offset in range(0,len(profiles),40):
            batch=profiles[offset:offset+40];sql=','.join('(?,?,?)' for _ in batch)
            db.execute('INSERT INTO editorial__evidence_series_profiles VALUES '+sql+' ON CONFLICT DO NOTHING',[v for p in batch for v in [VERSION,p['series_key'],canonical(p)]])
        resolutions=[p for p in profiles if not safe_url(next(s['source_url'] for s in series if s['series_key']==p['series_key']))]
        if resolutions:
            sql=','.join('(?,?,?)' for _ in resolutions)
            db.execute('INSERT INTO editorial__source_resolution_candidates VALUES '+sql+' ON CONFLICT DO NOTHING',[v for p in resolutions for v in [VERSION,p['series_key'],canonical(p['source_resolution'])]])
        verify(db,summary,profiles,resolutions)
        current=db.execute('SELECT '+fields+' FROM public__indicator_values WHERE series_key IN ('+marks+') ORDER BY series_key,year,group_key',keys)
        metadata=db.execute('SELECT series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class FROM public__indicator_series WHERE series_key IN ('+marks+') ORDER BY series_key',keys)
        if digest(canonical(metadata)+canonical(current))!=before:raise ValueError('Source snapshot changed')
        db.execute('COMMIT')
        return summary,profiles,resolutions
    except:db.execute('ROLLBACK');raise
def verify(db,summary,profiles,resolutions):
    r=db.execute('SELECT payload_json FROM editorial__evidence_quality_runs WHERE version=?',[VERSION])
    if r!=[{'payload_json':canonical(summary)}]:raise ValueError('Quality run differs; use new version')
    r=db.execute('SELECT series_key,payload_json FROM editorial__evidence_series_profiles WHERE version=? ORDER BY series_key',[VERSION])
    if r!=sorted([dict(series_key=p['series_key'],payload_json=canonical(p)) for p in profiles],key=lambda r:r['series_key']):raise ValueError('Profile readback mismatch')
    r=db.execute('SELECT series_key,payload_json FROM editorial__source_resolution_candidates WHERE version=? ORDER BY series_key',[VERSION])
    if r!=sorted([dict(series_key=p['series_key'],payload_json=canonical(p['source_resolution'])) for p in resolutions],key=lambda r:r['series_key']):raise ValueError('Source resolution readback mismatch')
def main():
    db=RecordRemote()
    try:summary,profiles,resolutions=run(db)
    finally:db.close()
    db=RecordRemote()
    try:verify(db,summary,profiles,resolutions)
    finally:db.close()
    print('PASS education quality review:',canonical(summary))
    print('PASS fresh-connection verification; source and article tables not modified; no candidate promoted to verified evidence.')
if __name__=='__main__':main()
