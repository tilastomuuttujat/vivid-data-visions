import { useLinkedYear, useLinkedRegion, TimelineCoverage } from './timeline-context';
import { useId, useState } from 'react';
import geo from '@/data/maakunnat.json';
import data from './regional-path-data.json';
import './regional-path.css';
type Metric = 'population' | 'jobs' | 'industry' | 'information' | 'income';
const metrics: Record<Metric, {label:string;start:number;end:number;unit:string}> = {
  population:{label:'Väestö',start:1990,end:2024,unit:'henkilöä'},
  jobs:{label:'Työllisyys yhteensä',start:2000,end:2024,unit:'henkilöä (vuosikeskiarvo)'},
  industry:{label:'Teollisuuden työllisyys',start:2000,end:2023,unit:'henkilöä (vuosikeskiarvo)'},
  information:{label:'Informaatio ja viestintä',start:2000,end:2023,unit:'henkilöä (vuosikeskiarvo)'},
  income:{label:'Reaalinen mediaanitulo',start:1995,end:2024,unit:'€/kulutusyksikkö, vuoden 2024 rahassa'},
};
const fmt=(n:number|null)=>n===null?'Ei saatavilla':n.toLocaleString('fi-FI',{maximumFractionDigits:1});
const fills=['#ad6449','#dca17f','#8a9d9c','#74bcc3','#4bcbdc'];
export function RegionalPath(){
  const uid=useId();
  const [region,setRegion]=useLinkedRegion('MK08');
  const [metric,setMetric]=useState<Metric>('population');
  const [year,setYear]=useLinkedYear(2024,{min:metrics[metric].start,max:metrics[metric].end});
  const config=metrics[metric];
  const selected=data.regions.find(r=>r.id===region)!;
  const country=data.regions.find(r=>r.id==='SSS')!;
  const current=selected.points.find(p=>p.year===year)!;
  const base=selected.points.find(p=>p.year===config.start)!;
  const index=(r:typeof selected,y:number):number|null=>{
    const a=r.points.find(p=>p.year===config.start)?.[metric];const b=r.points.find(p=>p.year===y)?.[metric];
    return a==null||b==null||a===0?null:b/a*100;
  };
  const years=selected.points.filter(p=>p.year>=config.start&&p.year<=config.end).map(p=>p.year);
  const changes=data.regions.filter(r=>r.id!=='SSS').map(r=>({r,v:index(r,year)}));
  const color=(v:number|null)=>v===null?'#555':fills[v<80?0:v<95?1:v<=105?2:v<=120?3:4];
  const all=[selected,country].flatMap(r=>years.map(y=>index(r,y)).filter((v):v is number=>v!==null));
  const ceiling=Math.max(150,Math.ceil(Math.max(...all)/50)*50);
  const x=(y:number)=>60+(y-config.start)/(config.end-config.start)*620;
  const y=(v:number)=>235-v/ceiling*200;
  const path=(r:typeof selected)=>years.map(yr=>({yr,v:index(r,yr)})).reduce((s,p,i,arr)=>p.v===null?s:s+`${i===0||arr[i-1]!.v===null?'M':'L'}${x(p.yr)},${y(p.v)} `,'');
  return <section className="rp" aria-labelledby={`${uid}-title`}>
    <p className="v-kicker">Alueellinen pääpolku · 1990–2024</p>
    <TimelineCoverage year={year} />
    <h2 id={`${uid}-title`}>Missä toimeentulon perusta vahvistui, missä se heikkeni?</h2>
    <p>Valitse maakunta ja mittari. Kartta näyttää muutoksen mittarin alkuvuodesta valittuun vuoteen; kuvaaja vertaa maakuntaa koko maahan. Väestö alkaa vuodesta 1990, tulot vuodesta 1995 ja työllisyys vuodesta 2000. Toimialakohtaiset sarjat päättyvät vuoteen 2023; kokonaistyöllisyys ulottuu vuoteen 2024.</p>
    <div className="rp-controls"><label htmlFor={`${uid}-metric`}>Mittari <select id={`${uid}-metric`} value={metric} onChange={e=>{const m=e.target.value as Metric;setMetric(m);}}>{Object.entries(metrics).map(([key,m])=><option key={key} value={key}>{m.label}</option>)}</select></label><label htmlFor={`${uid}-region`}>Maakunta <select id={`${uid}-region`} value={region} onChange={e=>setRegion(e.target.value)}>{data.regions.filter(r=>r.id!=='SSS').map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>
    <label htmlFor={`${uid}-year`}>Vuosi: <b>{year}</b></label><input id={`${uid}-year`} type="range" min={config.start} max={config.end} value={year} aria-valuetext={String(year)} onChange={e=>setYear(Number(e.target.value))}/>
    <div className="rp-body">
      <div><svg viewBox={`-4 -4 ${geo.width+8} ${geo.height+8}`} className="rp-map" role="group" aria-label="Valitse maakunta Suomen kartasta">{geo.regions.map(r=>{const v=index(data.regions.find(d=>d.id===r.id)!,year);return <path key={r.id} d={r.path} fill={color(v)} stroke={region===r.id?'#fff':'#18252e'} strokeWidth={region===r.id?1.6:.4} role="button" tabIndex={0} aria-label={`${r.name}: ${v===null?'tieto puuttuu':fmt(v-100)+' %'}, valitse maakunta`} aria-pressed={region===r.id} onClick={()=>setRegion(r.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setRegion(r.id);}}}><title>{r.name}: {v===null?'tieto puuttuu':fmt(v-100)+' %'}</title></path>;})}</svg><p className="rp-legend">Muutos {config.start}–{year}, %</p><div className="rp-bins">{['alle −20','−20 – alle −5','−5 – +5','yli +5 – +20','yli +20'].map((label,i)=><span key={label}><i style={{background:fills[i]}}/>{label}</span>)}</div><p className="rp-note">Harmaa: puuttuva tieto. Väri kertoo muutoksen, ei alueen paremmuutta. Maakunnan keskiarvo peittää kuntien erot.</p></div>
      <div><h3>{selected.name} · {config.label}</h3><p aria-live="polite">{config.start}: <b>{fmt(base[metric])}</b> → {year}: <b>{fmt(current[metric])}</b> {config.unit}. Muutos <b>{index(selected,year)===null?'Ei saatavilla':fmt(index(selected,year)!-100)+' %'}</b>.</p>
        <p className="rp-chart-legend">Turkoosi: {selected.name} · katkoviiva: koko maa · {config.start}=100</p>
        <svg viewBox="0 0 750 285" role="img" aria-label={`${config.label}, maakunta ja koko maa. Tarkat luvut taulukossa.`}>{Array.from({length:ceiling/50+1},(_,i)=>i*50).map(v=><g key={v}><line x1="60" x2="680" y1={y(v)} y2={y(v)} className="rp-grid"/><text x="50" y={y(v)+4} textAnchor="end">{v}</text></g>)}<path d={path(selected)} fill="none" stroke="#65d9ec" strokeWidth="3"/><path d={path(country)} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 5"/><line x1={x(year)} x2={x(year)} y1="30" y2="235" className="rp-cursor"/>{[config.start,2010,config.end].filter((v,i,a)=>a.indexOf(v)===i&&v>=config.start).map(v=><text key={v} x={x(v)} y="268" textAnchor="middle">{v}</text>)}</svg>
        <p>65 vuotta täyttäneiden osuus: <b>{fmt(current.olderShare)} %</b>. Pienituloisuusaste: <b>{fmt(current.poverty)}{current.poverty===null?'':' %'}</b>.</p>
        <p><b>Havaintokysymys:</b> korvaako uusien toimialojen kasvu teollisuuden menetyksiä? Kulkevatko väestö, työllisyys ja tulot samaan suuntaan? Vaihda mittaria ja tutki samaa maakuntaa.</p>
      </div>
    </div>
    <details><summary>Maakuntien vertailu ja tarkat luvut</summary><div className="rp-table"><table><caption>{config.label}: {config.start} → {year}</caption><thead><tr><th>Alue</th><th>{config.start}</th><th>{year}</th><th>Muutos, %</th></tr></thead><tbody>{[...changes.map(c=>c.r),country].map(r=>{const v=index(r,year);return <tr key={r.id}><th scope="row">{r.name}</th><td>{fmt(r.points.find(p=>p.year===config.start)![metric])}</td><td>{fmt(r.points.find(p=>p.year===year)![metric])}</td><td>{v===null?'Ei saatavilla':fmt(v-100)}</td></tr>;})}</tbody></table></div><div className="rp-table"><table><caption>{selected.name}: vuosihavainnot, {config.unit}</caption><thead><tr><th>Vuosi</th><th>{config.label}</th><th>Maakunta, indeksi</th><th>Koko maa, indeksi</th></tr></thead><tbody>{years.map(v=><tr key={v}><th scope="row">{v}</th><td>{fmt(selected.points.find(p=>p.year===v)![metric])}</td><td>{fmt(index(selected,v))}</td><td>{fmt(index(country,v))}</td></tr>)}</tbody></table></div></details>
    <details><summary>Lähteet, aluejaot ja tulkinnan rajat</summary><p>Tilastokeskus: väestö ja ikärakenne 11ra (aluejako 1.1.2026), tulot ja pienituloisuus 14ww (1.1.2025), aluetilinpidon työllisyys 12bg (1.1.2025). Sarjat käyttävät oman taulukkonsa kiinteää aluejakoa myös menneille vuosille. Kartta käyttää sovelluksen olemassa olevaa maakuntageometriaa; rajavuosien erot on huomioitava tarkassa paikallisvertailussa. Aineisto haettu {data.retrieved}.</p><p>Työllisyys tarkoittaa aluetilinpidon alueellisen tuotannon työllisiä, vuosikeskiarvona; se ei ole vuoden lopun rekisterityöpaikkojen määrä. Teollisuus on toisensa poissulkevien toimialaryhmien 10–33 summa. Informaatio ja viestintä on toimiala J, ei kaiken teknologia- tai tietotyön määrä. Aluetilinpidon 2024 tiedot ovat ennakollisia. Vuoden 2024 toimialakohtaiset työllisyystiedot puuttuvat lähdetaulukosta, joten teollisuuden ja informaation vertailu päättyy vuoteen 2023. Salassapidon alaiset ja muut puuttuvat tiedot jätetään puuttuviksi, eikä niitä korvata nollilla.</p><p>Tulot ovat asuntokunnan käytettävissä olevien rahatulojen mediaani kulutusyksikköä kohti, vuoden 2024 rahassa. Tulokäsite muuttui ennen vuotta 2009; pidemmän vertailun tulkinta vaatii tätä varausta. Asuntoväestö ei kata esimerkiksi laitoksissa asuvia ja asunnottomia. Pienituloisuusaste käyttää suhteellista rajaa (60 % valtakunnallisesta mediaanista).</p><ul>{[['vaerak','11ra','Väestö'],['tjt','14ww','Tulot ja pienituloisuus'],['altp','12bg','Työllisyys toimialoittain']].map(([ds,id,label])=><li key={id}><a href={`https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__${ds}/${id}.px/`}>{label}: StatFin {id}</a></li>)}</ul><p>Kartta ei osoita valtion omistuksen vähentämisen aiheuttaneen alueen muutosta. Sen koetteluun tarvitaan yhtiöiden tapahtuma- ja investointihistoriaa sekä vertailupaikkakuntia. Tehtaan vaikutuksia pitää tutkia kuntatasolla; maakunta on laajempi kokonaisuus.</p></details>
  </section>;
}
