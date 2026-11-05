"""Attach historical legal anchors to private narrative passages without editing articles."""
import json,sys
from pathlib import Path
from urllib.parse import urlparse
from articles import canonical,digest
from period_analysis import RecordRemote,norm
ROOT=Path(__file__).resolve().parent
CATALOGS={'income-security':'legal-anchors.json','education-work':'legal-anchors-education-work.json','civic':'legal-anchors-civic.json','justice':'legal-anchors-justice.json','market':'legal-anchors-market.json','environment':'legal-anchors-environment.json'}
def load_catalog(name='income-security'):
    if name not in CATALOGS:raise ValueError('Unknown legal anchor catalog')
    return json.loads((ROOT/CATALOGS[name]).read_text())
SCHEMAS=[
'''CREATE TABLE IF NOT EXISTS editorial__legal_anchors (
 anchor_set TEXT NOT NULL,id TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),PRIMARY KEY(anchor_set,id))''',
'''CREATE TABLE IF NOT EXISTS editorial__article_legal_links (
 id INTEGER PRIMARY KEY,method_version TEXT NOT NULL,article_id TEXT NOT NULL REFERENCES editorial__articles(id),
 article_revision INTEGER NOT NULL,body_sha256 TEXT NOT NULL,anchor_set TEXT NOT NULL,anchor_id TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 FOREIGN KEY(anchor_set,anchor_id) REFERENCES editorial__legal_anchors(anchor_set,id),
 UNIQUE(method_version,article_id,anchor_id))''',
'''CREATE VIEW IF NOT EXISTS editorial__narrative_decisions AS
 SELECT l.article_id,a.title,l.article_revision,l.method_version,l.anchor_id,
 json_extract(k.payload_json,'$.act_id') AS act_id,
 json_extract(k.payload_json,'$.title') AS decision_title,
 json_extract(k.payload_json,'$.atlas_decision_id') AS atlas_decision_id,
 json_extract(k.payload_json,'$.provisions') AS provisions_json,
 json_extract(k.payload_json,'$.enactment_date') AS enactment_date,
 json_extract(k.payload_json,'$.entry_into_force') AS entry_into_force,
 json_extract(k.payload_json,'$.objective') AS objective,
 json_extract(k.payload_json,'$.legal_change') AS legal_change,
 json_extract(k.payload_json,'$.impact_findings') AS impact_findings_json,
 json_extract(k.payload_json,'$.primary_url') AS primary_url,
 json_extract(l.payload_json,'$.relation_kind') AS relation_kind,
 json_extract(l.payload_json,'$.claim') AS narrative_claim,
 json_extract(l.payload_json,'$.mechanism') AS mechanism,
 json_extract(l.payload_json,'$.evidence') AS article_evidence,
 json_extract(l.payload_json,'$.research_question') AS research_question,
 l.article_revision=(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=l.article_id) AS is_current
 FROM editorial__article_legal_links l JOIN editorial__articles a ON a.id=l.article_id
 JOIN editorial__legal_anchors k ON k.anchor_set=l.anchor_set AND k.id=l.anchor_id
 WHERE l.id=(SELECT max(v.id) FROM editorial__article_legal_links v WHERE v.article_id=l.article_id AND v.anchor_id=l.anchor_id)'''
]
def validate(db,bundle,anchors):
    ids={a['id'] for a in anchors['anchors']};atlas={x['id'] for x in json.loads((ROOT.parents[1]/'src/data/lainsaadanto.json').read_text())['paatokset']}
    if len(ids)!=len(anchors['anchors']):raise ValueError('Duplicate anchor')
    for a in anchors['anchors']:
        if urlparse(a['primary_url']).hostname not in ('finlex.fi','www.finlex.fi'):raise ValueError('Primary legal source required')
        if not a['provisions'] or not a['version_scope'] or not a['limits']:raise ValueError('Missing legal scope')
        if a['atlas_decision_id'] and a['atlas_decision_id'] not in atlas:raise ValueError('Unknown Atlas decision')
        if a['impact_findings'] and a['impact_status']=='not_assessed':raise ValueError('Impact status mismatch')
        for f in a['impact_findings']:
            if not f['source_url'] or not f['limits']:raise ValueError('Impact finding must have its own source and scope')
    rows={x['id']:x for x in db.execute('SELECT id,body_text FROM editorial__articles')}
    seen=set()
    for l in bundle['links']:
        key=(l['article_id'],l['anchor_id'])
        if key in seen or l['anchor_id'] not in ids:raise ValueError('Duplicate or unknown link')
        seen.add(key);a=rows.get(l['article_id'])
        if not a or digest(a['body_text'])!=l['body_sha256']:raise ValueError('Article changed')
        rev=db.execute('SELECT max(revision_no) AS n FROM editorial__article_revisions WHERE article_id=?',[l['article_id']])[0]['n']
        if rev!=l['article_revision']:raise ValueError('Revision changed')
        if len(l['evidence'])<20 or norm(l['evidence']) not in norm(a['body_text']):raise ValueError('Passage not found')
        if l['relation_kind'] not in ('direct_mention','contextual_support','testable_mechanism'):raise ValueError('Relation type missing')
        if l['interpretation_status']!='proposed' or not l['research_question']:raise ValueError('Interpretation and research question required')
