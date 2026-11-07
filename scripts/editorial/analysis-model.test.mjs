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
test('reviewed qualitative scope applies only to the exact report claim and never invents annual observations',()=>{
 const passage='The historical report concerns experiences of care over this interval.';
 const s={id:'q',article_id:'a',article_revision:1,body_sha256:'h',article_passage:passage,period:[1937,1983],evidence_design:{kind:'retrospective_qualitative',review_status:'source_checked',role:'method_and_scope_verification',annual_series:false,population_prevalence_estimate:false,historical_scope:[1937,1983],fieldwork_start:'2014-08',fieldwork_end:'2016-02'},claim_classification:{article_revision:1,body_sha256:'h',source_version:'v1',claim_type:'description',observation_periods:null}};
 const data={supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}],periods:[{article_id:'a',article_revision:1,periods_json:JSON.stringify([{start:1937,end:1983,dating:'explicit',evidence:passage}])}]};
 let rows=project([{id:'a',title:'A',revision:1}],data),gaps=globalThis.articleAnalysisModel.audit(rows);
 assert.equal(rows[0].claims[0].observationPeriods,null);assert.ok(!gaps.some(g=>g.kind==='observation_years'||g.kind==='historical_observation_scope'));
 data.periods[0].periods_json=JSON.stringify([{start:1937,end:1983,dating:'explicit',evidence:'A different claim about an intervention effect.'}]);gaps=globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data));assert.ok(gaps.some(g=>g.kind==='historical_observation_scope'));
 s.evidence_design.review_status='proposed';data.supplements[0].payload_json=JSON.stringify(s);gaps=globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data));assert.ok(gaps.some(g=>g.kind==='observation_years'));
});
test('passage-bound statistical context never clears a different historical claim',()=>{
 const passage='Life expectancy describes period mortality rather than the quality of care.';
 const s={id:'life',article_id:'a',article_revision:1,body_sha256:'h',article_passage:passage,period:[1851,1970],period_linkage:'exact_passage_only',claim_classification:{article_revision:1,body_sha256:'h',source_version:'v1',claim_type:'description',observation_periods:[[1851,1970]]}};
 const data={supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}],periods:[{article_id:'a',article_revision:1,periods_json:JSON.stringify([{start:1964,end:1964,dating:'explicit',evidence:'Sickness insurance expanded economic protection.'}])}]};
 assert.ok(globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data)).some(g=>g.kind==='historical_gap'));
 data.periods[0].periods_json=JSON.stringify([{start:1851,end:1970,dating:'explicit',evidence:passage}]);assert.ok(!globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data)).some(g=>g.kind==='historical_gap'));
});
test('verified implementation events cover exact dated claims without inventing annual coverage',()=>{
 const passage='The insurance administration was assigned to a national institution in 1964.';
 const s={id:'event',article_id:'a',article_revision:1,body_sha256:'h',article_passage:passage,period:[1964,1975],period_linkage:'exact_passage_only',sources:[{id:'official'}],implementation_evidence:{kind:'documented_implementation_timeline',review_status:'source_checked',annual_series:false,causal_effect_identified:false,events:[{year:1964,source_id:'official',description:'Administration began.'}]},claim_classification:{article_revision:1,body_sha256:'h',source_version:'v1',claim_type:'description',observation_periods:null}};
 const data={supplements:[{article_id:'a',version:'v1',payload_json:JSON.stringify(s)}],periods:[{article_id:'a',article_revision:1,periods_json:JSON.stringify([{start:1964,end:1964,dating:'explicit',evidence:passage}])}]};
 let rows=project([{id:'a',title:'A',revision:1}],data);assert.equal(rows[0].claims[0].observationPeriods,null);assert.ok(!globalThis.articleAnalysisModel.audit(rows).some(g=>['observation_years','historical_observation_scope'].includes(g.kind)));
 data.periods[0].periods_json=JSON.stringify([{start:1964,end:1975,dating:'explicit',evidence:passage}]);assert.ok(globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data)).some(g=>g.kind==='historical_observation_scope'));
 s.implementation_evidence.events[0].source_id='unknown';data.supplements[0].payload_json=JSON.stringify(s);assert.ok(globalThis.articleAnalysisModel.audit(project([{id:'a',title:'A',revision:1}],data)).some(g=>g.kind==='observation_years'));
});
const synthModel=globalThis.articleAnalysisModel;
function populationFixture(){
 const catalog=[],supplements=[];
 for(const g of synthModel.populationScopes)for(let i=0;i<g.ids.length;i++){
  const id=g.ids[i];if(!catalog.some(a=>a.id===id))catalog.push({id,title:'Test article '+id,revision:1});
  const s={article_id:id,id:g.claimIds[i],article_revision:1,body_sha256:'fixture',article_passage:'A reviewed synthetic passage about population and institutions.',period:[1990,2024],causal_effect_identified:false,[g.field]:{findings:{test:'Source observation'}},claim_classification:{article_revision:1,body_sha256:'fixture',source_version:g.version,claim_type:'mechanism_hypothesis',observation_periods:[[1990,2024]]}};
  supplements.push({article_id:id,version:g.version,payload_json:JSON.stringify(s)});
 }
 return {catalog,data:{supplements}};
}
test('population synthesis uses six explicit groups and twelve current links',()=>{
 const f=populationFixture(),s=synthModel.populationSynthesis(project(f.catalog,f.data));assert.equal(s.ready,6);assert.equal(s.groups.length,6);assert.equal(s.groups.flatMap(g=>g.basis).length,12);assert.equal(s.causal_effect_identified,false);assert.ok(s.groups.every(g=>g.support&&g.boundary&&g.next));
});
test('missing population data remains unavailable, never zero evidence',()=>{
 const s=synthModel.populationSynthesis([]);assert.equal(s.ready,0);assert.ok(s.groups.every(g=>g.status==='unavailable'&&g.current===0));
});
test('changed article revision and incompatible source are not treated as supported',()=>{
 const f=populationFixture();f.catalog.find(a=>a.id===f.data.supplements[0].article_id).revision=2;
 let s=synthModel.populationSynthesis(project(f.catalog,f.data));assert.equal(s.groups[0].status,'partial');assert.equal(s.groups[0].basis[0].status,'stale');assert.equal(s.groups[0].basis[0].claim,null);
 const fresh=populationFixture();fresh.data.supplements[0].version='unknown-version';s=synthModel.populationSynthesis(project(fresh.catalog,fresh.data));assert.equal(s.groups[0].basis[0].status,'needs_review');assert.equal(s.groups[0].basis[0].claim,null);
});
test('an unrelated demographic card cannot replace the reviewed article-specific link',()=>{
 const f=populationFixture();const s=JSON.parse(f.data.supplements[0].payload_json);s.id='different-card';f.data.supplements[0].payload_json=JSON.stringify(s);
 assert.equal(synthModel.populationSynthesis(project(f.catalog,f.data)).groups[0].basis[0].status,'missing');
});
test('a conflicting causal assertion never enters the population comparison',()=>{
 const f=populationFixture();const s=JSON.parse(f.data.supplements[0].payload_json);s.causal_effect_identified=true;f.data.supplements[0].payload_json=JSON.stringify(s);
 assert.equal(synthModel.populationSynthesis(project(f.catalog,f.data)).groups[0].basis[0].status,'needs_review');
});
test('population export preserves evidence references without duplicating source datasets',()=>{
 const f=populationFixture(),rows=project(f.catalog,f.data);const c=rows[0].claims[0];c.population_work={large_private_snapshot:'not copied'};c.evidence=[{source_id:'s',finding:'Observation',supports:'Limited support',does_not_establish:'Causality'}];c.sources=[{id:'s',url:'https://stat.fi/'}];
 const result=synthModel.populationExport(synthModel.populationSynthesis(rows)),claim=result.groups[0].basis[0].claim;
 assert.equal(claim.evidence[0].finding,'Observation');assert.equal(claim.source_version,synthModel.populationScopes[0].version);assert.equal(claim.population_work,undefined);assert.equal(claim.body_text,undefined);assert.ok(!JSON.stringify(result).includes('not copied'));
});

