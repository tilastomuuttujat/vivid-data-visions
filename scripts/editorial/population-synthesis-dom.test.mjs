import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createRequire}from'node:module';const{JSDOM}=createRequire(import.meta.url)('jsdom');
test('editor comparison renders six groups, opens exact source card and exports compact references',async()=>{
 const html=readFileSync(new URL('./editor.html',import.meta.url),'utf8');const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.eval(readFileSync(new URL('./analysis-model.js',import.meta.url),'utf8'));
 const catalog=[],supplements=[];
 for(const g of w.articleAnalysisModel.populationScopes)for(let i=0;i<g.ids.length;i++){
  const id=g.ids[i];if(!catalog.some(a=>a.id===id))catalog.push({id,title:'Test article '+catalog.length,revision:1,status:'draft',source_position:catalog.length+1});
  const s={article_id:id,id:g.claimIds[i],article_revision:1,body_sha256:'fixture',article_passage:'A synthetic reviewed population passage for DOM verification.',period:[1990,2024],causal_effect_identified:false,[g.field]:{findings:{a:'Observation'},raw:'large_source_not_exported'},sources:[],evidence:[{source_id:'s',finding:'Observation',supports:'Scope',does_not_establish:'Causality'}],claim_classification:{article_revision:1,body_sha256:'fixture',source_version:g.version,claim_type:'mechanism_hypothesis',observation_periods:[[1990,2024]]}};
  supplements.push({article_id:id,version:g.version,payload_json:JSON.stringify(s)});
 }
 const calls=[];w.articleEditorTransport=async path=>{calls.push(path);if(path==='/api/session')return{csrf:'test'};if(path==='/api/articles')return{articles:catalog};if(path==='/api/analysis')return{supplements,periods:[],reviews:[],discoveries:[],missing:[]};throw Error('Unexpected operation');};
 w.HTMLElement.prototype.scrollIntoView=function(){w.lastScrolled=this.id;};let download=null;w.Blob=Blob;w.URL.createObjectURL=blob=>{download=blob;return'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 w.eval(readFileSync(new URL('./editor.js',import.meta.url),'utf8'));await new Promise(r=>setImmediate(r));await w.document.getElementById('load-analysis').onclick();
 const panel=w.document.querySelector('[aria-label="Väestöaineiston vertailusynteesi"]');assert.ok(panel);assert.equal(panel.querySelectorAll(':scope > details').length,6);assert.ok(panel.textContent.includes('6/6 ryhmässä'));
 const buttons=[...panel.querySelectorAll('button')];buttons.find(b=>b.textContent==='Avaa koko lähdekortti').click();assert.ok(w.lastScrolled.startsWith('claim-'));assert.equal(w.document.getElementById(w.lastScrolled).closest('details').open,true);
 buttons.find(b=>b.textContent==='Lataa vertailusynteesi JSON').click();const exported=JSON.parse(await download.text());assert.equal(exported.groups.length,6);assert.ok(!JSON.stringify(exported).includes('large_source_not_exported'));assert.deepEqual(calls,['/api/session','/api/articles','/api/analysis']);dom.window.close();
});
