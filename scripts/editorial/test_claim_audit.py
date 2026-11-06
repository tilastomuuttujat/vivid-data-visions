import copy,json,unittest
from test_period_analysis import Local
from articles import canonical,digest
from article_evidence import SCHEMA as SOURCE_SCHEMA
from claim_audit import apply,validate
class Tests(unittest.TestCase):
 def fixture(self):
  db=Local();db.execute(SOURCE_SCHEMA)
  body=db.execute('SELECT body_text FROM editorial__articles')[0]['body_text']
  s={'id':'x','article_id':'a','article_revision':1,'body_sha256':digest(body)}
  db.execute('INSERT INTO editorial__article_evidence_supplements VALUES(?,?,?,?,?,?)',['source-v1','a',1,digest(body),'x',canonical(s)])
  r=dict(article_id='a',supplement_id='x',source_version='source-v1',article_revision=1,body_sha256=digest(body),supplement_sha256=digest(canonical(s)),claim_type='assessment_rule',rationale='Käsitteellinen rajaus.',review_status='editorial_proposal',observation_periods=None)
  return db,{'version':'review-v1','reviews':[r]}
 def test_idempotent_readback_and_immutable_articles(self):
  db,b=self.fixture();before=db.execute('SELECT * FROM editorial__articles');apply(db,b);apply(db,b)
  self.assertEqual(before,db.execute('SELECT * FROM editorial__articles'));self.assertEqual(len(db.execute('SELECT * FROM editorial__claim_reviews')),1)
 def test_reject_changed_source_and_invented_observation_years(self):
  for field,value in [('source_version','wrong'),('supplement_sha256','wrong'),('article_revision',2),('observation_periods',[[1990,2020]]),('claim_type','proved')]:
   db,b=self.fixture();b['reviews'][0][field]=value
   with self.assertRaises(ValueError):apply(db,b)
 def test_missing_or_duplicate_classifications_rejected(self):
  for action in ('missing','duplicate'):
   db,b=self.fixture();b['reviews']=[] if action=='missing' else b['reviews']*2
   with self.assertRaises(ValueError):validate(db,b)