test('consolidated articles retain colliding source claims without accepting unmatched passages',()=>{
 const catalog=[{id:'canonical',title:'One article',revision:1}],merges=[{alias_article_id:'alias',canonical_article_id:'canonical',payload_json:JSON.stringify({canonical_revision:1,original_revision:1,same_text:false,supplement_matches:{'v/same':false}})}];
 const supplements=['canonical','alias'].map(id=>({article_id:id,version:'v',payload_json:JSON.stringify({id:'same',article_id:id,article_revision:1,article_passage:'A passage',body_sha256:'hash'})}));
 const rows=globalThis.articleAnalysisModel.project(catalog,{merges,supplements,periods:[]});assert.equal(rows.length,1);assert.equal(rows[0].claims.length,2);assert.notEqual(rows[0].claims[0].key,rows[0].claims[1].key);assert.equal(rows[0].claims[0].current,true);assert.equal(rows[0].claims[1].current,false);
 merges[0].payload_json=JSON.stringify({canonical_revision:1,original_revision:1,same_text:true,supplement_matches:{'v/same':true}});assert.equal(globalThis.articleAnalysisModel.project(catalog,{merges,supplements,periods:[]})[0].claims[1].current,true);
 catalog[0].revision=2;assert.equal(globalThis.articleAnalysisModel.project(catalog,{merges,supplements,periods:[]})[0].claims[1].current,false);
});

test('identical merged supplements render once with both origins retained',()=>{
 const s={id:'same',article_revision:1,body_sha256:'h'},supplements=['canonical','alias'].map(article_id=>({article_id,version:'v',payload_json:JSON.stringify({...s,article_id})}));
 const merges=[{alias_article_id:'alias',canonical_article_id:'canonical',payload_json:JSON.stringify({canonical_revision:1,original_revision:1,supplement_matches:{'v/same':true},equivalent_supplements:{'v/same':'v/same'}})}];
 const r=globalThis.articleAnalysisModel.project([{id:'canonical',revision:1}],{supplements,merges});assert.equal(r[0].claims.length,1);assert.equal(r[0].claims[0].merged_origins[0].article_id,'alias');
});

test('explanation comparison requires both article cards and current version-bound inputs',()=>{
 const v='explanation-comparison-2026-11-07-v1',input={id:'source',origin_article_id:'a',article_id:'a',version:'prior',article_revision:1,body_sha256:'h',current:true,key:'a/source'},g={id:'education',version:v,articles:['a','b'],inputs:[{article_id:'a',supplement_id:'source',version:'prior',article_revision:1,body_sha256:'h'}],cells:[]};
 const make=id=>({article_id:id,key:id+'/comparison',version:v,current:true,causal_effect_identified:false,classification:{claim_type:'assessment_rule'},explanation_comparison:g});
 const rows=[{claims:[input,make('a'),make('b')]}];assert.equal(globalThis.articleAnalysisModel.explanationComparison(rows)[0].status,'current');input.version='new';assert.equal(globalThis.articleAnalysisModel.explanationComparison(rows)[0].status,'requires_review');input.version='prior';rows[0].claims.pop();assert.equal(globalThis.articleAnalysisModel.explanationComparison(rows)[0].status,'requires_review');
});
