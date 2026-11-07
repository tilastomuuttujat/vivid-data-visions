import unittest,json,copy,sqlite3
from pathlib import Path
from articles import canonical,digest
from article_evidence import SCHEMA as EVIDENCE,validate,apply,verify
from explanation_comparison import rules,group_record,check_bundle,verify_inputs
class DB:
 def __init__(self):self.c=sqlite3.connect(':memory:',isolation_level=None);self.c.row_factory=sqlite3.Row;self.c.executescript(Path(__file__).with_name('schema.sql').read_text());self.c.execute(EVIDENCE)
 def execute(self,s,p=()):return [dict(x) for x in self.c.execute(s,p).fetchall()]
def fixture():
 r=rules();b=dict(version=r['version'],inputs={},groups={},supplements=[]);db=DB();body='A complete synthetic article passage about access and institutional conditions.'
 db.execute("INSERT INTO editorial__sources(id,filename,sha256,page_count,library_file_id,collection_title) VALUES('s','f','h',1,'l','c')")
 ids=[aid for g in r['groups'] for aid in g['articles']]
 for i,aid in enumerate(ids):db.execute('INSERT INTO editorial__articles(id,source_id,source_position,source_number,page_start,page_end,title,body_text) VALUES(?,?,?,?,?,?,?,?)',[aid,'s',i+1,str(i+1),1,1,'Synthetic article',body])
 for key,sel in r['references'].items():
  p=dict(id=sel['supplement_id'],article_id=sel['article_id'],article_revision=1,body_sha256=digest(body),article_passage=body)
  db.execute('INSERT INTO editorial__article_evidence_supplements VALUES(?,?,?,?,?,?)',[sel['version'],sel['article_id'],1,digest(body),sel['supplement_id'],canonical(p)])
  b['inputs'][key]=dict(sel,key=key,article_revision=1,body_sha256=digest(body),payload_sha256=digest(canonical(p)),period=[2020,2025],sources=[dict(id=key,title='Synthetic source',publisher='Statistics',url='https://stat.fi/',locator='Fixture',kind='fixture',checked_on='2026-11-07')],evidence=[dict(source_id=key,finding='Recorded synthetic observation',supports='Description',does_not_establish='Causal ranking')])
 for g in r['groups']:
  record=group_record(g,b['inputs']);b['groups'][g['id']]=record
  for aid in g['articles']:
   q=dict(id='competing-explanations-'+g['id'],article_id=aid,article_revision=1,body_sha256=digest(body),article_passage=body,period=g['period'],period_linkage='exact_passage_only',causal_effect_identified=False,status='source_checked_interpretation',explanation_comparison=record,pressure={'kind':'comparison'},choice_and_implementation={'kind':'comparison'},sources=[s for k in record['inputs'] for s in k['sources']],evidence=[e for k in record['inputs'] for e in k['evidence']],limits='No ranking',addition_text='Comparison',research_gap='Matched outcomes needed',alternative_explanation='Explanations can coexist',claim_classification=dict(article_revision=1,body_sha256=digest(body),source_version=r['version'],claim_type='assessment_rule',observation_periods=None))
   b['supplements'].append(q)
 return db,b
class Tests(unittest.TestCase):
 def test_three_domains_twelve_alternatives_and_six_bound_articles(self):
  db,b=fixture();check_bundle(b);validate(db,b);verify_inputs(db,b);self.assertEqual(len(b['inputs']),18);self.assertEqual(sum(len(g['cells']) for g in b['groups'].values()),12)
  for g in b['groups'].values():self.assertEqual([c['id'] for c in g['cells']],['resources','distribution','procedures','needs']);self.assertTrue(g['counterevidence']);self.assertTrue(g['historical_check'])
 def test_reuse_is_not_independent_evidence_or_automatic_causality(self):
  m=rules()['method'];self.assertFalse(m['independent_studies_counted']);self.assertFalse(m['causal_winner_selected']);self.assertFalse(m['weights_estimated']);self.assertFalse(m['new_primary_data_collected']);self.assertTrue(m['explanations_can_coexist'])
 def test_import_preserves_bodies_and_is_idempotent(self):
  db,b=fixture();before=db.execute('SELECT * FROM editorial__articles ORDER BY id');verify_inputs(db,b);apply(db,b);apply(db,b);verify(db,b);self.assertEqual(before,db.execute('SELECT * FROM editorial__articles ORDER BY id'));self.assertEqual(len(db.execute('SELECT * FROM editorial__article_evidence_supplements')),24)
 def test_changed_prior_source_rejected(self):
  db,b=fixture();q=next(iter(b['inputs'].values()));db.execute('UPDATE editorial__article_evidence_supplements SET payload_json=? WHERE article_id=? AND supplement_id=?',[canonical({'changed':True}),q['article_id'],q['supplement_id']])
  with self.assertRaises(ValueError):verify_inputs(db,b)
 def test_new_prior_version_requires_recomparison(self):
  db,b=fixture();q=next(iter(b['inputs'].values()));db.execute('INSERT INTO editorial__article_evidence_supplements VALUES(?,?,?,?,?,?)',['new-version',q['article_id'],1,q['body_sha256'],q['supplement_id'],canonical({'changed':True})])
  with self.assertRaises(ValueError):verify_inputs(db,b)
 def test_changed_comparison_and_false_observation_interval_rejected(self):
  db,b=fixture();bad=copy.deepcopy(b);bad['supplements'][0]['explanation_comparison']['conclusion']='A causal winner'
  with self.assertRaises(ValueError):check_bundle(bad)
  bad=copy.deepcopy(b);bad['supplements'][0]['claim_classification']['observation_periods']=[[1850,2025]]
  with self.assertRaises(ValueError):check_bundle(bad)
 def test_missing_reference_rejected(self):
  db,b=fixture();b['inputs'].pop(next(iter(b['inputs'])))
  with self.assertRaises(ValueError):check_bundle(b)
if __name__=='__main__':unittest.main()
