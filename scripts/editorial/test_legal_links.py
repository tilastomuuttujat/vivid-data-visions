import copy,json,unittest
from pathlib import Path
from legal_links import import_links,digest,ROOT,load_catalog
from test_period_analysis import Local
class Tests(unittest.TestCase):
 def data(self):
  anchor=json.loads((ROOT/'legal-anchors.json').read_text())['anchors'][0]
  return {'anchors':[anchor]}, {'method_version':'test-legal','links':[{'article_id':'a','article_revision':1,'body_sha256':digest('Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.'),'anchor_id':anchor['id'],'relation_kind':'testable_mechanism','claim':'Avuntarve voi kasvaa.','evidence':'Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.','mechanism':'Tämä on tutkittava yhteys.','research_question':'Miten vastuu muuttui?','interpretation_status':'proposed'}]}
 def test_idempotent_readback_and_stale_flag(self):
  db=Local();anchors,b=self.data();before=db.execute('SELECT * FROM editorial__articles');import_links(db,b,anchors);import_links(db,b,anchors)
  self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before)
  self.assertEqual(len(db.execute('SELECT * FROM editorial__article_legal_links')),1)
  self.assertEqual(db.execute('SELECT is_current FROM editorial__narrative_decisions')[0]['is_current'],1)
  db.execute('INSERT INTO editorial__article_revisions VALUES(?,?)',['a',2]);self.assertEqual(db.execute('SELECT is_current FROM editorial__narrative_decisions')[0]['is_current'],0)
 def test_bad_evidence_or_revision_rolls_back(self):
  for field,value in [('evidence','Tällaista lausetta ei lähdetekstissä ole.'),('article_revision',2),('body_sha256','wrong')]:
   db=Local();anchors,b=self.data();b['links'][0][field]=value
   with self.assertRaises(ValueError):import_links(db,b,anchors)
   self.assertEqual(db.execute('SELECT * FROM editorial__article_legal_links'),[])
 def test_primary_source_required(self):
  db=Local();anchors,b=self.data();anchors['anchors'][0]['primary_url']='https://example.org/law'
  with self.assertRaises(ValueError):import_links(db,b,anchors)

class CatalogTests(unittest.TestCase):
 def test_independent_chain_does_not_replace_prior_links(self):
  db=Local();anchors,b=Tests().data();import_links(db,b,anchors)
  new=load_catalog('education-work');new['anchors']=new['anchors'][:1]
  second=copy.deepcopy(b);second['method_version']='next-chain';second['links'][0]['anchor_id']=new['anchors'][0]['id']
  import_links(db,second,new)
  self.assertEqual(len(db.execute('SELECT * FROM editorial__narrative_decisions')),2)
  with self.assertRaises(ValueError):load_catalog('../other-file')

class ResearchScopeTests(unittest.TestCase):
 def test_untraceable_impact_reference_rejected(self):
  db=Local();anchors,b=Tests().data();b['links'][0]['impact_finding_ids']=['missing'];b['links'][0]['impact_scope']='Selected outcomes only'
  with self.assertRaises(ValueError):import_links(db,b,anchors)
  self.assertEqual(db.execute('SELECT * FROM editorial__article_legal_links'),[])
 def test_research_population_and_method_required(self):
  db=Local();anchors,b=Tests().data();anchors['anchors'][0]['impact_status']='selected_outcomes_assessed'
  anchors['anchors'][0]['impact_findings']=[{'id':'r','kind':'quasi_experimental_study','source_url':'https://example.org/research','limits':'Limited sample','finding':'Test finding','outcome':'Test score','source_locator':'Table 1'}]
  with self.assertRaises(ValueError):import_links(db,b,anchors)
  self.assertEqual(db.execute('SELECT * FROM editorial__article_legal_links'),[])