def import_links(db,bundle,anchors):
    db.execute('PRAGMA foreign_keys=ON')
    for sql in SCHEMAS:db.execute(sql)
    db.execute('BEGIN IMMEDIATE')
    try:
        validate(db,bundle,anchors)
        before=db.execute('SELECT id,title,summary,body_text FROM editorial__articles ORDER BY id')
        version=bundle['method_version']
        for a in anchors['anchors']:
            payload=canonical(a)
            db.execute('INSERT INTO editorial__legal_anchors(anchor_set,id,payload_json) VALUES(?,?,?) ON CONFLICT(anchor_set,id) DO NOTHING',[version,a['id'],payload])
            if db.execute('SELECT payload_json FROM editorial__legal_anchors WHERE anchor_set=? AND id=?',[version,a['id']])[0]['payload_json']!=payload:raise ValueError('Anchor differs; use new version')
        for l in bundle['links']:
            payload=canonical(l)
            db.execute('INSERT INTO editorial__article_legal_links(method_version,article_id,article_revision,body_sha256,anchor_set,anchor_id,payload_json) VALUES(?,?,?,?,?,?,?) ON CONFLICT(method_version,article_id,anchor_id) DO NOTHING',[version,l['article_id'],l['article_revision'],l['body_sha256'],version,l['anchor_id'],payload])
        verify(db,bundle)
        if db.execute('SELECT id,title,summary,body_text FROM editorial__articles ORDER BY id')!=before:raise ValueError('Originals changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise
    print('PASS legal links imported:',len(anchors['anchors']),'anchors;',len(bundle['links']),'links;',len({l['article_id'] for l in bundle['links']}),'articles; originals unchanged.')
def verify(db,bundle):
    rows=db.execute('SELECT payload_json FROM editorial__article_legal_links WHERE method_version=? ORDER BY article_id,anchor_id',[bundle['method_version']])
    actual=[json.loads(r['payload_json']) for r in rows]
    expected=sorted(bundle['links'],key=lambda r:(r['article_id'],r['anchor_id']))
    if actual!=expected:raise ValueError('Readback mismatch')
if __name__=='__main__':
    bundle=json.load(sys.stdin)
    anchors=load_catalog(bundle.get('anchor_catalog','income-security'));db=RecordRemote()
    try:import_links(db,bundle,anchors)
    finally:db.close()
    db=RecordRemote()
    try:verify(db,bundle);print('PASS fresh-connection verification of all narrative-law links.')
    finally:db.close()
