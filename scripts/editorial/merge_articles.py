"""Lossless logical consolidation: original identities and relation rows remain immutable."""
import json,sys,re
from articles import canonical,digest
from period_analysis import RecordRemote,norm
VERSION='article-consolidation-2026-11-07-v1'
PAIRS=[('0cb96576-dc1f-59e5-903e-f1758c3fcef0','a3c8712d-95be-514c-8a71-6c784a0e0d9d'),('88ed3934-0187-5858-af29-cc237735ef7e','6f4ef8d2-75d4-55c3-802d-f05cb806ed9f')]
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__article_merges(alias_article_id TEXT PRIMARY KEY REFERENCES editorial__articles(id),canonical_article_id TEXT NOT NULL REFERENCES editorial__articles(id),version TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),CHECK(alias_article_id<>canonical_article_id))'''
def revision(db,aid):return db.execute('SELECT max(revision_no) AS n FROM editorial__article_revisions WHERE article_id=?',[aid])[0]['n']
def article(db,aid):
 rows=db.execute('SELECT * FROM editorial__articles WHERE id=?',[aid])
 if len(rows)!=1:raise ValueError('Missing article')
 return rows[0]
def relations(db,aid):
 names=getattr(db,'_merge_relation_tables',None)
 if names is None:
  names=[]
  for t in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'editorial__%' ORDER BY name"):
   name=t['name']
   if not re.fullmatch(r'[a-z_][a-z0-9_]*',name):raise ValueError('Unexpected table identifier')
   cols={r['name'] for r in db.execute('PRAGMA table_info('+name+')')}
   if 'article_id' in cols:names.append(name)
  db._merge_relation_tables=names
 return {name:db.execute('SELECT * FROM '+name+' WHERE article_id=? ORDER BY rowid',[aid]) for name in names}
def views(db):
 db.execute('DROP VIEW IF EXISTS editorial__article_catalog')
 db.execute('''CREATE VIEW editorial__article_catalog AS SELECT a.id,a.source_id,a.source_position,a.source_number,a.title,a.summary,a.status,a.tags_json,a.review_flags_json,a.page_start,a.page_end,length(a.body_text) AS characters,a.updated_at,(SELECT max(r.revision_no) FROM editorial__article_revisions r WHERE r.article_id=a.id) AS revision FROM editorial__articles a WHERE NOT EXISTS(SELECT 1 FROM editorial__article_merges m WHERE m.alias_article_id=a.id)''')
 db.execute('''CREATE VIEW IF NOT EXISTS editorial__canonical_articles AS SELECT a.* FROM editorial__articles a WHERE NOT EXISTS(SELECT 1 FROM editorial__article_merges m WHERE m.alias_article_id=a.id)''')
 db.execute('''CREATE VIEW IF NOT EXISTS editorial__article_membership AS SELECT a.id AS origin_article_id,coalesce(m.canonical_article_id,a.id) AS canonical_article_id FROM editorial__articles a LEFT JOIN editorial__article_merges m ON m.alias_article_id=a.id''')
 for t in relations(db,PAIRS[0][0]):
  suffix=t.removeprefix('editorial__');name='editorial__canonical_'+suffix
  db.execute('CREATE VIEW IF NOT EXISTS '+name+' AS SELECT m.canonical_article_id,t.* FROM '+t+' t JOIN editorial__article_membership m ON m.origin_article_id=t.article_id')
 if db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='editorial__article_numbers'"):
  from article_numbering import rebuild_views
  rebuild_views(db)
def merge(db,plan):
 if plan.get('version')!=VERSION or [(p['canonical'],p['alias']) for p in plan['pairs']]!=PAIRS:raise ValueError('Unapproved merge scope')
 db.execute('PRAGMA foreign_keys=ON');db.execute('BEGIN IMMEDIATE')
 try:
  db.execute(SCHEMA)
  for p in plan['pairs']:
   owner,alias=p['canonical'],p['alias'];a=article(db,owner);b=article(db,alias)
   existing=db.execute('SELECT payload_json FROM editorial__article_merges WHERE alias_article_id=?',[alias])
   if existing:
    old=json.loads(existing[0]['payload_json'])
    if old['plan']!=p:raise ValueError('Merge plan changed')
    continue
   if a['title']!=b['title'] or a['status']=='archived' or b['status']=='archived':raise ValueError('Merge titles or states differ')
   if digest(a['body_text'])!=p['canonical_sha256'] or digest(b['body_text'])!=p['alias_sha256'] or revision(db,owner)!=p['canonical_revision'] or revision(db,alias)!=p['alias_revision']:raise ValueError('Article changed')
   if p.get('exact_duplicate') is True and a['body_text']!=b['body_text']:raise ValueError('Exact duplicate differs')
   before=relations(db,alias);bindings={};equivalent={}
   native={(r['version'],r['supplement_id']):json.loads(r['payload_json']) for r in relations(db,owner).get('editorial__article_evidence_supplements',[])}
   for s in before.get('editorial__article_evidence_supplements',[]):
    payload=json.loads(s['payload_json']);comparable=dict(payload,article_id=owner)
    if native.get((s['version'],s['supplement_id']))==comparable:equivalent[s['version']+'/'+s['supplement_id']]=s['version']+'/'+s['supplement_id']
    passage=norm(payload.get('article_passage',''))
    bindings[s['version']+'/'+s['supplement_id']]=bool(len(passage)>=30 and passage in norm(a['body_text']) and s['article_revision']==p['alias_revision'] and payload.get('body_sha256')==p['alias_sha256'])
   snapshot=dict(plan=p,original_article=b,canonical_revision=p['canonical_revision'],original_revision=p['alias_revision'],same_text=a['body_text']==b['body_text'],supplement_matches=bindings,equivalent_supplements=equivalent,relations=before)
   db.execute('INSERT INTO editorial__article_merges(alias_article_id,canonical_article_id,version,payload_json) VALUES(?,?,?,?)',[alias,owner,VERSION,canonical(snapshot)])
   db.execute("UPDATE editorial__articles SET status='archived',change_note=? WHERE id=?",['Yhdistetty artikkeliin '+owner+'. Alkuperäinen teksti, historia ja kaikki kytkennät säilytetty.',alias])
   if article(db,owner)!=a or article(db,alias)['body_text']!=b['body_text']:raise ValueError('Original text changed')
   after=relations(db,alias)
   for t,rows in before.items():
    actual=after[t]
    if t=='editorial__article_revisions':actual=actual[:-1]
    if actual!=rows:raise ValueError('Original relations changed')
  views(db)
  db.execute("CREATE TRIGGER IF NOT EXISTS editorial__merged_article_readonly BEFORE UPDATE ON editorial__articles WHEN EXISTS(SELECT 1 FROM editorial__article_merges WHERE alias_article_id=OLD.id) BEGIN SELECT RAISE(ABORT,'Merged article is archived; edit canonical article'); END")
  db.execute("CREATE TRIGGER IF NOT EXISTS editorial__merges_no_update BEFORE UPDATE ON editorial__article_merges BEGIN SELECT RAISE(ABORT,'Merge provenance is immutable'); END")
  db.execute("CREATE TRIGGER IF NOT EXISTS editorial__merges_no_delete BEFORE DELETE ON editorial__article_merges BEGIN SELECT RAISE(ABORT,'Merge provenance is immutable'); END")
  verify(db,plan);db.execute('COMMIT')
 except:db.execute('ROLLBACK');raise

def verify(db,plan):
 for p in plan['pairs']:
  owner,alias=p['canonical'],p['alias'];row=db.execute('SELECT * FROM editorial__article_merges WHERE alias_article_id=?',[alias])
  if len(row)!=1 or row[0]['canonical_article_id']!=owner:raise ValueError('Alias readback differs')
  s=json.loads(row[0]['payload_json'])
  if s['plan']!=p or article(db,alias)['status']!='archived' or digest(article(db,alias)['body_text'])!=p['alias_sha256'] or digest(article(db,owner)['body_text'])!=p['canonical_sha256']:raise ValueError('Archive readback differs')
  if db.execute('SELECT id FROM editorial__article_catalog WHERE id=?',[alias]) or not db.execute('SELECT id FROM editorial__article_catalog WHERE id=?',[owner]):raise ValueError('Catalogue consolidation failed')
  current_relations=relations(db,alias)
  for t,rows in s['relations'].items():
   actual=current_relations[t]
   if any(r not in actual for r in rows):raise ValueError('Original relation lost')
   view='editorial__canonical_'+t.removeprefix('editorial__')
   if db.execute('SELECT count(*) AS n FROM '+view+' WHERE canonical_article_id=? AND article_id=?',[owner,alias])[0]['n']!=len(actual):raise ValueError('Consolidated relations incomplete')
 # Each retained title occurs once in the active logical library.
 for owner,_ in PAIRS:
  title=article(db,owner)['title']
  if db.execute('SELECT count(*) AS n FROM editorial__article_catalog WHERE title=?',[title])[0]['n']!=1:raise ValueError('Duplicate active title remains')
def main():
 plan=json.load(sys.stdin);db=RecordRemote()
 try:merge(db,plan)
 finally:db.close()
 db=RecordRemote()
 try:
  verify(db,plan)
  n=db.execute('SELECT count(*) AS n FROM editorial__article_catalog')[0]['n'];m=db.execute('SELECT count(*) AS n FROM editorial__article_merges')[0]['n']
  print('PASS article consolidation:',n,'canonical articles;',m,'archived aliases; all original texts, revisions and article relations preserved; canonical relation views verified on fresh connection.')
 finally:db.close()
if __name__=='__main__':main()
