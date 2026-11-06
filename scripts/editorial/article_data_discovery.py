"""Collect migrated historical evidence candidates for two article scopes.

Raw migration and article tables are read only; candidates do not assert support.
"""
import json,math,sys
from datetime import datetime,timezone
from articles import canonical,digest
from period_analysis import RecordRemote
VERSION='article-historical-data-discovery-2026-11-06-v1'
SCOPES={
 '3a2d0a5f-214e-571c-a789-7d08c7ff180d':dict(name='Työ, tehtävät ja tuotannon rakennemuutos',terms=['työ','tyo','elinkein','ammatt','teollis','tuotan','employment','labour','labor','industry','occupation']),
 '06ee4840-4f91-5847-9e3b-e33a487dd8f0':dict(name='Valtion toiminta, rakentaminen ja yhteiset verkot',terms=['valtion','julkis','asunto','rakenta','rautatie','omist','public','housing','railway'])}
def matches(s,terms):return [t for t in terms if t in ((s.get('title') or '')+' '+(s.get('description') or '')).casefold()]
def collect(db):
    articles=db.execute('SELECT a.id,a.title,a.body_text,(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.id) AS revision FROM editorial__articles a ORDER BY a.id')
    selected=[a for a in articles if a['id'] in SCOPES]
    if len(selected)!=len(SCOPES):raise ValueError('Article scope missing')
    catalog=db.execute('SELECT series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class FROM public__indicator_series ORDER BY series_key')
    chosen=[s for s in catalog if s['published']==1 and any(matches(s,c['terms']) for c in SCOPES.values())]
    profiles=[]
    for offset in range(0,len(chosen),100):
        batch=chosen[offset:offset+100];keys=[s['series_key'] for s in batch];marks=','.join('?' for _ in keys)
        # Actual stored historical rows, never the catalogue's declared interval.
        groups=db.execute("SELECT series_key,group_key,group_label,count(*) AS rows,count(value) AS non_null_values,min(year) AS first_year,max(year) AS last_year,count(DISTINCT year) AS distinct_years,json_group_array(DISTINCT year) AS years_json,sum(CASE WHEN source_url IS NULL OR trim(source_url)='' THEN 1 ELSE 0 END) AS rows_without_source_url FROM public__indicator_values WHERE is_published=1 AND year BETWEEN 1850 AND 1975 AND series_key IN ("+marks+") GROUP BY series_key,group_key,group_label ORDER BY series_key,group_key,group_label",keys)
        quality=db.execute("SELECT series_key,value_kind,validation_status,count(*) AS rows FROM public__indicator_values WHERE is_published=1 AND year BETWEEN 1850 AND 1975 AND series_key IN ("+marks+") GROUP BY series_key,value_kind,validation_status ORDER BY series_key,value_kind,validation_status",keys)
        urls=db.execute("SELECT series_key,source_url,source_version,count(*) AS rows FROM public__indicator_values WHERE is_published=1 AND year BETWEEN 1850 AND 1975 AND series_key IN ("+marks+") GROUP BY series_key,source_url,source_version ORDER BY series_key,source_url,source_version",keys)
        for s in batch:
            gg=[g for g in groups if g['series_key']==s['series_key']]
            if not gg:continue
            for g in gg:
                g['stored_years']=sorted(json.loads(g.pop('years_json')))
                g['years_without_any_row_inside_span']=g['last_year']-g['first_year']+1-len(g['stored_years'])
                g['gap_interpretation']='Stored-year gaps only; not missingness against an approved observation schedule. Group-label cuts may overlap.'
            profiles.append(dict(series=s,groups=gg,value_kinds_and_validation=[q for q in quality if q['series_key']==s['series_key']],observation_sources=[u for u in urls if u['series_key']==s['series_key']],source_snapshot_sha256=digest(canonical([s,gg,[q for q in quality if q['series_key']==s['series_key']],[u for u in urls if u['series_key']==s['series_key']]])),status='candidate_not_source_verified'))
    items=db.execute('SELECT id,title,year_start,year_end,type,subtype,sources FROM public__items WHERE unpublished=0 AND year_start<=1975 AND coalesce(year_end,year_start)>=1850 ORDER BY id')
    reports=[]
    for a in selected:
        scope=SCOPES[a['id']];pp=[]
        for profile in profiles:
            terms=matches(profile['series'],scope['terms'])
            if terms:pp.append(dict(**profile,matched_terms=terms))
        events=[dict(**e,matched_terms=matches(e,scope['terms'])) for e in items if matches(e,scope['terms'])]
        reports.append(dict(article_id=a['id'],title=a['title'],article_revision=a['revision'],body_sha256=digest(a['body_text']),scope=scope,period=[1850,1975],series=pp,events=events,evidence_role='candidate_only',claim_support='not_assessed',required_review=['Validate concept, unit, geography and group definition against original source.','Check actual values and value kinds; non-null is not observed or numeric verification.','Check stored-year labels versus school/fiscal/reference periods.','Approve comparability and chaining separately; no interpolation or automatic aggregate index.','Link an exact article passage only after source and measurement review.']))
    # Re-read source metadata and article revisions before persisting the report.
    if catalog!=db.execute('SELECT series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class FROM public__indicator_series ORDER BY series_key'):raise ValueError('Catalogue changed')
    if articles!=db.execute('SELECT a.id,a.title,a.body_text,(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.id) AS revision FROM editorial__articles a ORDER BY a.id'):raise ValueError('Articles changed')
    return dict(version=VERSION,created_at=datetime.now(timezone.utc).isoformat(),catalogue_scanned=len(catalog),published_title_description_matches=len(chosen),historical_candidate_series=len(profiles),reports=reports,limits=['Keyword selection includes false positives and misses other terms; not an exhaustive database-wide search.','Historical-year counts are not continuous series or common fill rates.','Recorded source URLs and observed/validated labels are not independent source verification.','Source and article tables are never modified.'])
def store(db,report):
    db.execute('CREATE TABLE IF NOT EXISTS editorial__article_data_discoveries(version TEXT NOT NULL,article_id TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,article_id))')
    db.execute('BEGIN')
    try:
        for r in report['reports']:
            db.execute('INSERT INTO editorial__article_data_discoveries VALUES(?,?,?) ON CONFLICT DO NOTHING',[VERSION,r['article_id'],canonical(r)])
        actual=db.execute('SELECT article_id,payload_json FROM editorial__article_data_discoveries WHERE version=? ORDER BY article_id',[VERSION])
        expected=sorted([dict(article_id=r['article_id'],payload_json=canonical(r)) for r in report['reports']],key=lambda r:r['article_id'])
        if actual!=expected:raise ValueError('Candidate readback mismatch; new version required')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise

def main():
    db=RecordRemote()
    try:report=collect(db);store(db,report)
    finally:db.close()
    db=RecordRemote()
    try:
        actual=db.execute('SELECT article_id,payload_json FROM editorial__article_data_discoveries WHERE version=? ORDER BY article_id',[VERSION])
        if actual!=sorted([dict(article_id=r['article_id'],payload_json=canonical(r)) for r in report['reports']],key=lambda r:r['article_id']):raise ValueError('Fresh readback mismatch')
    finally:db.close()
    json.dump(report,sys.stdout,ensure_ascii=False)
if __name__=='__main__':main()
