import copy,json,unittest
from pathlib import Path
from legal_links import import_links,digest,ROOT
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
