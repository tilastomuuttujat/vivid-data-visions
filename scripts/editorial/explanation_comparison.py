"""Competing explanations are a version-bound synthesis, not a causal ranking."""
import json,sys
from pathlib import Path
from articles import canonical,digest
from article_evidence import validate,apply,verify
from period_analysis import RecordRemote
RULES=Path(__file__).with_name('explanation-comparison-rules.json')
SCHEMA='CREATE TABLE IF NOT EXISTS editorial__explanation_comparisons(version TEXT NOT NULL,group_id TEXT NOT NULL,payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),PRIMARY KEY(version,group_id))'
DEFAULT_VERSION='explanation-comparison-2026-11-07-v1'
PROFILES={DEFAULT_VERSION:RULES,'renewal-comparison-2026-11-07-v1':RULES.with_name('renewal-comparison-rules.json')}
def rules(version=DEFAULT_VERSION):
 if version not in PROFILES:raise ValueError('Unknown comparison profile')
 return json.loads(PROFILES[version].read_text())
def group_inputs(g):return sorted(set(g['historical_inputs']+g['counter_inputs']+[k for c in g['cells'] for k in c['input_keys']]))
def group_record(g,inputs,version=DEFAULT_VERSION):return dict(g,version=rules(version)['version'],inputs=[inputs[k] for k in group_inputs(g)],method=rules(version)['method'],causal_effect_identified=False)
def check_bundle(b):
 r=rules(b.get('version'));inputs=b.get('inputs',{})
 if b.get('version')!=r['version'] or set(inputs)!=set(r['references']):raise ValueError('Comparison reference scope differs')
 for key,selector in r['references'].items():
  q=inputs[key]
  if any(q.get(k)!=v for k,v in selector.items()) or q.get('key')!=key or any(not q.get(k) for k in ['payload_sha256','body_sha256','article_revision','evidence','sources']):raise ValueError('Comparison reference incomplete')
 expected={g['id']:group_record(g,inputs,b['version']) for g in r['groups']}
 if b.get('groups')!=expected or len(b.get('supplements',[]))!=6:raise ValueError('Comparison groups differ')
 seen=set()
 for s in b['supplements']:
  c=s.get('explanation_comparison',{});g=next((g for g in r['groups'] if g['id']==c.get('id')),None)
  if not g or s['article_id'] not in g['articles'] or (g['id'],s['article_id']) in seen:raise ValueError('Comparison article scope differs')
  seen.add((g['id'],s['article_id']))
  if c!=expected[g['id']] or s.get('id')!='competing-explanations-'+g['id'] or s.get('period')!=g['period'] or s.get('period_linkage')!='exact_passage_only' or s.get('causal_effect_identified') is not False:raise ValueError('Comparison scope changed')
  review=s.get('claim_classification',{})
  if review.get('claim_type')!='assessment_rule' or review.get('observation_periods') is not None or any(review.get(k)!=v for k,v in [('article_revision',s['article_revision']),('body_sha256',s['body_sha256']),('source_version',r['version'])]):raise ValueError('Comparison classification changed')
 if len(seen)!=6:raise ValueError('Comparison links incomplete')
def verify_inputs(db,b):
 refs=list(b['inputs'].values());where=' OR '.join('(s.article_id=? AND s.supplement_id=?)' for q in refs);args=[v for q in refs for v in (q['article_id'],q['supplement_id'])]
 rows=db.execute('SELECT s.article_id,s.supplement_id,s.version,s.payload_json FROM editorial__article_evidence_supplements s WHERE ('+where+') AND s.rowid=(SELECT max(n.rowid) FROM editorial__article_evidence_supplements n WHERE n.article_id=s.article_id AND n.supplement_id=s.supplement_id)',args)
 index={(q['article_id'],q['supplement_id']):q for q in rows}
 if len(index)!=len(refs):raise ValueError('Comparison input missing')
 for ref in refs:
  row=index[(ref['article_id'],ref['supplement_id'])];payload=json.loads(row['payload_json'])
  if row['version']!=ref['version'] or digest(canonical(payload))!=ref['payload_sha256'] or payload['article_revision']!=ref['article_revision'] or payload['body_sha256']!=ref['body_sha256']:raise ValueError('Comparison input changed')
def verify_groups(db,b):
 actual=db.execute('SELECT group_id,payload_json FROM editorial__explanation_comparisons WHERE version=? ORDER BY group_id',[b['version']]);expected=[dict(group_id=k,payload_json=canonical(v)) for k,v in sorted(b['groups'].items())]
 if actual!=expected:raise ValueError('Comparison readback differs')
def main():
 b=json.load(sys.stdin);check_bundle(b);db=RecordRemote()
 try:
  validate(db,b);verify_inputs(db,b);apply(db,b);db.execute(SCHEMA)
  for k,v in b['groups'].items():db.execute('INSERT INTO editorial__explanation_comparisons VALUES(?,?,?) ON CONFLICT DO NOTHING',[b['version'],k,canonical(v)])
  verify_groups(db,b)
 finally:db.close()
 db=RecordRemote()
 try:validate(db,b);verify_inputs(db,b);verify(db,b);verify_groups(db,b);check_bundle(b)
 finally:db.close()
 print(f"PASS explanation comparison: {b['version']}; {len(b['groups'])} domains; 12 alternatives; 6 article links; {len(b['inputs'])} version-bound prior evidence references; no causal ranking or new primary observations; fresh connection; originals unchanged.")
if __name__=='__main__':main()
