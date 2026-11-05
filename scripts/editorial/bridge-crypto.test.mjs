import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encrypt,decrypt,pair,seal,unseal} from './bridge-crypto.mjs';
test('private Finnish text roundtrips; ciphertext and sessions reject tampering',async()=>{
 const keys=await pair(),value={body:'Yhteinen ääni – luonnos',requestId:'abc'};
 const box=await encrypt(value,keys.publicKey);assert.deepEqual(await decrypt(box,keys.privateKey),value);
 assert.ok(!JSON.stringify(box).includes(value.body));
 const wrong=await pair();await assert.rejects(decrypt(box,wrong.privateKey));
 const sealed=seal({expires:123,privateKey:keys.privateKey},'test-only-key');assert.equal(unseal(sealed,'test-only-key').expires,123);
 assert.throws(()=>unseal(sealed,'different-key'));
 box.data=box.data.slice(0,20)+'AAAA'+box.data.slice(24);await assert.rejects(decrypt(box,keys.privateKey));
});
test('browser opens and saves through encrypted Actions protocol',async()=>{
 const {readFileSync}=await import('node:fs');const {webcrypto}=await import('node:crypto');
 const oldCrypto=globalThis.crypto;Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
 const server=await pair(),replies=new Map();let saved=false;
 const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const window={localStorage:storage,articleEditorTransport:async(path)=>{if(path==='/api/logout')return {};throw Error('direct not expected');},addEventListener(){},dispatchEvent(){}};
 let remember=false;
 const document={getElementById:id=>id==='connection-mode'?{value:'github'}:id==='remember-device'?{checked:remember}:{hidden:true}};
 const fetcher=async(url,options)=>{
  let result={};if(url.endsWith('/user'))result={login:'tilastomuuttujat'};
  else if(url.endsWith('/repos/tilastomuuttujat/vivid-data-visions'))result={permissions:{push:true}};
  else if(url.endsWith('/dispatches')){const request=JSON.parse(JSON.parse(options.body).inputs.request);let data={requestId:request.id,catalog:{articles:[]},articles:{},history:{}};
   if(request.operation==='open'){server.client=request.publicKey;data={...data,publicKey:server.publicKey,session:'sealed',expires:Date.now()+60000};}
   else {const command=await decrypt(request.payload,server.privateKey);assert.equal(command.requestId,request.id);assert.equal(command.data.changes.body_text,'Ääni');saved=true;data.saved={revision:2};}
   replies.set(request.id,await encrypt(data,server.client));return {ok:true,status:204};
  }else{const id=url.match(/responses\/([a-f0-9-]+).json/)[1];result={content:Buffer.from(JSON.stringify(replies.get(id))).toString('base64')};}
  return {ok:true,status:200,json:async()=>result};
 };
 const run=new Function('window','document','fetch','setTimeout','CustomEvent',readFileSync(new URL('./github-browser.js',import.meta.url),'utf8'));
 run(window,document,fetcher,fn=>fn(),class{constructor(type,options){this.detail=options.detail;}});
 await window.articleEditorTransport('/api/login',{password:'test'});
 assert.deepEqual(await window.articleEditorTransport('/api/articles'),{articles:[]});
 await window.articleEditorTransport('/api/articles/00000000-0000-0000-0000-000000000000',{expected_revision:1,changes:{body_text:'Ääni'}});assert.ok(saved);
 assert.equal(memory.size,0,'no credential storage without explicit opt-in');
 remember=true;await window.articleEditorTransport('/api/login',{password:'remembered-test'});
 assert.equal(memory.get('atlas-article-editor-github-v1'),'remembered-test');
 await window.articleEditorTransport('/api/logout',{});assert.equal(memory.size,1,'disconnect preserves opt-in');
 run(window,document,fetcher,fn=>fn(),class{constructor(type,options){this.detail=options.detail;}});
 await window.articleEditorTransport('/api/session');assert.deepEqual(await window.articleEditorTransport('/api/articles'),{articles:[]});
 await window.articleEditorTransport('/api/logout',{forget:true});assert.equal(memory.size,0,'forget deletes saved credential');
 Object.defineProperty(globalThis,'crypto',{value:oldCrypto,configurable:true});
});
