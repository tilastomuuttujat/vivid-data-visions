import { useMemo, useState } from 'react';
import { MainLinks } from '@/components/MainLinks';
import atlas from '@/data/atlas.json';

type Step = { year: number; label: string; text: string; stage: number };
type Theme = { id: number; name: string; thesis?: string; steps: Step[] };
const themes = (atlas.themes as Theme[]).filter(t => t.steps?.length);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const palette = ['#79c6ef','#e5b47b','#a8d6aa','#d4a5e9','#f0a9a0','#c2cbd9'];
type View = 'tracks' | 'multiples' | 'paths';

export function Teemavertailu() {
  const [ids,setIds] = useState<number[]>(themes.slice(0,3).map(t=>t.id));
  const [start,setStart] = useState(1850);
  const [end,setEnd] = useState(2050);
  const [view,setView] = useState<View>('tracks');
  const [selected,setSelected] = useState<{id:number;step:Step}|null>(null);
  const [search,setSearch] = useState('');
  const chosen = useMemo(()=>ids.map(id=>themes.find(t=>t.id===id)).filter((t):t is Theme=>!!t),[ids]);
  const steps = (t:Theme)=>t.steps.filter(s=>s.year>=start&&s.year<=end).sort((a,b)=>a.year-b.year);
  const filtered=themes.filter(t=>t.name.toLocaleLowerCase('fi').includes(search.toLocaleLowerCase('fi')));
  const x=(year:number)=>35+(clamp(year,start,end)-start)/(end-start)*730;
  const toggle=(id:number)=>{setSelected(null);setIds(current=>current.includes(id)?current.filter(x=>x!==id):current.length<6?[...current,id]:current);};
  const detail=selected&&themes.find(t=>t.id===selected.id);
  return <main style={{minHeight:'100vh',background:'#0c1725',color:'#edf3f8',padding:'28px max(18px,4vw)',fontFamily:'DM Sans, sans-serif'}}>
    <div style={{maxWidth:1200,margin:'auto'}}>
      <nav style={{display:'flex',flexWrap:'wrap',gap:14,marginBottom:28}}><MainLinks exclude="/teemavertailu" /></nav>
      <p style={{color:'#9dc4d6',letterSpacing:2,textTransform:'uppercase',fontSize:12}}>Suomen rakennemuutosten atlas · 32 teemaa</p>
      <h1 style={{fontSize:'clamp(28px,4vw,52px)',fontFamily:'Fraunces, serif',margin:'8px 0'}}>Teemavertailu</h1>
      <p style={{maxWidth:820,color:'#b9cbd9'}}>Tutki yhtä tai enintään kuutta teemaa samassa aikaikkunassa. Vaihda aikaraidoista rinnakkaiskuvaajiin ja selityspolkuihin. Vaiheet ovat laadullisia tulkintoja, eivät yhteismitallisia tilastoja.</p>
      <section aria-label="Teemojen valinta" style={{background:'#152537',padding:20,borderRadius:16,marginTop:24}}>
        <label htmlFor="theme-search">Etsi teema</label>
        <input id="theme-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Hae 32 teemasta" style={{display:'block',width:'100%',maxWidth:400,margin:'8px 0 14px',padding:10,background:'#0b1724',color:'white',border:'1px solid #607387',borderRadius:8}}/>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',maxHeight:175,overflowY:'auto'}}>
          {filtered.map(t=><button key={t.id} type="button" aria-pressed={ids.includes(t.id)} onClick={()=>toggle(t.id)} style={{padding:'8px 11px',borderRadius:18,border:'1px solid #557083',background:ids.includes(t.id)?'#b9ddeb':'#24394a',color:ids.includes(t.id)?'#102638':'#f2f5f9',cursor:'pointer'}}>{ids.includes(t.id)?'✓ ':'+ '}{t.name}</button>)}
        </div>
        <p style={{fontSize:12,color:'#b5c6d2'}}>Valittuna {ids.length}/6. Näkymä käyttää repositorion versioitua atlas.json-aineistoa.</p>
        <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'end',marginTop:16}}>
          <label>Alkuvuosi <strong>{start}</strong><input aria-label="Aikaikkunan alku" type="range" min="1850" max="2045" step="5" value={start} onChange={e=>setStart(Math.min(Number(e.target.value),end-5))} style={{display:'block',width:220}}/></label>
          <label>Loppuvuosi <strong>{end}</strong><input aria-label="Aikaikkunan loppu" type="range" min="1855" max="2050" step="5" value={end} onChange={e=>setEnd(Math.max(Number(e.target.value),start+5))} style={{display:'block',width:220}}/></label>
          <button type="button" onClick={()=>{setStart(1850);setEnd(2050);}} style={{padding:'9px 13px',border:'1px solid #748c9e',borderRadius:8,color:'white',background:'transparent'}}>Koko ajanjakso</button>
        </div>
      </section>
      <div role="tablist" aria-label="Vertailunäkymä" style={{display:'flex',gap:8,flexWrap:'wrap',margin:'24px 0'}}>
        {([['tracks','1 · Aikaraidat'],['multiples','2 · Rinnakkaiskuvaajat'],['paths','3 · Selityspolut']] as const).map(([k,label])=><button key={k} role="tab" aria-selected={view===k} onClick={()=>{setView(k);setSelected(null);}} style={{padding:'12px 18px',borderRadius:10,border:'1px solid #5c7b8b',background:view===k?'#c6e4ed':'#1c3041',color:view===k?'#122c3a':'white'}}>{label}</button>)}
      </div>
      {chosen.length===0?<p>Valitse vähintään yksi teema.</p>:view==='tracks'?<section aria-label="Rinnakkaiset teemaraidat">
        {chosen.map((t,i)=><article key={t.id} style={{background:'#152537',padding:16,borderRadius:12,marginBottom:12}}>
          <h2 style={{fontSize:17,color:palette[i],margin:'0 0 6px'}}>{t.name}</h2>
          <svg viewBox="0 0 800 65" width="100%" role="img" aria-label={t.name+' tapahtumat aikajanalla '+start+'–'+end}>
            <line x1="35" y1="28" x2="765" y2="28" stroke="#698091" strokeWidth="2"/>
            {steps(t).map((s,j)=><g key={j}><circle cx={x(s.year)} cy="28" r="7" fill={palette[i]}/><text x={x(s.year)} y={j%2===0?14:54} textAnchor="middle" fontSize="12" fill="#eaf2f5">{s.year}</text></g>)}
            <text x="35" y="63" fontSize="10" fill="#9bb0be">{start}</text><text x="765" y="63" fontSize="10" textAnchor="end" fill="#9bb0be">{end}</text>
          </svg>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{steps(t).map((s,j)=><button key={j} onClick={()=>setSelected({id:t.id,step:s})} style={{fontSize:12,padding:'7px 9px',border:'1px solid #50697b',borderRadius:8,background:'#20384c',color:'#f4f7f9'}}>{s.year} · {s.label}</button>)}</div>
        </article>)}
      </section>:view==='multiples'?<section aria-label="Teemojen pienet rinnakkaiskuvaajat" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:14}}>
        {chosen.map((t,i)=><article key={t.id} style={{background:'#152537',borderRadius:12,padding:18}}>
          <h2 style={{fontSize:17,color:palette[i]}}>{t.name}</h2>
          <p style={{fontSize:13,color:'#b8cad7'}}>{t.thesis}</p>
          <svg viewBox="0 0 400 95" width="100%" role="img" aria-label="Vaiheiden ajallinen sijoittuminen, ei numeerinen trendi">
            <line x1="20" x2="380" y1="40" y2="40" stroke="#6b8295"/>
            {steps(t).map((s,j)=><g key={j}><circle cx={20+(s.year-start)/(end-start)*360} cy="40" r="6" fill={palette[i]}/><text x={20+(s.year-start)/(end-start)*360} y={j%2?66:23} textAnchor="middle" fontSize="11" fill="#f1f5f9">{s.year}</text></g>)}
          </svg>
          <p style={{fontSize:12,color:'#aebfcb'}}>Vaiheiden ajankohdat · ei mitattua aikasarjaa</p>
          {steps(t).map((s,j)=><button key={j} onClick={()=>setSelected({id:t.id,step:s})} style={{display:'block',width:'100%',textAlign:'left',marginTop:6,padding:9,borderRadius:7,border:'1px solid #465e70',background:'#203649',color:'white'}}>{s.year} · {s.label}</button>)}
        </article>)}
      </section>:<section aria-label="Teemojen väliset selityspolut" style={{background:'#152537',padding:20,borderRadius:14}}>
        <p style={{color:'#b9cbd9'}}>Samassa ajallisessa ikkunassa esiintyvät vaiheet asetetaan rinnakkain. Aikajärjestys tai samanaikaisuus ei yksin osoita syy-yhteyttä. Tämä näkymä ei vielä esitä tietokannan varmennettuja suunnattuja mekanismikytkentöjä.</p>
        {chosen.flatMap((t,i)=>steps(t).map(s=>({t,s,i}))).sort((a,b)=>a.s.year-b.s.year).map(({t,s,i},j)=><div key={t.id+'-'+j} style={{display:'flex',gap:14,alignItems:'start',padding:'12px 0',borderBottom:'1px solid #334c5f'}}>
          <span style={{color:palette[i],minWidth:46}}>{s.year}</span><button onClick={()=>setSelected({id:t.id,step:s})} style={{textAlign:'left',background:'transparent',border:0,color:'white',cursor:'pointer'}}><strong>{t.name}</strong><span style={{display:'block',fontSize:13,color:'#b7c8d5'}}>{s.label}</span></button>
        </div>)}
      </section>}
      {detail&&selected&&<aside aria-live="polite" style={{position:'relative',background:'#233c50',border:'1px solid #7893a6',padding:22,borderRadius:14,marginTop:24}}>
        <button onClick={()=>setSelected(null)} aria-label="Sulje selitys" style={{position:'absolute',right:15,top:12,color:'white',background:'transparent',border:0,fontSize:22}}>×</button>
        <p style={{color:'#b8d9e7'}}>{detail.name} · {selected.step.year}</p>
        <h2 style={{fontSize:21}}>{selected.step.label}</h2><p>{selected.step.text}</p>
        <p style={{fontSize:12,color:'#bacbd7'}}>Lähde: atlas.json, teema {detail.id}, vaihe {selected.step.stage}. Historiallinen tulkinta; yksittäisen vaiheen tekstille ei tässä näkymässä ole erillistä lähdeviitettä.</p>
      </aside>}
      <p style={{color:'#9fb4c3',fontSize:13,marginTop:30}}>Seuraava aineistolaajennus: Supabasen mekanismikytkennät ja tilastolliset aikasarjat erillisinä, lähteistettyinä julkaisu-JSON-vienteinä.</p>
    </div>
  </main>;
}
