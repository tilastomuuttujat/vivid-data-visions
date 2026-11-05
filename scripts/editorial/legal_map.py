"""Connect existing narrative links to the actual Turso Lakikartta catalog.
Exact statute number/year only. No title similarity or implied causal edges.
"""
import json,re,sys
from articles import canonical,digest
from period_analysis import RecordRemote
VERSION='lakikartta-exact-2026-11-05-v2'
def number(value):
    s=str(value).strip()
    if not re.fullmatch(r'\d+',s):return None
    return int(s)
def key(act):
    m=re.fullmatch(r'(\d+)/(\d{4})',act.strip())
    return (int(m[1]),int(m[2])) if m else None
def catalog_key(row):
    n,y=number(row['number']),number(row['year'])
    # Native catalog IDs use year/number, unlike an act citation number/year.
    m=re.fullmatch(r'(\d{4})/(\d+)',str(row['id']).strip())
    from_id=(int(m[2]),int(m[1])) if m else None
    if from_id:
        if y is not None and y!=from_id[1]:raise ValueError('Conflicting catalog year')
        if n is not None and n!=from_id[0]:raise ValueError('Conflicting catalog number')
        # Missing fields can be recovered only from an exact native identifier.
        if row['number'] not in (None,'') and n is None:raise ValueError('Unsupported catalog number')
        return from_id
    return (n,y) if n is not None and y is not None else None
