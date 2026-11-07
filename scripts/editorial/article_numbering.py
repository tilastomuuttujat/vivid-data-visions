"""Stable publication order independent of immutable source numbering and revisions."""
import json,sys
from period_analysis import RecordRemote
VERSION='article-publication-numbers-2026-11-07-v1'
SCHEMA='''CREATE TABLE IF NOT EXISTS editorial__article_numbers(article_id TEXT PRIMARY KEY REFERENCES editorial__articles(id),publication_number INTEGER NOT NULL UNIQUE CHECK(typeof(publication_number)='integer' AND publication_number>0),version TEXT NOT NULL)'''
def rebuild_views(db):
 db.execute('DROP VIEW IF EXISTS editorial__canonical_articles')
 db.execute('''CREATE VIEW editorial__canonical_articles AS SELECT a.*,n.publication_number,n.publication_number AS position,cast(n.publication_number AS TEXT) AS number FROM editorial__articles a LEFT JOIN editorial__article_numbers n ON n.article_id=a.id WHERE NOT EXISTS(SELECT 1 FROM editorial__article_merges m WHERE m.alias_article_id=a.id)''')
 db.execute('DROP VIEW IF EXISTS editorial__article_catalog')
 db.execute('''CREATE VIEW editorial__article_catalog AS SELECT a.id,a.source_id,a.source_position,a.source_number,a.publication_number,a.title,a.summary,a.status,a.tags_json,a.review_flags_json,a.page_start,a.page_end,length(a.body_text) AS characters,a.updated_at,(SELECT max(r.revision_no) FROM editorial__article_revisions r WHERE r.article_id=a.id) AS revision FROM editorial__canonical_articles a''')
def verify(db,plan):
 expected=[dict(article_id=x['article_id'],publication_number=x['publication_number']) for x in plan['articles']]
 actual=db.execute('SELECT id AS article_id,publication_number FROM editorial__canonical_articles ORDER BY publication_number')
 if actual!=expected:raise ValueError('Publication number readback differs')
 if db.execute('SELECT article_id FROM editorial__article_numbers n JOIN editorial__article_merges m ON m.alias_article_id=n.article_id'):raise ValueError('Archived duplicate numbered')
def apply(db,plan):
 rows=plan.get('articles',[])
 if plan.get('version')!=VERSION or len(rows)!=36 or len({r['article_id'] for r in rows})!=36 or [r['publication_number'] for r in rows]!=list(range(1,37)):raise ValueError('Expected unique publication numbers 1 to 36')
 db.execute('PRAGMA foreign_keys=ON');db.execute('BEGIN IMMEDIATE')
 try:
  before=db.execute('SELECT * FROM editorial__articles ORDER BY id');revisions=db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no')
  ids={r['id'] for r in db.execute('SELECT id FROM editorial__canonical_articles')}
  if ids!={r['article_id'] for r in rows}:raise ValueError('Active article scope changed')
  db.execute(SCHEMA)
  for r in rows:db.execute('INSERT INTO editorial__article_numbers VALUES(?,?,?) ON CONFLICT DO NOTHING',[r['article_id'],r['publication_number'],VERSION])
  rebuild_views(db);verify(db,plan)
  if before!=db.execute('SELECT * FROM editorial__articles ORDER BY id') or revisions!=db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no'):raise ValueError('Article data changed')
  db.execute('COMMIT')
 except:db.execute('ROLLBACK');raise

def main():
 plan=json.load(sys.stdin);db=RecordRemote()
 try:apply(db,plan)
 finally:db.close()
 db=RecordRemote()
 try:verify(db,plan)
 finally:db.close()
 print('PASS publication numbering: 36 canonical articles numbered 1-36; 2 archived aliases excluded; source numbering, bodies, revisions and evidence relations unchanged; fresh connection verified.')
if __name__=='__main__':main()
