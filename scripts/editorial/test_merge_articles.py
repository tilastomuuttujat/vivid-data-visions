import unittest,sqlite3,json,copy
from pathlib import Path
from articles import digest
from article_evidence import SCHEMA as EVIDENCE
from merge_articles import merge,verify,PAIRS,VERSION
class DB:
 def __init__(self):self.c=sqlite3.connect(':memory:',isolation_level=None);self.c.row_factory=sqlite3.Row;self.c.executescript(Path(__file__).with_name('schema.sql').read_text());self.c.execute(EVIDENCE);self.c.execute('CREATE TABLE editorial__other_links(article_id TEXT,payload_json TEXT)')
 def execute(self,s,p=()):return [dict(x) for x in self.c.execute(s,p).fetchall()]
class Tests(unittest.TestCase):
 def fixture(self):
  db=DB();plan=dict(version=VERSION,pairs=[])
  for n,(owner,alias) in enumerate(PAIRS):
   body='A sufficiently long original article passage for exact binding verification.';other=body if n==0 else 'A distinct alternative article passage that must remain preserved in full.'
   db.execute("INSERT INTO editorial__sources(id,filename,sha256,page_count,library_file_id,collection_title) VALUES(?,?,?,?,?,?)",[str(n),'f','hash'+str(n),2,'l','c'])
   for j,(aid,text) in enumerate([(owner,body),(alias,other)]):
    db.execute('INSERT INTO editorial__articles(id,source_id,source_position,source_number,page_start,page_end,title,body_text) VALUES(?,?,?,?,?,?,?,?)',[aid,str(n),j+1,str(j+1),1,1,'Title '+str(n),text])
    s=dict(id='same-supplement-id',article_id=aid,article_revision=1,body_sha256=digest(text),article_passage=text)
    db.execute('INSERT INTO editorial__article_evidence_supplements VALUES(?,?,?,?,?,?)',['v1',aid,1,digest(text),s['id'],json.dumps(s)])
    db.execute('INSERT INTO editorial__other_links VALUES(?,?)',[aid,json.dumps({'keep':'all links'})])
   plan['pairs'].append(dict(canonical=owner,alias=alias,canonical_sha256=digest(body),alias_sha256=digest(other),canonical_revision=1,alias_revision=1,exact_duplicate=n==0))
  return db,plan
 def test_preserves_all_texts_relations_and_history(self):
  db,p=self.fixture();before=db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id');merge(db,p);verify(db,p)
  self.assertEqual(before,db.execute('SELECT id,body_text FROM editorial__articles ORDER BY id'));self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__article_catalog')[0]['n'],2)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__canonical_articles')[0]['n'],2)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__canonical_article_evidence_supplements')[0]['n'],4)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__canonical_other_links')[0]['n'],4)
  self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__article_revisions')[0]['n'],6)
 def test_same_supplement_id_from_two_origins_not_overwritten(self):
  db,p=self.fixture();merge(db,p)
  for owner,alias in PAIRS:self.assertEqual(len(db.execute('SELECT * FROM editorial__canonical_article_evidence_supplements WHERE canonical_article_id=?',[owner])),2)
 def test_bindings_only_for_exact_current_passage(self):
  db,p=self.fixture();merge(db,p);saved=[json.loads(x['payload_json']) for x in db.execute('SELECT payload_json FROM editorial__article_merges ORDER BY canonical_article_id')];byid={x['plan']['canonical']:x for x in saved}
  self.assertTrue(byid[PAIRS[0][0]]['supplement_matches']['v1/same-supplement-id']);self.assertFalse(byid[PAIRS[1][0]]['supplement_matches']['v1/same-supplement-id'])
 def test_idempotent_no_extra_archive_revisions(self):
  db,p=self.fixture();merge(db,p);before=db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no');merge(db,p);self.assertEqual(before,db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no'))
 def test_changed_article_rolls_back_both_pairs(self):
  db,p=self.fixture();p['pairs'][1]['alias_sha256']='changed'
  with self.assertRaises(ValueError):merge(db,p)
  self.assertEqual(db.execute("SELECT count(*) AS n FROM editorial__articles WHERE status='archived'")[0]['n'],0);self.assertEqual(db.execute('SELECT count(*) AS n FROM editorial__article_catalog')[0]['n'],4)
 def test_missing_preserved_relation_detected(self):
  db,p=self.fixture();merge(db,p);db.execute('DELETE FROM editorial__other_links WHERE article_id=?',[PAIRS[0][1]])
  with self.assertRaises(ValueError):verify(db,p)
if __name__=='__main__':unittest.main()