def resolve(anchors,catalog):
    index={}
    for r in catalog:
        k=catalog_key(r)
        if k is not None:index.setdefault(k,[]).append(r)
    result=[]
    for a in anchors:
        act=json.loads(a['payload_json'])['act_id'];k=key(act)
        if k is None:raise ValueError('Unrecognized anchor act identifier')
        matches=index.get(k,[])
        if len(matches)>1:raise ValueError('Ambiguous catalog statute number/year')
        result.append(dict(anchor_set=a['anchor_set'],anchor_id=a['id'],act_id=act,statute_id=matches[0]['id'] if matches else None,status='exact' if matches else 'unmatched'))
    return result
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__lakikartta_links (
 anchor_set TEXT NOT NULL,anchor_id TEXT NOT NULL,act_id TEXT NOT NULL,
 statute_id TEXT REFERENCES lakikartta__statute_catalog(id),
 status TEXT NOT NULL CHECK(status IN ('exact','unmatched')),
 method_version TEXT NOT NULL,
 CHECK((status='exact' AND statute_id IS NOT NULL) OR (status='unmatched' AND statute_id IS NULL)),
 PRIMARY KEY(anchor_set,anchor_id),
 FOREIGN KEY(anchor_set,anchor_id) REFERENCES editorial__legal_anchors(anchor_set,id))'''
VIEW='''CREATE VIEW editorial__article_lakikartta AS
 SELECT n.*,m.statute_id AS lakikartta_statute_id,m.status AS lakikartta_match_status,
 m.method_version AS mapping_method,
 CASE WHEN c.id IS NULL THEN NULL WHEN c.number IS NULL OR c.number='' THEN 'catalog_id' ELSE 'number_year' END AS identity_basis,c.title AS lakikartta_title,c.source_version AS lakikartta_source_version,
 json_extract(l.payload_json,'$.interpretation_status') AS interpretation_status,
 CASE WHEN m.statute_id IS NULL THEN 0 ELSE
 (SELECT count(*) FROM lakikartta__assessment_cases x WHERE x.statute_id=m.statute_id) END AS assessment_case_count,
 CASE WHEN m.statute_id IS NULL THEN 0 ELSE
 (SELECT count(*) FROM lakikartta__historical_legal_events x WHERE x.statute_id=m.statute_id) END AS historical_event_count
 FROM editorial__narrative_decisions n
 JOIN editorial__article_legal_links l ON l.article_id=n.article_id AND l.anchor_id=n.anchor_id AND l.method_version=n.method_version
 LEFT JOIN editorial__lakikartta_links m ON m.anchor_set=l.anchor_set AND m.anchor_id=l.anchor_id
 LEFT JOIN lakikartta__statute_catalog c ON c.id=m.statute_id'''
REVERSE='''CREATE VIEW lakikartta__article_connections AS
 SELECT * FROM editorial__article_lakikartta
 WHERE lakikartta_match_status='exact' AND is_current=1'''
UNMATCHED='''CREATE VIEW editorial__lakikartta_unmatched AS
 SELECT * FROM editorial__article_lakikartta
 WHERE lakikartta_match_status IS NULL OR lakikartta_match_status='unmatched' '''
def source_state(db):
    # No source bodies or private passages are emitted to logs.
    return [digest(canonical(db.execute(sql))) for sql in [
      'SELECT id,title,summary,body_text FROM editorial__articles ORDER BY id',
      'SELECT * FROM editorial__article_legal_links ORDER BY id',
      'SELECT * FROM editorial__legal_anchors ORDER BY anchor_set,id',
      'SELECT * FROM lakikartta__statute_catalog ORDER BY id']]
def current_anchors(db):
    return db.execute('''SELECT DISTINCT a.anchor_set,a.id,a.payload_json
    FROM editorial__legal_anchors a JOIN editorial__article_legal_links l
    ON l.anchor_set=a.anchor_set AND l.anchor_id=a.id
    JOIN editorial__narrative_decisions n ON n.article_id=l.article_id
    AND n.anchor_id=l.anchor_id AND n.method_version=l.method_version
    ORDER BY a.anchor_set,a.id''')
def verify(db,expected):
    actual=db.execute('SELECT anchor_set,anchor_id,act_id,statute_id,status FROM editorial__lakikartta_links WHERE method_version=? ORDER BY anchor_set,anchor_id',[VERSION])
    if actual!=sorted(expected,key=lambda x:(x['anchor_set'],x['anchor_id'])):raise ValueError('Mapping readback mismatch')
    catalog=db.execute('SELECT id,number,year FROM lakikartta__statute_catalog')
    if resolve(current_anchors(db),catalog)!=expected:raise ValueError('Mapping source changed')
    # Compare actual joins and cardinality, including unmatched anchors.
    rows=db.execute('SELECT article_id,anchor_id,method_version,lakikartta_statute_id,lakikartta_match_status FROM editorial__article_lakikartta')
    if len(rows)!=len(db.execute('SELECT * FROM editorial__narrative_decisions')):raise ValueError('Narrative cardinality changed')
    lookup={(r['anchor_set'],r['anchor_id']):r for r in expected}
    for r in rows:
        m=lookup[(r['method_version'],r['anchor_id'])]
        if r['lakikartta_statute_id']!=m['statute_id'] or r['lakikartta_match_status']!=m['status']:raise ValueError('Joined mapping mismatch')
    return rows

def sync(db):
    db.execute('PRAGMA foreign_keys=ON');db.execute('BEGIN IMMEDIATE')
    try:
        before=source_state(db)
        expected=resolve(current_anchors(db),db.execute('SELECT id,number,year FROM lakikartta__statute_catalog'))
        db.execute(SCHEMA)
        for r in expected:
            db.execute('''INSERT INTO editorial__lakikartta_links(anchor_set,anchor_id,act_id,statute_id,status,method_version)
            VALUES(?,?,?,?,?,?) ON CONFLICT(anchor_set,anchor_id) DO UPDATE SET
            act_id=excluded.act_id,statute_id=excluded.statute_id,status=excluded.status,method_version=excluded.method_version''',
            [r['anchor_set'],r['anchor_id'],r['act_id'],r['statute_id'],r['status'],VERSION])
        for name in ['lakikartta__article_connections','editorial__lakikartta_unmatched','editorial__article_lakikartta']:
            db.execute('DROP VIEW IF EXISTS '+name)
        for sql in [VIEW,REVERSE,UNMATCHED]:db.execute(sql)
        verify(db,expected)
        if source_state(db)!=before:raise ValueError('Source content changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise
    return expected
if __name__=='__main__':
    if '--audit' in sys.argv:
        db=RecordRemote()
        try:
            print('Catalog schema:',json.dumps(db.execute("SELECT type,sql FROM sqlite_master WHERE name='lakikartta__statute_catalog'"),ensure_ascii=False))
            anchors=current_anchors(db)
            catalog=db.execute('SELECT id,number,year,title FROM lakikartta__statute_catalog ORDER BY id')
            pending=[r for r in resolve(anchors,catalog) if r['status']=='unmatched']
            print('Catalog identifier samples:',json.dumps(catalog[:5],ensure_ascii=False))
            for act in sorted({r['act_id'] for r in pending}):
                n,y=act.split('/')
                candidates=[r for r in catalog if str(r['number']).strip()==n or r['id'] in [act,y+'/'+n,y+'-'+n,y+n.zfill(4)] or any(term in (r['title'] or '').lower() for term in {'609/1986':['tasa-arvo'],'503/1989':['yhdistyslaki'],'410/2015':['kuntalaki'],'612/2021':['sosiaali- ja terveydenhuollon järjestämisestä'],'1412/1997':['toimeentulotuesta'],'1214/2020':['oppivelvollisuus'],'1325/2014':['yhdenvertaisuus']}.get(act,[]))]
                print('Catalog candidates',act,json.dumps(candidates[:12],ensure_ascii=False))
        finally:db.close()
        sys.exit(0)
    if '--complete' in sys.argv:
        from catalog_completion import complete,load,verify as verify_completion
        bundle=load('justice' if '--justice' in sys.argv else 'market' if '--market' in sys.argv else 'base');db=RecordRemote()
        try:added=complete(db,bundle)
        finally:db.close()
        db=RecordRemote()
        try:verify_completion(db,bundle)
        finally:db.close()
        print('PASS source-checked catalog completion:',added,'new statutes;',len(bundle['statutes']),'identities verified; originals unchanged; metrics not synthesized.')
    db=RecordRemote()
    try:expected=sync(db)
    finally:db.close()
    db=RecordRemote()
    try:
        rows=verify(db,expected)
        exact=[r for r in rows if r['lakikartta_match_status']=='exact']
        print('PASS fresh-connection Lakikartta mapping:',len(expected),'anchors;',len(exact),'exact article links;',len(rows)-len(exact),'unmatched article links;',len({r['article_id'] for r in exact}),'articles; sources unchanged.')
        print('Unmatched statute identifiers:',','.join(sorted({r['act_id'] for r in expected if r['status']=='unmatched'})) or 'none')
    finally:db.close()
