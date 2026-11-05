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
  const legalLinks=await query('SELECT article_id,anchor_id,act_id,lakikartta_match_status,is_current FROM editorial__article_lakikartta');
  const value={articles,legalLinks,publicKey:keys.publicKey,session:seal({privateKey:keys.privateKey,expires:Date.now()+86400000},process.env.TURSO_AUTH_TOKEN)};
  const content=Buffer.from(JSON.stringify(await encrypt(value,task.publicKey))).toString('base64');
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/responses/'+task.id+'.json',{method:'PUT',headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},body:JSON.stringify({branch:'article-editor-responses',message:'Encrypted private analysis transfer',content})});if(!r.ok)throw Error('Encrypted export failed');console.log('PASS encrypted current-article export:',articles.length);
  }else if(task.operation==='evidence-quality-export'){
  if(!/^[0-9a-f-]{36}$/.test(task.id))throw Error('Invalid transfer ID');
  const audit=await query("SELECT payload_json FROM editorial__evidence_audits WHERE version='education-evidence-reuse-2026-11-05-v2'");
  const profiles=await query("SELECT payload_json FROM editorial__evidence_series_profiles WHERE version='education-evidence-quality-2026-11-05-v1' ORDER BY series_key");
  if(audit.length!==1||profiles.length!==110)throw Error('Incomplete quality snapshot');
  const value={audit:JSON.parse(audit[0].payload_json),profiles:profiles.map(r=>JSON.parse(r.payload_json))};
  const content=Buffer.from(JSON.stringify(await encrypt(value,task.publicKey))).toString('base64');
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/responses/'+task.id+'.json',{method:'PUT',headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},body:JSON.stringify({branch:'article-editor-responses',message:'Encrypted evidence quality transfer',content})});if(!r.ok)throw Error('Encrypted export failed');console.log('PASS encrypted evidence quality export:',profiles.length);
 }else if(task.operation==='evidence-quality'){
  const checks=spawnSync('python',['-m','unittest','discover','-s','scripts/editorial','-p','test_evidence_quality.py'],{encoding:'utf8',env:process.env});if(checks.status!==0)throw Error('Evidence quality checks failed');console.log('PASS evidence quality fixture checks');
  const result=spawnSync('python',['scripts/editorial/evidence_quality.py'],{encoding:'utf8',env:process.env,maxBuffer:1000000});if(result.status!==0)throw Error('Evidence quality review failed');console.log(result.stdout.trim());
 }else if(task.operation==='evidence-audit'){
  const checks=spawnSync('python',['-m','unittest','discover','-s','scripts/editorial','-p','test_evidence_reuse.py'],{encoding:'utf8',env:process.env});if(checks.status!==0)throw Error('Evidence audit checks failed');console.log('PASS evidence audit fixture checks');
  const result=spawnSync('python',['scripts/editorial/evidence_reuse.py'],{encoding:'utf8',env:process.env,maxBuffer:1000000});if(result.status!==0)throw Error('Evidence audit failed');console.log(result.stdout.trim());
 }else if(['legal-map','legal-map-audit','legal-map-complete'].includes(task.operation)){
  const result=spawnSync('python',['scripts/editorial/legal_map.py',...(task.operation==='legal-map-audit'?['--audit']:task.operation==='legal-map-complete'?['--complete',...(task.catalog==='finance'?['--finance']:task.catalog==='justice'?['--justice']:task.catalog==='market'?['--market']:[])]:[])],{encoding:'utf8',env:process.env,maxBuffer:1000000});if(task.operation==='legal-map-audit')console.log(result.stdout.trim());if(result.status!==0){console.error('Mapping error class:',(result.stderr.match(/(?:^|\n)([A-Za-z]+Error):/)||[])[1]||'unknown');const msg=(result.stderr.trim().split('\n').at(-1)||'').replace(/^ValueError: /,'');const safe=['New identity must not invent status or metrics','Catalog completion readback mismatch','Provenance readback mismatch','Existing catalog content changed','Article sources changed','Conflicting existing statute key','Existing title differs; no overwrite allowed','Turso statement failed; details withheld to protect data'];if(safe.includes(msg))console.error('Mapping validation:',msg);throw Error('Lakikartta mapping failed');}if(task.operation!=='legal-map-audit')console.log(result.stdout.trim());
 }else if(['import','legal-import'].includes(task.operation)){
  const session=unseal(task.session,process.env.TURSO_AUTH_TOKEN);if(session.expires<Date.now())throw Error('Expired analysis transfer');const bundle=await decrypt(task.payload,session.privateKey);
  const result=spawnSync('python',[task.operation==='legal-import'?'scripts/editorial/legal_links.py':'scripts/editorial/period_analysis.py','import'],{input:JSON.stringify(bundle),encoding:'utf8',env:process.env,maxBuffer:1000000});if(result.status!==0){const last=(result.stderr||'').trim().split('\n').at(-1)||'Python failed';console.error(last.replace(/Bearer\s+\S+/g,'Bearer [redacted]'));throw Error('Analysis validation or import failed');}console.log(result.stdout.trim());
  if(task.operation==='legal-import'){const mapping=spawnSync('python',['scripts/editorial/legal_map.py'],{encoding:'utf8',env:process.env,maxBuffer:1000000});if(mapping.status!==0)throw Error('Post-import Lakikartta mapping failed');console.log(mapping.stdout.trim());}
 }else throw Error('Unknown task');
}
main().catch(()=>{console.error('Private period analysis job failed; texts and credentials omitted.');process.exitCode=1;});
