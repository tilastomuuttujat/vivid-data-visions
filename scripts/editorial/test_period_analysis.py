import json,sqlite3,unittest
from period_analysis import save,digest
class Local:
 def __init__(self):
  self.db=sqlite3.connect(':memory:',isolation_level=None);self.db.row_factory=sqlite3.Row
  self.execute('CREATE TABLE editorial__articles(id TEXT PRIMARY KEY,title TEXT,body_text TEXT,summary TEXT)')
  self.execute('CREATE TABLE editorial__article_revisions(article_id TEXT,revision_no INTEGER)')
  self.execute('INSERT INTO editorial__articles VALUES(?,?,?,?)',['a','Otsikko','Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.','Alkuperäinen tiivistelmä'])
  self.execute('INSERT INTO editorial__article_revisions VALUES(?,?)',['a',1])
 def execute(self,sql,args=()):return [dict(r) for r in self.db.execute(sql,args).fetchall()]
class Tests(unittest.TestCase):
 def bundle(self):return {'method_version':'test','articles':[{'id':'a','revision':1,'body_sha256':digest('Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.'),'periods':[{'start':1993,'end':1993,'dating':'explicit','label':'Lama','keywords':['lama','avuntarve'],'mechanism':'Tarve kasvaa.','evidence':'Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.'}]}]}
 def test_idempotent_and_originals_preserved(self):
  db=Local();before=db.execute('SELECT * FROM editorial__articles');save(db,self.bundle());save(db,self.bundle());self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before);self.assertEqual(len(db.execute('SELECT * FROM editorial__period_analyses')),1);self.assertEqual(len(db.execute('SELECT * FROM editorial__period_terms')),2)
  db.execute('INSERT INTO editorial__article_revisions VALUES(?,?)',['a',2]);self.assertEqual(db.execute('SELECT * FROM editorial__period_terms'),[])
 def test_untraceable_quote_rejected(self):
  db=Local();b=self.bundle();b['articles'][0]['periods'][0]['evidence']='Tämä väite ei esiinny artikkelin tekstissä.'
  with self.assertRaises(ValueError):save(db,b)
  self.assertEqual(db.execute('SELECT * FROM editorial__period_analyses'),[])
 def test_changed_source_or_revision_rejected(self):
  for field,value in [('body_sha256','wrong'),('revision',2)]:
   db=Local();b=self.bundle();b['articles'][0][field]=value
   with self.assertRaises(ValueError):save(db,b)
