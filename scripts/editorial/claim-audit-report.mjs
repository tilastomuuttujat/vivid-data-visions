// Read-only audit of the real library; only aggregate counts enter CI logs.
import {readFileSync} from 'node:fs';
const context={fetch};new Function('window',readFileSync(new URL('./turso-browser.js',import.meta.url),'utf8'))(context);
await import('./analysis-model.js');
await context.articleEditorTransport('/api/login',{url:'libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io',password:process.env.TURSO_AUTH_TOKEN});
const {articles}=await context.articleEditorTransport('/api/articles'),data=await context.articleEditorTransport('/api/analysis');
const rows=globalThis.articleAnalysisModel.project(articles,data),claims=rows.flatMap(r=>r.claims).filter(c=>c.current),gaps=globalThis.articleAnalysisModel.audit(rows);
if(!claims.length||claims.some(c=>!c.classification)||rows.some(r=>!r.claims.length))throw Error('Incomplete current classification');
const classes={},priorities={};for(const c of claims)classes[c.type]=(classes[c.type]||0)+1;for(const g of gaps)priorities[g.priority]=(priorities[g.priority]||0)+1;
console.log('PASS claim audit projection:',JSON.stringify({articles:rows.length,claims:claims.length,classes,gaps:priorities,articles_with_gaps:new Set(gaps.map(g=>g.article_id)).size}));
await context.articleEditorTransport('/api/logout');
