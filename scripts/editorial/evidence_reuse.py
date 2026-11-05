"""Audit migrated evidence and create review candidates; never assert causality."""
import json,hashlib,re
from datetime import datetime,timezone
from period_analysis import RecordRemote
from articles import canonical,digest
VERSION='education-evidence-reuse-2026-11-05-v2'
SERIES='public__indicator_series'
VALUES='public__indicator_values'
ITEMS='public__items'
def run(db):
    tables={r['name'] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if not {SERIES,VALUES,ITEMS}<=tables:raise ValueError('Expected migrated source tables missing')
    # All source reads and candidate writes share one snapshot. No source mutation.
    db.execute('BEGIN')
    try:
        articles=db.execute("""SELECT DISTINCT a.id,a.title,a.body_text,
          (SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.id) AS revision
          FROM editorial__articles a JOIN editorial__narrative_decisions d ON d.article_id=a.id
          WHERE d.act_id='467/1968' AND d.is_current=1 ORDER BY a.id""")
        if not articles:raise ValueError('No current school reform article anchors')
        before=canonical(articles)
        totals={t:db.execute('SELECT count(*) AS n FROM '+t)[0]['n'] for t in (SERIES,VALUES,ITEMS)}
        all_series=db.execute('SELECT series_key,title,description,unit,geography,frequency,start_year,end_year,source,source_url,published,status,data_class FROM '+SERIES+' ORDER BY series_key')
        # Publication flag is necessary but not sufficient to validate any statistic.
        candidates=[s for s in all_series if s['published']==1 and any(k in (s['title'] or '').casefold() for k in ('koul','educat','oppil','tutkinto'))]
        candidates.sort(key=lambda s:(0 if 'peruskou' in (s['title'] or '').casefold() else 1,s['series_key']))
        chosen=candidates
        coverage={}
        if chosen:
            marks=','.join('?' for _ in chosen)
            rows=db.execute('SELECT series_key,count(*) AS rows,count(value) AS non_null_values,min(year) AS year_min,max(year) AS year_max,count(DISTINCT year) AS distinct_years,sum(CASE WHEN source_url IS NULL OR trim(source_url)=\'\' THEN 1 ELSE 0 END) AS rows_without_own_source_url FROM '+VALUES+' WHERE series_key IN ('+marks+') GROUP BY series_key',[s['series_key'] for s in chosen])
            coverage={r['series_key']:r for r in rows}
        items=db.execute('SELECT id,title,year_start,year_end,type,subtype,sources,unpublished FROM '+ITEMS+' WHERE unpublished=0 ORDER BY id')
        events=[i for i in items if 'peruskou' in (i['title'] or '').casefold()]
        for s in chosen:s['actual_coverage']=coverage.get(s['series_key'],{'rows':0,'non_null_values':0,'year_min':None,'year_max':None,'distinct_years':0,'rows_without_own_source_url':0})
        period_rows=[]
        for start,end in [(1850,1920),(1921,1969),(1970,1979),(1980,1999),(2000,2025)]:
            if chosen:
                marks=','.join('?' for _ in chosen)
                r=db.execute('SELECT count(*) AS rows,count(value) AS non_null_values,count(DISTINCT series_key) AS series FROM '+VALUES+' WHERE series_key IN ('+marks+') AND year BETWEEN ? AND ?',[s['series_key'] for s in chosen]+[start,end])[0]
            else:r={'rows':0,'non_null_values':0,'series':0}
            period_rows.append(dict(start=start,end=end,**r))
        def has_sources(v):
            if not v:return False
            try:return bool(json.loads(v)) if isinstance(v,str) else bool(v)
            except (ValueError,TypeError):return bool(str(v).strip())
        report=dict(version=VERSION,created_at=datetime.now(timezone.utc).isoformat(),source_totals=totals,article_count=len(articles),
          matched_published_series=len(candidates),audited_series=len(chosen),series_limit=None,selection='All published series with education terms in title; no candidate cap. Not a corpus-wide completeness audit.',
          series=chosen,events=events,period_rows=period_rows,
          series_without_catalogue_source_url=sum(not str(s['source_url'] or '').strip() for s in chosen),
          events_without_sources=sum(not has_sources(i['sources']) for i in events),
          limits=['Title matches are unreviewed candidates, not supporting evidence or causal links.',
          'Non-null value is not proof of an observed, numeric, validated, comparable or published observation.',
          'Year counts combine groups and geographies; they are not a fill-rate denominator.',
          'Source URL presence does not establish source quality, accessibility or extraction provenance.',
          'Zero matching rows means a gap in this scoped selection, not proof of no data in the database.'])
        tasks=[
          dict(id='education-definition-review',status='needs_review',question='Which candidate series actually measure educational access, completion or family-background differences?',required='Check unit, geography, groups, classification, value_kind, validation and original source before linking to a claim.'),
          dict(id='education-historical-coverage',status='needs_review',question='Do the selected data measure the pre-reform baseline and phased implementation at the required regional/cohort level?',required='Inspect source documents and other database tables before collecting new historical data. A national before/after series cannot identify the reform effect.'),
          dict(id='education-source-reconciliation',status='needs_review',question='Are the previously collected IFAU 2006:13 and IZA 4058 studies already represented in migrated sources?',required='Resolve exact source identities and versions; do not count working paper and journal versions as independent replications.')]
        report['research_tasks']=tasks
        db.execute("""CREATE TABLE IF NOT EXISTS editorial__evidence_audits(
          version TEXT PRIMARY KEY,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)))""")
        db.execute("""CREATE TABLE IF NOT EXISTS editorial__evidence_candidates(
          version TEXT NOT NULL,article_id TEXT NOT NULL,article_revision INTEGER NOT NULL,body_sha256 TEXT NOT NULL,
          source_table TEXT NOT NULL,source_key TEXT NOT NULL,source_sha256 TEXT NOT NULL,
          review_status TEXT NOT NULL CHECK(review_status='candidate'),evidence_role TEXT NOT NULL CHECK(evidence_role='context_only'),
          rationale TEXT NOT NULL,PRIMARY KEY(version,article_id,source_table,source_key))""")
        db.execute("""CREATE TABLE IF NOT EXISTS editorial__evidence_research_tasks(
          version TEXT NOT NULL,id TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
          PRIMARY KEY(version,id))""")
        # Immutable version: repeated run validates stored candidates rather than overwrites.
        existing=db.execute('SELECT payload_json FROM editorial__evidence_audits WHERE version=?',[VERSION])
        if existing:
            old=json.loads(existing[0]['payload_json']);report['created_at']=old['created_at']
            if canonical(old)!=canonical(report):raise ValueError('Audit inputs changed; use new version')
        else:db.execute('INSERT INTO editorial__evidence_audits VALUES(?,?)',[VERSION,canonical(report)])
        expected=[]
        for a in articles:
            for table,rows,key in [(SERIES,chosen,'series_key'),(ITEMS,events,'id')]:
                for r in rows:
                    vals=[VERSION,a['id'],a['revision'],digest(a['body_text']),table,str(r[key]),digest(canonical(r)),'candidate','context_only','Education title match attached to current reform article for source review; no causal or claim-support assertion.']
                    expected.append(vals)
        for offset in range(0,len(expected),30):
            batch=expected[offset:offset+30]
            marks=','.join('('+','.join('?' for _ in range(10))+')' for _ in batch)
            db.execute('INSERT INTO editorial__evidence_candidates VALUES '+marks+' ON CONFLICT DO NOTHING',[v for row in batch for v in row])
        for task in tasks:
            db.execute('INSERT INTO editorial__evidence_research_tasks VALUES(?,?,?) ON CONFLICT DO NOTHING',[VERSION,task['id'],canonical(task)])
        actual_tasks=db.execute('SELECT id,payload_json FROM editorial__evidence_research_tasks WHERE version=? ORDER BY id',[VERSION])
        if actual_tasks!=sorted([dict(id=t['id'],payload_json=canonical(t)) for t in tasks],key=lambda r:r['id']):raise ValueError('Research task mismatch')
        actual=db.execute('SELECT * FROM editorial__evidence_candidates WHERE version=? ORDER BY article_id,source_table,source_key',[VERSION])
        expected.sort(key=lambda v:(v[1],v[4],v[5]))
        if [list(r.values()) for r in actual]!=expected:raise ValueError('Candidate readback mismatch')
        after=db.execute("""SELECT DISTINCT a.id,a.title,a.body_text,
          (SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.id) AS revision
          FROM editorial__articles a JOIN editorial__narrative_decisions d ON d.article_id=a.id
          WHERE d.act_id='467/1968' AND d.is_current=1 ORDER BY a.id""")
        if canonical(after)!=before:raise ValueError('Article inputs changed')
        if {t:db.execute('SELECT count(*) AS n FROM '+t)[0]['n'] for t in (SERIES,VALUES,ITEMS)}!=totals:raise ValueError('Source counts changed')
        db.execute('COMMIT')
        return report,len(expected)
    except:db.execute('ROLLBACK');raise
def main():
    db=RecordRemote()
    try:report,n=run(db)
    finally:db.close()
    db=RecordRemote()
    try:
        stored=db.execute('SELECT payload_json FROM editorial__evidence_audits WHERE version=?',[VERSION])
        if len(stored)!=1 or json.loads(stored[0]['payload_json'])!=report:raise ValueError('Fresh audit verification failed')
        if db.execute('SELECT count(*) AS n FROM editorial__evidence_candidates WHERE version=?',[VERSION])[0]['n']!=n:raise ValueError('Fresh candidate verification failed')
    finally:db.close()
    # Aggregate-only output: no article bodies, unpublished titles, rows or credentials.
    print('PASS migrated-evidence audit:',canonical({k:report[k] for k in ['source_totals','article_count','matched_published_series','audited_series','series_without_catalogue_source_url','events_without_sources','period_rows']}))
    print('PASS review candidates:',n,'; matched published school events:',len(report['events']),'; research tasks:',len(report['research_tasks']))
    print('PASS fresh-connection verification; source tables and articles not modified; all candidates remain context_only.')
if __name__=='__main__':main()
