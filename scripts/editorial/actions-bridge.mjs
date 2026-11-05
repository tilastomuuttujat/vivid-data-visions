import { readFileSync } from 'node:fs';
import { encrypt,decrypt,pair,seal,unseal } from './bridge-crypto.mjs';
const repo='tilastomuuttujat/vivid-data-visions',branch='article-editor-responses';
const secret=process.env.TURSO_AUTH_TOKEN;
const transportWindow={fetch};new Function('window',readFileSync(new URL('./turso-browser.js',import.meta.url),'utf8'))(transportWindow);
const api=transportWindow.articleEditorTransport;
async function snapshot(){
 const catalog=await api('/api/articles'), articles={},history={};
 if(catalog.articles.length>1000)throw Error('Catalog too large');
 for(const a of catalog.articles){articles[a.id]=await api('/api/articles/'+a.id);history[a.id]=[];for(const h of await api('/api/articles/'+a.id+'/history'))history[a.id].push(await api('/api/articles/'+a.id+'/history/'+h.revision_no));}
 return {catalog,articles,history};
}
async function gh(path,method='GET',body){const r=await fetch('https://api.github.com/repos/'+repo+path,{method,headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok){const e=Error('GitHub response '+r.status);e.status=r.status;throw e;}return r.status===204?{}:r.json();}
async function publish(id,box){
 try{await gh('/git/ref/heads/'+branch);}catch(e){if(e.status!==404)throw e;const main=await gh('/git/ref/heads/main');try{await gh('/git/refs','POST',{ref:'refs/heads/'+branch,sha:main.object.sha});}catch(e){if(e.status!==422)throw e;await gh('/git/ref/heads/'+branch);}}
 for(let i=0;i<4;i++){try{await gh('/contents/responses/'+id+'.json','PUT',{branch,message:'Encrypted editor response',content:Buffer.from(JSON.stringify(box)).toString('base64')});return;}catch(e){if(e.status!==409||i===3)throw e;}}
}
async function main(){
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 if(process.env.GITHUB_REF!=='refs/heads/main'||process.env.GITHUB_REPOSITORY!==repo)throw Error('Untrusted ref');
 await api('/api/login',{url:'libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io',password:secret});
 if(process.env.GITHUB_EVENT_NAME==='push'){const keys=await pair();const data=await snapshot();const box=await encrypt(data,keys.publicKey);const decoded=await decrypt(box,keys.privateKey);if(decoded.catalog.articles.length!==data.catalog.articles.length)throw Error('Roundtrip failed');console.log('PASS encrypted article snapshot:',data.catalog.articles.length);return;}
 if(event.sender?.login!=='tilastomuuttujat')throw Error('Unauthorized actor');
 const raw=event.inputs?.request;if(typeof raw!=='string'||Buffer.byteLength(raw)>60000)throw Error('Invalid request');
 const request=JSON.parse(raw);if(!/^[a-f0-9-]{36}$/.test(request.id))throw Error('Invalid request id');
 let client,session;
 if(request.operation==='open'){client=request.publicKey;const keys=await pair();session={...keys,client,expires:Date.now()+3600000};}
 else {session=unseal(request.session,secret);if(session.expires<Date.now())throw Error('Session expired');client=session.client;}
 let result;
 try {
  if(request.operation==='open')result={session:seal(session,secret),publicKey:session.publicKey,expires:session.expires,...await snapshot()};
  else if(request.operation==='save'){const command=await decrypt(request.payload,session.privateKey);if(command.requestId!==request.id||!/^\/api\/articles\/[a-f0-9-]{36}$/.test(command.path))throw Error('Invalid command');const saved=await api(command.path,command.data);result={saved,...await snapshot()};}
  else throw Error('Invalid operation');
 }catch {result={error:'Toiminto epäonnistui. Avaa yhteys uudelleen ja tarkista uusin versio ennen tallentamista. Oma luonnoksesi säilyy editorissa.'};}
 await publish(request.id,await encrypt({requestId:request.id,...result},client));console.log('Encrypted response published.');
}
main().catch(()=>{console.error('Article bridge failed. No article text or credentials logged.');process.exitCode=1;});
