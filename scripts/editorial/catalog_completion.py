"""Append six source-checked statute identities; never synthesize graph metrics."""
import json,re
from pathlib import Path
from urllib.parse import urlparse
from articles import canonical
from legal_map import key,catalog_key,source_state
ROOT=Path(__file__).resolve().parent
PROVENANCE='''CREATE TABLE IF NOT EXISTS editorial__catalog_additions (
 statute_id TEXT PRIMARY KEY REFERENCES lakikartta__statute_catalog(id),
 source_version TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')))'''
def load(catalog='base'):
    files={'base':'lakikartta-catalog-additions.json','justice':'lakikartta-justice-additions.json'}
    if catalog not in files:raise ValueError('Unknown catalog addition set')
    return json.loads((ROOT/files[catalog]).read_text())
def validate(bundle):
    seen=set()
    for r in bundle['statutes']:
        k=key(r['act_id'])
        if not k or k in seen:raise ValueError('Invalid or duplicate statute identity')
        seen.add(k);n,y=k;u=urlparse(r['primary_url'])
        if u.scheme!='https' or u.hostname not in ('finlex.fi','www.finlex.fi') or u.path!=f'/fi/lainsaadanto/saadoskokoelma/{y}/{n}':raise ValueError('Primary source identity mismatch')
        if not r['title'] or not r['source_locator'] or not r['checked_on']:raise ValueError('Missing source metadata')
        if r['kind'] not in ('principal_act','amendment'):raise ValueError('Unknown statute kind')
        if (r['kind']=='amendment')!=(r['parent_act_id'] is not None):raise ValueError('Amendment parent required')
        if r['parent_act_id'] and not key(r['parent_act_id']):raise ValueError('Invalid parent citation')
        pattern=r'\d{4}' if r['date_precision']=='year' else r'\d{4}-\d{2}-\d{2}' if r['date_precision']=='day' else r'(?!)'
        if not re.fullmatch(pattern,r['enactment_date']) or int(r['enactment_date'][:4])!=y:raise ValueError('Enactment date mismatch')
def verify(db,bundle):
    for r in bundle['statutes']:
        n,y=key(r['act_id']);id=f'{y}/{n}'
        rows=db.execute('SELECT * FROM lakikartta__statute_catalog WHERE id=?',[id])
        if len(rows)!=1 or catalog_key(rows[0])!=(n,y) or rows[0]['title']!=r['title']:raise ValueError('Catalog completion readback mismatch')
        if rows[0]['source_version']==bundle['version']:
            if rows[0].get('_migration_key')!=canonical([id]):raise ValueError('Catalog migration key mismatch')
            fields=['in_force','in_degree','out_degree','total_degree','systemic_risk_score','budget_combined_eur','budget_katz_eur','bowtie_zone','clustering_in','debtrank_eur','delegation_total','he_attention','amendment_count','graph_cites_in','graph_cites_out']
            if any(rows[0].get(f) is not None for f in fields):raise ValueError('New identity must not invent status or metrics')
        p=db.execute('SELECT source_version,payload_json FROM editorial__catalog_additions WHERE statute_id=?',[id])
        if p!=[{'source_version':bundle['version'],'payload_json':canonical(r)}]:raise ValueError('Provenance readback mismatch')
def complete(db,bundle):
    validate(bundle);db.execute('PRAGMA foreign_keys=ON');db.execute('BEGIN IMMEDIATE')
    try:
        before_sources=source_state(db)[:3]
        before=db.execute('SELECT * FROM lakikartta__statute_catalog ORDER BY id')
        index={}
        for r in before:
            k=catalog_key(r)
            if k:index.setdefault(k,[]).append(r)
        db.execute(PROVENANCE);added=[]
        for r in bundle['statutes']:
            n,y=key(r['act_id']);id=f'{y}/{n}';matches=index.get((n,y),[])
            if len(matches)>1 or (matches and matches[0]['id']!=id):raise ValueError('Conflicting existing statute key')
            if matches:
                if matches[0]['title']!=r['title']:raise ValueError('Existing title differs; no overwrite allowed')
            else:
                db.execute('INSERT INTO lakikartta__statute_catalog(_migration_key,id,title,number,year,source_version) VALUES(?,?,?,?,?,?)',[canonical([id]),id,r['title'],str(n),y,bundle['version']]);added.append(id)
            db.execute('INSERT INTO editorial__catalog_additions(statute_id,source_version,payload_json) VALUES(?,?,?) ON CONFLICT(statute_id) DO NOTHING',[id,bundle['version'],canonical(r)])
        verify(db,bundle)
        after=db.execute('SELECT * FROM lakikartta__statute_catalog ORDER BY id')
        # All existing columns, including computed metrics, must remain byte-for-byte identical.
        if [r for r in after if r['id'] not in added]!=before:raise ValueError('Existing catalog content changed')
        if source_state(db)[:3]!=before_sources:raise ValueError('Article sources changed')
        db.execute('COMMIT')
    except:db.execute('ROLLBACK');raise
    return len(added)
