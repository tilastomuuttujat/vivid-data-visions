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
 assert.equal(a.claims[0].type,'mechanism_hypothesis');
});
