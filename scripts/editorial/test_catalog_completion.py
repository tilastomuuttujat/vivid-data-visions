import copy,unittest
from catalog_completion import load,complete,verify,validate
from test_legal_map import MappingTests
from articles import canonical
class CompletionTests(unittest.TestCase):
 def db(self):
  db,_=MappingTests().setup_db()
  db.execute('ALTER TABLE lakikartta__statute_catalog ADD COLUMN _migration_key TEXT NOT NULL')
  db.execute('CREATE UNIQUE INDEX migration_identity ON lakikartta__statute_catalog(_migration_key)')
  db.execute('ALTER TABLE lakikartta__statute_catalog ADD COLUMN systemic_risk_score REAL')
  db.execute('ALTER TABLE lakikartta__statute_catalog ADD COLUMN in_force INTEGER')
  return db
 def test_six_identities_preserve_sources_and_unknown_metrics(self):
  db=self.db();b=load();before=db.execute('SELECT * FROM editorial__articles')
  self.assertEqual(complete(db,b),6);self.assertEqual(complete(db,b),0);verify(db,b)
  self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before)
  self.assertTrue(all(r['systemic_risk_score'] is None and r['in_force'] is None for r in db.execute('SELECT * FROM lakikartta__statute_catalog')))
  self.assertEqual(sum(r['kind']=='amendment' for r in b['statutes']),3)
 def test_title_conflict_rolls_back_all_additions(self):
  db=self.db();b=load();db.execute('INSERT INTO lakikartta__statute_catalog(_migration_key,id,number,year,title) VALUES(?,?,?,?,?)',[canonical(['1997/1412']),'1997/1412','1412',1997,'Different title'])
  before=db.execute('SELECT * FROM lakikartta__statute_catalog')
  with self.assertRaises(ValueError):complete(db,b)
  self.assertEqual(db.execute('SELECT * FROM lakikartta__statute_catalog'),before)
 def test_source_and_parent_validation(self):
  for field,value in [('primary_url','https://example.com/law'),('parent_act_id',None),('enactment_date','2000')]:
   b=copy.deepcopy(load());b['statutes'][0][field]=value
   with self.assertRaises(ValueError):validate(b)
 def test_existing_catalog_metric_is_not_overwritten(self):
  db=self.db();b=load();r=b['statutes'][0]
  db.execute('INSERT INTO lakikartta__statute_catalog(_migration_key,id,number,year,title,systemic_risk_score) VALUES(?,?,?,?,?,?)',[canonical(['1995/969']),'1995/969','969',1995,r['title'],7.25])
  self.assertEqual(complete(db,b),5)
  self.assertEqual(db.execute("SELECT systemic_risk_score FROM lakikartta__statute_catalog WHERE id='1995/969'"),[{'systemic_risk_score':7.25}])

 def test_independent_addition_set_keeps_prior_provenance(self):
  db=self.db();first=load();complete(db,first)
  before=db.execute('SELECT * FROM editorial__catalog_additions ORDER BY statute_id')
  self.assertEqual(complete(db,load('justice')),1)
  verify(db,first);verify(db,load('justice'))
  self.assertEqual([r for r in db.execute('SELECT * FROM editorial__catalog_additions ORDER BY statute_id') if r['statute_id']!='2002/257'],before)
  with self.assertRaises(ValueError):load('../file')
