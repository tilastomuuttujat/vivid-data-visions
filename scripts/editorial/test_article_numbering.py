import unittest,copy
import test_merge_articles as merge_fixture
from article_numbering import apply,verify,VERSION
class Tests(unittest.TestCase):
 def fixture(self):
  from merge_articles import merge
  db,p=merge_fixture.Tests().fixture();merge(db,p)
  db.execute("INSERT INTO editorial__sources(id,filename,sha256,page_count,library_file_id,collection_title) VALUES('extra','f','extra',1,'l','c')")
  for i in range(34):db.execute('INSERT INTO editorial__articles(id,source_id,source_position,source_number,page_start,page_end,title,body_text) VALUES(?,?,?,?,?,?,?,?)',['extra'+str(i),'extra',i+1,'',1,1,'Extra '+str(i),'Original extra article body'])
  ids=[r['id'] for r in db.execute('SELECT id FROM editorial__canonical_articles ORDER BY source_id,source_position')]
  return db,dict(version=VERSION,articles=[dict(article_id=x,publication_number=i) for i,x in enumerate(ids,1)])
 def test_numbers_one_to_thirty_six_without_text_revision_changes(self):
  db,p=self.fixture();a=db.execute('SELECT * FROM editorial__articles ORDER BY id');r=db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no');apply(db,p);verify(db,p)
  rows=db.execute('SELECT position,number,publication_number FROM editorial__canonical_articles ORDER BY publication_number');self.assertEqual([x['position'] for x in rows],list(range(1,37)));self.assertEqual([x['number'] for x in rows],[str(i) for i in range(1,37)])
  self.assertEqual(a,db.execute('SELECT * FROM editorial__articles ORDER BY id'));self.assertEqual(r,db.execute('SELECT * FROM editorial__article_revisions ORDER BY article_id,revision_no'))
 def test_idempotent_and_archive_not_numbered(self):
  db,p=self.fixture();apply(db,p);apply(db,p);self.assertEqual(len(db.execute('SELECT * FROM editorial__article_numbers')),36)
 def test_invalid_sequence_or_duplicate_identity_rejected(self):
  for change in ['number','id','missing']:
   db,p=self.fixture()
   if change=='number':p['articles'][0]['publication_number']=2
   elif change=='id':p['articles'][0]['article_id']=p['articles'][1]['article_id']
   else:p['articles'].pop()
   with self.assertRaises(ValueError):apply(db,p)
 def test_changed_active_scope_rejected(self):
  db,p=self.fixture();p['articles'][0]['article_id']='absent'
  with self.assertRaises(ValueError):apply(db,p)
 def test_consolidation_rerun_retains_numbered_views(self):
  from merge_articles import views
  db,p=self.fixture();apply(db,p);views(db);verify(db,p);self.assertEqual(len(db.execute('SELECT publication_number FROM editorial__article_catalog WHERE publication_number IS NOT NULL')),36)
if __name__=='__main__':unittest.main()
