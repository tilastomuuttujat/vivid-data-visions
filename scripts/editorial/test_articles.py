import copy
import sqlite3
import unittest
from articles import import_bundle,update_article,verify,digest

class Local:
    def __init__(self):self.db=sqlite3.connect(':memory:',isolation_level=None)
    def execute(self,sql,params=()):return [list(row) for row in self.db.execute(sql,params)]
    def many(self,commands):return [self.execute(sql,params) for sql,params in commands]

def fixture():
    return {'version':1,'source':{'id':'test-source','filename':'test.pdf','sha256':'test-sha','page_count':2,'library_file_id':'test-library','collection_title':'Test'},
      'pages':['1 First title\n\nOriginal paragraph.','1 Second title\n\nDifferent paragraph.'],
      'articles':[{'id':'one','position':1,'source_number':'1','title':'First title','title_lines':1,'page_start':1,'page_end':1,'review_flags':['duplicate_source_number']},
                  {'id':'two','position':2,'source_number':'1','title':'Second title','title_lines':1,'page_start':2,'page_end':2,'review_flags':['duplicate_source_number']}]}

class ArticleTests(unittest.TestCase):
    def setUp(self):self.db=Local();self.bundle=fixture();import_bundle(self.db,self.bundle)
    def test_import_preserves_duplicate_numbers_and_every_source_page(self):
        self.assertEqual(verify(self.db,'test-source'),{'articles':2,'revisions':2,'pages':2})
        self.assertEqual(self.db.execute('SELECT raw_text,sha256 FROM editorial__source_pages ORDER BY page_no'),[[t,digest(t)] for t in self.bundle['pages']])
    def test_ordinary_table_update_saves_immutable_previous_and_new_versions(self):
        self.db.execute("UPDATE editorial__articles SET body_text='Updated text' WHERE id='one'")
        self.assertEqual(self.db.execute("SELECT revision_no,body_text FROM editorial__article_revisions WHERE article_id='one' ORDER BY revision_no"),[[1,'Original paragraph.'],[2,'Updated text']])
        self.assertEqual(verify(self.db,'test-source')['revisions'],3)
        for statement in ["DELETE FROM editorial__articles WHERE id='one'", "UPDATE editorial__article_revisions SET body_text='bad'", "DELETE FROM editorial__source_pages", "UPDATE editorial__articles SET id='new' WHERE id='one'"]:
            with self.assertRaises(sqlite3.IntegrityError):self.db.execute(statement)
    def test_optimistic_update_rejects_stale_revision_and_supports_noop(self):
        self.assertEqual(update_article(self.db,'one',1,{'title':'Changed'}),2)
        with self.assertRaisesRegex(ValueError,'Revision conflict'):update_article(self.db,'one',1,{'title':'Stale'})
        self.assertEqual(update_article(self.db,'one',2,{'title':'Changed'}),2)
        self.assertEqual(self.db.execute("SELECT title FROM editorial__articles WHERE id='one'"),[['Changed']])
    def test_import_rerun_preserves_edits_but_conflicting_source_rolls_back(self):
        update_article(self.db,'one',1,{'body_text':'New text','status':'review'})
        import_bundle(self.db,self.bundle)
        self.assertEqual(self.db.execute("SELECT body_text,status FROM editorial__articles WHERE id='one'"),[['New text','review']])
        bad=copy.deepcopy(self.bundle);bad['pages'][0]='1 First title\n\nCONFLICT'
        with self.assertRaises(ValueError):import_bundle(self.db,bad)
        self.assertEqual(verify(self.db,'test-source')['revisions'],3)
    def test_unnumbered_text_import_preserves_body_and_records_the_text_origin(self):
        bundle=fixture()
        bundle['source']['filename']='article.txt'
        bundle['source']['library_file_id']=''
        bundle['articles'][0]['source_number']=''
        bundle['pages'][0]='First title\n\nOriginal paragraph.'
        db=Local();import_bundle(db,bundle)
        row=db.execute("SELECT body_text,change_note FROM editorial__articles WHERE id='one'")[0]
        self.assertEqual(row[0],'Original paragraph.')
        self.assertIn('user-supplied text',row[1])

    def test_markdown_heading_import_keeps_original_markdown_body(self):
        bundle=fixture();bundle['source']['filename']='source.md'
        bundle['articles'][0]['source_number']=''
        body='*Subtitle*\n\n## Heading\n\nParagraph with [1].'
        bundle['pages'][0]='# First title\n\n'+body
        db=Local();import_bundle(db,bundle)
        self.assertEqual(db.execute("SELECT title,body_text FROM editorial__articles WHERE id='one'"),[['First title',body]])

    def test_invalid_status_or_empty_body_leaves_latest_revision_intact(self):
        for change in [{'status':'wrong'},{'body_text':''},{'tags_json':'{}'}]:
            with self.assertRaises(sqlite3.IntegrityError):update_article(self.db,'one',1,change)
        self.assertEqual(verify(self.db,'test-source')['revisions'],2)

if __name__=='__main__':unittest.main()
