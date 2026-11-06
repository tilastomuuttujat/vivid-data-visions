// Read-only check against the actual library; no article text in logs.
import{readFileSync}from'node:fs';
const context={fetch};new Function('window',readFileSync(new URL('./turso-browser.js',import.meta.url),'utf8'))(context);
await import('./analysis-model.js');
await context.articleEditorTransport('/api/login',{url:'libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io',password:process.env.TURSO_AUTH_TOKEN});
try{
 const{articles}=await context.articleEditorTransport('/api/articles'),data=await context.articleEditorTransport('/api/analysis');
 const rows=globalThis.articleAnalysisModel.project(articles,data),s=globalThis.articleAnalysisModel.populationSynthesis(rows);
 if(s.ready!==6||s.groups.flatMap(g=>g.basis).length!==12||s.groups.some(g=>g.basis.some(b=>b.status!=='current')))throw Error('Current population references incomplete');
 console.log('PASS population synthesis: 6 reviewed scopes; 12 current article links; revision and source bindings checked against live library; read only.');
}finally{await context.articleEditorTransport('/api/logout');}
