/* GitHub Actions bridge: only encrypted article content crosses the public repository. */
(() => {
 const direct=window.articleEditorTransport,repo='tilastomuuttujat/vivid-data-visions',base='https://api.github.com/repos/'+repo;
 let token='',keys=null,state=null,cache=null;
 const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const b64=b=>{let s='';for(const c of new Uint8Array(b))s+=String.fromCharCode(c);return btoa(s);};
 const status=text=>window.dispatchEvent(new CustomEvent('editor-progress',{detail:text}));
 async function github(path,method='GET',body){const r=await fetch(path.startsWith('/')?'https://api.github.com'+path:base+path,{method,credentials:'omit',cache:'no-store',redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(r.status===404)return null;if(!r.ok)throw Error('GitHub-yhteys epäonnistui ('+r.status+'). Tarkista tunnisteen Actions: write- ja Contents: read -oikeudet.');return r.status===204?{}:r.json();}
 async function crypt(value,pub){const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),rsa=await crypto.subtle.importKey('jwk',pub,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);const compressed=await new Response(new Blob([JSON.stringify(value)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();return {iv:b64(iv),key:b64(await crypto.subtle.encrypt('RSA-OAEP',rsa,await crypto.subtle.exportKey('raw',aes))),data:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,compressed))};}
 async function decode(box){const raw=await crypto.subtle.decrypt('RSA-OAEP',keys.privateKey,bytes(box.key)),aes=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);const compressed=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(box.iv)},aes,bytes(box.data));return JSON.parse(await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).text());}
 async function request(command){const id=crypto.randomUUID(),input={id,...command};if(command.operation==='save'){input.payload=await crypt({requestId:id,path:command.path,data:command.data},state.publicKey);delete input.path;delete input.data;input.session=state.session;}
 const text=JSON.stringify(input);if(new TextEncoder().encode(text).length>60000)throw Error('Teksti on liian suuri Actions-välitykseen. Käytä suoraa Turso-yhteyttä.');
 status('Odotetaan GitHub Actionsia. Avaaminen tai tallentaminen voi kestää muutaman minuutin…');
 await github('/repos/'+repo+'/actions/workflows/article-editor-actions.yml/dispatches','POST',{ref:'main',inputs:{request:text}});
 for(let n=0;n<100;n++){await new Promise(r=>setTimeout(r,3000));const file=await github('/repos/'+repo+'/contents/responses/'+id+'.json?ref=article-editor-responses');if(file){const reply=await decode(JSON.parse(new TextDecoder().decode(bytes(file.content.replace(/\s/g,'')))));if(reply.requestId!==id)throw Error('Virheellinen vastaus.');if(reply.error)throw Error(reply.error);return reply;}}
 throw Error('Actions-vastausta ei saatu ajoissa. Tallennus voi vielä valmistua. Säilytä luonnoksesi ja avaa uusin versio ennen uutta tallennusta.');}
 async function connect(value){token=value.trim();const user=await github('/user'),repository=await github('/repos/'+repo);if(user?.login!=='tilastomuuttujat'||!repository?.permissions?.push)throw Error('Tarvitaan tilastomuuttujat-tilin kirjoitusoikeus.');keys=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);state=await request({operation:'open',publicKey:await crypto.subtle.exportKey('jwk',keys.publicKey)});cache=state;return {csrf:'github-actions-session'};}
 window.articleEditorTransport=async(path,data)=>{
  if(path==='/api/session'){let prior;try{prior=JSON.parse(sessionStorage.getItem('atlas-admin-v1')||'null');}catch{}if(prior?.login==='tilastomuuttujat'&&prior?.repo===repo&&prior?.token)return connect(prior.token);throw Error('Kirjaudu GitHub-tunnisteella.');}
  if(path==='/api/login'){if(document.getElementById('connection-mode').value==='turso'){token='';return direct(path,data);}return connect(data.password);}
  if(path==='/api/logout'){token='';keys=null;state=null;cache=null;return direct(path,data);}
  if(!token)return direct(path,data);
  if(!state||state.expires<Date.now())throw Error('GitHub-editori-istunto vanheni. Lataa oma tekstisi talteen ja avaa yhteys uudelleen.');
  if(path==='/api/articles')return cache.catalog;
  const parts=path.split('/'),id=decodeURIComponent(parts[3]||'');
  if(parts.length===4&&data!==undefined){const reply=await request({operation:'save',path,data});cache=reply;return reply.saved;}
  if(parts.length===4)return cache.articles[id];
  if(parts[4]==='history'){const history=cache.history[id]||[];return parts.length===5?history:history.find(r=>r.revision_no===Number(parts[5]));}
  throw Error('Tuntematon pyyntö.');
 };
 window.addEventListener('editor-progress',event=>{const e=document.getElementById('login-error');if(!document.getElementById('login').hidden)e.textContent=event.detail;else{const n=document.getElementById('notice');n.hidden=false;n.textContent=event.detail;}});
})();
