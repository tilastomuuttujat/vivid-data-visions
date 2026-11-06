import {test} from 'node:test';
import assert from 'node:assert/strict';
import './analysis-model.js';
const {project,overlaps}=globalThis.articleAnalysisModel;
test('intervals cannot imply full period coverage; undated stays undated',()=>{
 assert.equal(overlaps([null,2050],[2026,2050]),false);
 assert.equal(overlaps([2000,1900],[1850,2050]),false);
 const data={periods:[{article_id:'a',article_revision:2,periods_json:JSON.stringify([{start:null,end:null},{start:1946,end:1975}])}],supplements:[]};
 const [r]=project([{id:'a',revision:2}],data);
 assert.equal(r.undated,1);assert.equal(r.cells[3].mentions,1);assert.equal(r.cells[3].supplements,0);
});
test('stale supplements visible as stale but excluded from matrix; article IDs remain separate',()=>{
 const s={id:'x',article_id:'a',article_revision:1,period:[2010,2025],causal_effect_identified:false};
 const [a,b]=project([{id:'a',revision:2},{id:'b',revision:1}],{supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}]});
 assert.equal(a.claims[0].current,false);assert.equal(a.cells[6].supplements,0);assert.equal(b.claims.length,0);
 assert.equal(a.claims[0].type,'unclassified');
});
test('review classification is bound to source version and revision',()=>{
 const s={id:'x',article_id:'a',article_revision:1,body_sha256:'h',period:[2010,2025]};
 const r={article_revision:1,body_sha256:'h',source_version:'v1',claim_type:'assessment_rule',observation_periods:null};
 const data={supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}],reviews:[{article_id:'a',supplement_id:'x',payload_json:JSON.stringify(r)}]};
 assert.equal(project([{id:'a',revision:1}],data)[0].claims[0].type,'assessment_rule');data.supplements[0].version='v2';assert.equal(project([{id:'a',revision:1}],data)[0].claims[0].type,'unclassified');
});
test('audit highlights historical gaps and undated future without inventing observation coverage',()=>{
 const data={periods:[{article_id:'a',article_revision:1,periods_json:JSON.stringify([{start:1946,end:1975,evidence:'historical',dating:'explicit'},{start:null,end:null,evidence:'future',dating:'future_scenario'}])}]};
 const gaps=globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data));
 assert.ok(gaps.some(g=>g.kind==='historical_gap'&&g.priority==='P1'));assert.ok(gaps.some(g=>g.kind==='future_basis'));assert.ok(gaps.every(g=>g.article_id==='a'));
});
test('partial measured coverage never clears a broader historical claim gap',()=>{
 const s={id:'x',article_id:'a',article_revision:1,body_sha256:'h',period:[1960,1974],claim_classification:{article_revision:1,body_sha256:'h',source_version:'v1',claim_type:'description',observation_periods:[[1960,1974]]}};
 const rows=project([{id:'a',title:'A',revision:1}],{supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}],periods:[{article_id:'a',article_revision:1,periods_json:JSON.stringify([{start:1950,end:1980,dating:'explicit',evidence:'Broad historical claim'}])}]});
 assert.equal(rows[0].claims[0].type,'description');assert.ok(globalThis.articleAnalysisModel.audit(rows).some(g=>g.kind==='historical_observation_scope'));
});
