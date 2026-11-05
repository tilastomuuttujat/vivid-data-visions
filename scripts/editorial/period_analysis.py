"""Versioned interpretive period annotations; original articles remain immutable inputs."""
import json,re,sys,hashlib,sqlite3
from articles import Remote,canonical,digest,stmt,arg,decode

class RecordRemote(Remote):
    def execute(self,sql,params=()):
        result=self.db.execute([stmt(sql,[arg(v) for v in params])])[0]
        names=[c["name"] for c in result["cols"]]
        return [dict(zip(names,row)) for row in decode(result)]
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__period_analyses (
 id INTEGER PRIMARY KEY,article_id TEXT NOT NULL REFERENCES editorial__articles(id),
 article_revision INTEGER NOT NULL,body_sha256 TEXT NOT NULL,method_version TEXT NOT NULL,
 periods_json TEXT NOT NULL CHECK(json_valid(periods_json) AND json_type(periods_json)='array'),
 review_status TEXT NOT NULL DEFAULT 'proposed' CHECK(review_status IN ('proposed','reviewed')),
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(article_id,body_sha256,method_version));'''
def norm(s):return re.sub(r'\s+',' ',s).strip()
def validate(db,bundle):
    records=bundle['articles'];current={a['id']:a for a in db.execute('SELECT id,title,body_text FROM editorial__articles')}
    if len(records)!=len(current) or {a['id'] for a in records}!=set(current):raise ValueError('Must cover every current article exactly once')
    for item in records:
        a=current[item['id']]
        if item['body_sha256']!=digest(a['body_text']):raise ValueError('Source changed')
        if not item['periods']:raise ValueError('Missing analysis')
        for p in item['periods']:
            if not p['label'] or not p['mechanism'] or not 2<=len(p['keywords'])<=8:raise ValueError('Incomplete period')
            if not p['evidence'] or len(p['evidence'])<20 or norm(p['evidence']) not in norm(a['body_text']):raise ValueError('Evidence must be verbatim in current article')
            if p['dating'] not in ('explicit','interpreted','undated','future_scenario'):raise ValueError('Dating required')
            if p['start'] is not None and (not isinstance(p['start'],int) or not isinstance(p['end'],int) or p['start']>p['end']):raise ValueError('Invalid date interval')
            if p['dating']=='undated' and (p['start'] is not None or p['end'] is not None):raise ValueError('Undated intervals must remain null')
    return records

def save(db,bundle):
    db.execute('PRAGMA foreign_keys=ON');db.execute(SCHEMA)
    db.execute('CREATE INDEX IF NOT EXISTS editorial__period_analyses_article ON editorial__period_analyses(article_id,article_revision,id)')
    db.execute("""CREATE VIEW IF NOT EXISTS editorial__period_terms AS
    SELECT a.article_id,a.article_revision,a.body_sha256,a.review_status,
      json_extract(p.value,'$.start') AS year_start,json_extract(p.value,'$.end') AS year_end,
      json_extract(p.value,'$.label') AS period_label,json_extract(p.value,'$.dating') AS dating,
      k.value AS keyword,json_extract(p.value,'$.mechanism') AS mechanism,
      json_extract(p.value,'$.evidence') AS evidence
    FROM editorial__period_analyses a,json_each(a.periods_json) p,
      json_each(p.value,'$.keywords') k
    WHERE a.id=(SELECT max(b.id) FROM editorial__period_analyses b WHERE b.article_id=a.article_id)
      AND a.article_revision=(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.article_id)""")
    db.execute('BEGIN IMMEDIATE')
    try:
        records=validate(db,bundle)
        for a in records:
            rev=db.execute('SELECT max(revision_no) AS n FROM editorial__article_revisions WHERE article_id=?',[a['id']])[0]['n']
            if rev!=a['revision']:raise ValueError('Article revision changed')
            params=[a['id'],rev,a['body_sha256'],bundle['method_version'],canonical(a['periods'])]
            db.execute('INSERT INTO editorial__period_analyses(article_id,article_revision,body_sha256,method_version,periods_json) VALUES(?,?,?,?,?) ON CONFLICT(article_id,body_sha256,method_version) DO NOTHING',params)
            saved=db.execute('SELECT periods_json FROM editorial__period_analyses WHERE article_id=? AND body_sha256=? AND method_version=?',[a['id'],a['body_sha256'],bundle['method_version']])[0]
            if saved['periods_json']!=params[-1]:raise ValueError('Existing analysis differs; use a new method version')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise
    print('PASS period analyses stored and verified:',len(records),'articles;',sum(len(a['periods']) for a in records),'periods; originals unchanged.')
if __name__=='__main__':
    bundle=json.load(sys.stdin);db=RecordRemote()
    try:save(db,bundle)
    finally:db.close()
    db=RecordRemote()
    try:
        rows=db.execute('SELECT article_id,periods_json FROM editorial__period_analyses WHERE method_version=?',[bundle['method_version']])
        actual={r['article_id']:json.loads(r['periods_json']) for r in rows}
        expected={a['id']:a['periods'] for a in bundle['articles']}
        if actual!=expected:raise ValueError('Fresh-connection verification failed')
        print('PASS fresh connection:',len(rows),'analyses verified.')
    finally:db.close()
