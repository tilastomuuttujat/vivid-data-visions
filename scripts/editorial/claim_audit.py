"""Private editorial classifications; never modifies article text or source supplements."""
import json,sys
from articles import canonical,digest
from period_analysis import RecordRemote
TYPES={'description','association','mechanism_hypothesis','causal_estimate','scenario','assessment_rule','normative_proposal','unclassified'}
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__claim_reviews(version TEXT NOT NULL,article_id TEXT NOT NULL,supplement_id TEXT NOT NULL,article_revision INTEGER NOT NULL,body_sha256 TEXT NOT NULL,supplement_sha256 TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,article_id,supplement_id))'''
def validate(db,b):
    rows=db.execute('SELECT s.article_id,s.supplement_id,s.version,s.payload_json FROM editorial__article_evidence_supplements s WHERE s.rowid=(SELECT max(n.rowid) FROM editorial__article_evidence_supplements n WHERE n.article_id=s.article_id AND n.supplement_id=s.supplement_id)')
    source={(r['article_id'],r['supplement_id']):json.loads(r['payload_json']) for r in rows}
    versions={(r['article_id'],r['supplement_id']):r['version'] for r in rows}
    seen=set()
    if not b.get('version'):raise ValueError('Version missing')
    for r in b['reviews']:
        k=(r['article_id'],r['supplement_id'])
        if k in seen or k not in source:raise ValueError('Invalid claim identity')
        seen.add(k);s=source[k]
        a=db.execute('SELECT body_text FROM editorial__articles WHERE id=?',[k[0]])[0]
        rev=db.execute('SELECT max(revision_no) AS n FROM editorial__article_revisions WHERE article_id=?',[k[0]])[0]['n']
        if r.get('source_version')!=versions[k]:raise ValueError('Changed source version')
        if r['article_revision']!=rev or r['body_sha256']!=digest(a['body_text']) or r['supplement_sha256']!=digest(canonical(s)):raise ValueError('Changed source')
        if r['claim_type'] not in TYPES or not r.get('rationale') or r['review_status']!='editorial_proposal':raise ValueError('Invalid classification')
        # Publication year and placement period cannot substitute for observation years.
        if r['observation_periods'] is not None:raise ValueError('Observation periods require a separate source-specific review')
    if seen!=set(source):raise ValueError('Must cover every current supplement')
    if {k[0] for k in seen}!={a['id'] for a in db.execute('SELECT id FROM editorial__articles')}:raise ValueError('Must cover article library')
def apply(db,b):
    db.execute('BEGIN')
    try:
        validate(db,b);db.execute(SCHEMA)
        before=db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id')
        for r in b['reviews']:db.execute('INSERT INTO editorial__claim_reviews VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',[b['version'],r['article_id'],r['supplement_id'],r['article_revision'],r['body_sha256'],r['supplement_sha256'],canonical(r)])
        actual=db.execute('SELECT payload_json FROM editorial__claim_reviews WHERE version=? ORDER BY article_id,supplement_id',[b['version']])
        expected=[{'payload_json':canonical(r)} for r in sorted(b['reviews'],key=lambda r:(r['article_id'],r['supplement_id']))]
        if actual!=expected:raise ValueError('Readback mismatch')
        if before!=db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id'):raise ValueError('Article changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise

def main():
    b=json.load(sys.stdin);db=RecordRemote()
    try:apply(db,b)
    finally:db.close()
    db=RecordRemote()
    try:
        validate(db,b)
        actual=db.execute('SELECT payload_json FROM editorial__claim_reviews WHERE version=? ORDER BY article_id,supplement_id',[b['version']])
        assert actual==[{'payload_json':canonical(r)} for r in sorted(b['reviews'],key=lambda r:(r['article_id'],r['supplement_id']))]
        n=len(actual)
    finally:db.close()
    print('PASS claim review classifications:',n,'; articles:',len({r['article_id'] for r in b['reviews']}),'; fresh connection; originals unchanged.')
if __name__=='__main__':main()
