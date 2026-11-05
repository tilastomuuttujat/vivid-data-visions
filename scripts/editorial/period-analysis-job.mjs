// Private transfer: ciphertext only in GitHub; no text or credentials in logs.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {encrypt,decrypt,pair,seal,unseal} from './bridge-crypto.mjs';
const repo='tilastomuuttujat/vivid-data-visions';
const task=JSON.parse(readFileSync(new URL('./period-analysis-task.json',import.meta.url)));
async function query(sql){const r=await fetch('https://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io/v2/pipeline',{method:'POST',headers:{Authorization:'Bearer '+process.env.TURSO_AUTH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({requests:[{type:'execute',stmt:{sql,args:[]}},{type:'close'}]})});const j=await r.json();if(!r.ok||j.results[0].type!=='ok')throw Error('Database read failed');const v=j.results[0].response.result;return v.rows.map(row=>Object.fromEntries(row.map((c,i)=>[v.cols[i].name,c.type==='null'?null:c.type==='integer'?Number(c.value):c.value])));}
async function main(){if(process.env.GITHUB_REF!=='refs/heads/main'||process.env.GITHUB_REPOSITORY!==repo)throw Error('Untrusted ref');
 if(task.operation==='export'){
  const keys=await pair(),articles=await query('SELECT a.id,a.title,a.summary,a.body_text,(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=a.id) AS revision FROM editorial__articles a ORDER BY a.source_id,a.source_position');
  const value={articles,publicKey:keys.publicKey,session:seal({privateKey:keys.privateKey,expires:Date.now()+86400000},process.env.TURSO_AUTH_TOKEN)};
  const content=Buffer.from(JSON.stringify(await encrypt(value,task.publicKey))).toString('base64');
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/responses/'+task.id+'.json',{method:'PUT',headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},body:JSON.stringify({branch:'article-editor-responses',message:'Encrypted private analysis transfer',content})});if(!r.ok)throw Error('Encrypted export failed');console.log('PASS encrypted current-article export:',articles.length);
 }else if(['legal-map','legal-map-audit','legal-map-complete'].includes(task.operation)){
  const result=spawnSync('python',['scripts/editorial/legal_map.py',...(task.operation==='legal-map-audit'?['--audit']:task.operation==='legal-map-complete'?['--complete']:[])],{encoding:'utf8',env:process.env,maxBuffer:1000000});if(task.operation==='legal-map-audit')console.log(result.stdout.trim());if(result.status!==0){console.error('Mapping error class:',(result.stderr.match(/(?:^|\n)([A-Za-z]+Error):/)||[])[1]||'unknown');const msg=(result.stderr.trim().split('\n').at(-1)||'').replace(/^ValueError: /,'');const safe=['New identity must not invent status or metrics','Catalog completion readback mismatch','Provenance readback mismatch','Existing catalog content changed','Article sources changed','Conflicting existing statute key','Existing title differs; no overwrite allowed','Turso statement failed; details withheld to protect data'];if(safe.includes(msg))console.error('Mapping validation:',msg);throw Error('Lakikartta mapping failed');}if(task.operation!=='legal-map-audit')console.log(result.stdout.trim());
 }else if(['import','legal-import'].includes(task.operation)){
  const session=unseal(task.session,process.env.TURSO_AUTH_TOKEN);if(session.expires<Date.now())throw Error('Expired analysis transfer');const bundle=await decrypt(task.payload,session.privateKey);
  const result=spawnSync('python',[task.operation==='legal-import'?'scripts/editorial/legal_links.py':'scripts/editorial/period_analysis.py','import'],{input:JSON.stringify(bundle),encoding:'utf8',env:process.env,maxBuffer:1000000});if(result.status!==0){const last=(result.stderr||'').trim().split('\n').at(-1)||'Python failed';console.error(last.replace(/Bearer\s+\S+/g,'Bearer [redacted]'));throw Error('Analysis validation or import failed');}console.log(result.stdout.trim());
 }else throw Error('Unknown task');
}
main().catch(()=>{console.error('Private period analysis job failed; texts and credentials omitted.');process.exitCode=1;});
