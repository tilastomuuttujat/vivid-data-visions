import copy,unittest
from test_period_analysis import Local
from article_evidence import apply,verify,digest
class Tests(unittest.TestCase):
 def bundle(self):
  t='Vuonna 1993 avun tarve kasvoi ja yhteinen vastuu muuttui.'
  return dict(version='test',supplements=[dict(id='one',article_id='a',article_revision=1,body_sha256=digest(t),article_passage=t,pressure={'description':'Pressure'},choice_and_implementation={'actor':'Actor'},evidence=[dict(source_id='s',finding='Reported result',supports='Context',does_not_establish='Causality')],sources=[dict(id='s',url='https://www.stea.fi/tutustu-avustuksiin/',title='Source',publisher='STEA',locator='2025',kind='administrative_summary',checked_on='2026-11-05')],limits='Limits',addition_text='Article supplement',research_gap='Gap',alternative_explanation='Alternative',causal_effect_identified=False,status='source_checked_interpretation')])
 def test_idempotent_and_original_unchanged(self):
  db=Local();b=self.bundle();before=db.execute('SELECT * FROM editorial__articles');apply(db,b);apply(db,b);verify(db,b);self.assertEqual(db.execute('SELECT * FROM editorial__articles'),before);self.assertEqual(len(db.execute('SELECT * FROM editorial__article_explanation_chains WHERE is_current=1')),1)
  db.execute('INSERT INTO editorial__article_revisions VALUES(?,?)',['a',2]);self.assertEqual(len(db.execute('SELECT * FROM editorial__article_explanation_chains WHERE is_current=1')),0)
 def test_invalid_scopes_rejected(self):
  for field,value in [('article_revision',2),('article_passage','A fabricated quotation that is not in the source article.'),('causal_effect_identified',True),('body_sha256','changed')]:
   b=self.bundle();b['supplements'][0][field]=value
   with self.assertRaises(ValueError):apply(Local(),b)
 def test_changed_payload_cannot_overwrite(self):
  db=Local();b=self.bundle();apply(db,b);b['supplements'][0]['addition_text']='Changed'
  with self.assertRaises(ValueError):apply(db,b)
 def test_unknown_source_rejected(self):
  b=self.bundle();b['supplements'][0]['evidence'][0]['source_id']='absent'
  with self.assertRaises(ValueError):apply(Local(),b)
 def qualitative(self):
  b=self.bundle();s=b['supplements'][0];s['period']=[1937,1983];s['claim_classification']={'observation_periods':None};s['evidence_design']=dict(kind='retrospective_qualitative',review_status='source_checked',role='method_and_scope_verification',annual_series=False,population_prevalence_estimate=False,historical_scope=[1937,1983],fieldwork_start='2014-08',fieldwork_end='2016-02',reported_participants=299,sampling='voluntary_self_recruited');return b
 def test_qualitative_scope_separates_fieldwork_from_historical_period(self):
  b=self.qualitative();db=Local();apply(db,b);verify(db,b)
  for k,v in [('annual_series',True),('fieldwork_start','1937'),('historical_scope',[1983,1937]),('reported_participants',0)]:
   bad=self.qualitative();bad['supplements'][0]['evidence_design'][k]=v
   with self.assertRaises(ValueError):apply(Local(),bad)
  bad=self.qualitative();bad['supplements'][0]['claim_classification']['observation_periods']=[[1937,1983]]
  with self.assertRaises(ValueError):apply(Local(),bad)
if __name__=='__main__':unittest.main()
