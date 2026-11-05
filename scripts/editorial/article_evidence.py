"""Versioned article-specific pressure, implementation and evidence supplements."""
import json,sys
from urllib.parse import urlparse
from articles import canonical,digest
from period_analysis import RecordRemote,norm
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__article_evidence_supplements(
version TEXT NOT NULL,article_id TEXT NOT NULL REFERENCES editorial__articles(id),
article_revision INTEGER NOT NULL,body_sha256 TEXT NOT NULL,supplement_id TEXT NOT NULL,
payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,article_id,supplement_id))'''
def validate(db,b):
    if not b.get('version') or not b.get('supplements'):raise ValueError('Empty supplement batch')
    seen=set()
    for s in b['supplements']:
        k=(s['article_id'],s['id'])
        if k in seen:raise ValueError('Duplicate supplement')
        seen.add(k)
        a=db.execute('SELECT body_text FROM editorial__articles WHERE id=?',[s['article_id']])
        rev=db.execute('SELECT max(revision_no) AS n FROM editorial__article_revisions WHERE article_id=?',[s['article_id']])[0]['n']
        if len(a)!=1 or rev!=s['article_revision'] or digest(a[0]['body_text'])!=s['body_sha256']:raise ValueError('Article changed')
        if len(s['article_passage'])<30 or norm(s['article_passage']) not in norm(a[0]['body_text']):raise ValueError('Exact article passage required')
        if any(not s.get(k) for k in ('pressure','choice_and_implementation','evidence','limits','addition_text','research_gap','alternative_explanation')):raise ValueError('Incomplete explanation chain')
        if s.get('causal_effect_identified') is not False:raise ValueError('Causal identification not established')
        if s.get('status')!='source_checked_interpretation':raise ValueError('Unsupported review status')
        ids={x['id'] for x in s['sources']}
        if len(ids)!=len(s['sources']):raise ValueError('Duplicate source')
        for x in s['sources']:
            u=urlparse(x['url'])
            if u.scheme!='https' or u.hostname not in ('kansalaisareena.fi','valtioneuvosto.fi','www.stea.fi','www.finlex.fi','www.kela.fi','www.tyollisyysrahasto.fi','stat.fi','labore.fi','academic.oup.com','tem.fi','tietotarjotin.fi','www.aeaweb.org','www.sjweh.fi','www.sttinfo.fi','link.springer.com','pubmed.ncbi.nlm.nih.gov','www.julkari.fi','www.varke.fi','www.lu.se','www.etk.fi','talouspolitiikanarviointineuvosto.fi','www.traficom.fi','vtv.fi','digital-markets-act.ec.europa.eu'):raise ValueError('Unreviewed source domain')
            if any(not x.get(k) for k in ('publisher','title','locator','checked_on','kind')):raise ValueError('Source scope missing')
        for e in s['evidence']:
            if e['source_id'] not in ids or not e['finding'] or not e['supports'] or not e['does_not_establish']:raise ValueError('Unscoped evidence')

def verify(db,b):
    rows=db.execute('SELECT article_id,supplement_id,payload_json FROM editorial__article_evidence_supplements WHERE version=? ORDER BY article_id,supplement_id',[b['version']])
    expected=sorted([dict(article_id=s['article_id'],supplement_id=s['id'],payload_json=canonical(s)) for s in b['supplements']],key=lambda r:(r['article_id'],r['supplement_id']))
    if rows!=expected:raise ValueError('Supplement readback differs')

def apply(db,b):
    db.execute('PRAGMA foreign_keys=ON');db.execute('BEGIN')
    try:
        validate(db,b)
        before=db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id')
        db.execute(SCHEMA)
        for s in b['supplements']:
            db.execute('INSERT INTO editorial__article_evidence_supplements VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING',[b['version'],s['article_id'],s['article_revision'],s['body_sha256'],s['id'],canonical(s)])
        verify(db,b)
        db.execute('''CREATE VIEW IF NOT EXISTS editorial__article_explanation_chains AS
SELECT s.article_id,a.title,s.article_revision,s.supplement_id,s.version,
json_extract(s.payload_json,'$.pressure') AS pressure_json,
json_extract(s.payload_json,'$.choice_and_implementation') AS implementation_json,
json_extract(s.payload_json,'$.evidence') AS evidence_json,
json_extract(s.payload_json,'$.addition_text') AS addition_text,
json_extract(s.payload_json,'$.limits') AS limits,
json_extract(s.payload_json,'$.research_gap') AS research_gap,
json_extract(s.payload_json,'$.article_passage') AS article_passage,
json_extract(s.payload_json,'$.sources') AS sources_json,
s.article_revision=(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=s.article_id) AS is_current
FROM editorial__article_evidence_supplements s JOIN editorial__articles a ON a.id=s.article_id
WHERE s.rowid=(SELECT max(n.rowid) FROM editorial__article_evidence_supplements n WHERE n.article_id=s.article_id AND n.supplement_id=s.supplement_id)''')
        if before!=db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id'):raise ValueError('Original article changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise

def main():
    b=json.load(sys.stdin);db=RecordRemote()
    try:apply(db,b)
    finally:db.close()
    db=RecordRemote()
    try:validate(db,b);verify(db,b)
    finally:db.close()
    print('PASS article-specific explanation supplements:',len(b['supplements']),'; articles:',len({s['article_id'] for s in b['supplements']}),'; fresh-connection verification; originals unchanged.')
if __name__=='__main__':main()
