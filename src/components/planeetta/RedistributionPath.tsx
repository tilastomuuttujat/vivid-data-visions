import { useLinkedYear, TimelineCoverage } from './timeline-context';
import { useId, useState } from 'react';
import data from './redistribution-data.json';
import './redistribution-path.css';
const stages = [
  {key:'gini_tuotektu',name:'Ennen tulonsiirtoja',color:'#ffad83'},
  {key:'gini_bruttotu',name:'Saatujen tulonsiirtojen jälkeen',color:'#d5a4f1'},
  {key:'gini_kturaha',name:'Maksettujen tulonsiirtojen jälkeen',color:'#65d9ec'},
] as const;
const fmt=(v:number|null)=>v===null?'Ei saatavilla':v.toLocaleString('fi-FI',{maximumFractionDigits:1});
type Region=typeof data.regions[number];
const X=(year:number)=>55+(year-1995)/29*600;
const Y=(v:number)=>245-v*2.1;
function Trend({region,year}:{region:Region;year:number}){
  const point=region.points.find(p=>p.year===year)!;
  return <div className="rd-trend"><h3>{region.name}</h3><svg viewBox="0 0 720 290" role="img" aria-label={`${region.name}: kolme tulonjaon vaihetta 1995–2024, Gini-asteikko 0–100. Tarkat luvut taulukossa.`}>
    {[0,20,40,60,80,100].map(v=><g key={v}><line x1="55" x2="655" y1={Y(v)} y2={Y(v)} className="rd-grid"/><text x="45" y={Y(v)+4} textAnchor="end">{v}</text></g>)}
    <line x1={X(2010)} x2={X(2010)} y1="30" y2="245" className="rd-break"/><text x={X(2010)+5} y="23">Tulokäsitteen muutos</text>
    <line x1={X(year)} x2={X(year)} y1="30" y2="245" className="rd-cursor"/>
    {stages.map(s=><g key={s.key}><path fill="none" stroke={s.color} strokeWidth="3" d={region.points.reduce((path,p,i,arr)=>p[s.key]===null?path:path+`${i===0||p.year===2010||arr[i-1]![s.key]===null?'M':'L'}${X(p.year)},${Y(p[s.key]!)} `,'')}/>{point[s.key]!==null&&<circle cx={X(year)} cy={Y(point[s.key]!)} r="4" fill={s.color}/>}</g>)}
    {[1995,2000,2010,2020,2024].map(v=><text key={v} x={X(v)} y="277" textAnchor="middle">{v}</text>)}
  </svg><div className="rd-snapshot" aria-label={`${region.name}, ${year}`}>{stages.map(s=><p key={s.key} style={{color:s.color}}>{s.name}: <b>{fmt(point[s.key])}</b></p>)}</div>
  <p><b>Tasaava vaikutus yhteensä: {fmt(point.yht_vai)} %.</b> Saatujen tulonsiirtojen vaikutus {fmt(point.sts_vai)} %; maksettujen {fmt(point.mts_vai)} %. Prosenttien vertailupohjat eroavat, joten niitä ei lasketa yhteen.</p></div>;
}
export function RedistributionPath(){
  const uid=useId();const [region,setRegion]=useState('MK08');const [year,setYear]=useLinkedYear(2024,{min:1995,max:2024});
  const country=data.regions.find(r=>r.id==='SSS')!;const selected=data.regions.find(r=>r.id===region)!;
  const shown=region==='SSS'?[country]:[country,selected];
  return <section className="rd" aria-labelledby={`${uid}-title`}>
    <p className="v-kicker">Uudelleenjako · 1995–2024</p>
    <TimelineCoverage year={year} />
    <h2 id={`${uid}-title`}>Kuinka paljon yhteinen järjestelmä kaventaa tuloeroja?</h2>
    <p>Tuotannontekijätulot kuvaavat työn ja omaisuuden tuottamia tuloja. Saadut tulonsiirrot, kuten eläkkeet ja etuudet, muodostavat niiden kanssa bruttotulot. Maksettujen tulonsiirtojen, kuten välittömien verojen ja sosiaaliturvamaksujen, jälkeen jäävät käytettävissä olevat rahatulot.</p>
    <p>Kolme viivaa näyttää tuloerot näissä vaiheissa. Mitä suurempi viivojen väli, sitä enemmän järjestelmä kaventaa havaittuja tuloeroja. Gini on asteikolla 0–100: pienempi luku tarkoittaa tasaisempaa tulonjakoa.</p>
    <label htmlFor={`${uid}-region`}>Vertailualue <select id={`${uid}-region`} value={region} onChange={e=>setRegion(e.target.value)}>{data.regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
    <label htmlFor={`${uid}-year`}>Tarkasteluvuosi: <b>{year}</b></label><input id={`${uid}-year`} type="range" min="1995" max="2024" value={year} onChange={e=>setYear(Number(e.target.value))} aria-valuetext={String(year)}/>
    <div className="rd-legend">{stages.map(s=><span key={s.key} style={{color:s.color}}>{s.name}</span>)}</div>
    <div className="rd-panels" aria-live="polite">{shown.map(r=><Trend key={r.id} region={r} year={year}/>)}</div>
    <p><b>Koko maan havainto:</b> lähteen tasaava kokonaisvaikutus oli 54,5 % vuonna 1995 ja 45,8 % vuonna 2024. Käytettävissä olevien rahatulojen Gini oli vastaavasti 22,2 ja 28,4. Vuosien 1995–2009 ja 2010–2024 tulokäsitteet eroavat, joten päätepistevertailu ei ole täysin yhdenmukainen.</p>
    <p><b>Mitä tämä auttaa tutkimaan?</b> Kasvavatko lähtötilanteen tuloerot, heikkeneekö tasaava vaikutus vai tapahtuvatko molemmat? Työttömyys, ikääntyminen, pääomatulot ja väestörakenne vaikuttavat lukuihin politiikan rinnalla. Mittari ei yksin osoita tietyn hallituksen tai puolueen vaikutusta.</p>
    <details><summary>Tarkat vuositiedot</summary>{shown.map(r=><div className="rd-table" key={r.id}><table><caption>{r.name}: Gini ja tasaava vaikutus</caption><thead><tr><th>Vuosi</th>{stages.map(s=><th key={s.key}>{s.name}</th>)}<th>Tasaava kokonaisvaikutus, %</th></tr></thead><tbody>{r.points.map(p=><tr key={p.year}><th scope="row">{p.year}</th>{stages.map(s=><td key={s.key}>{fmt(p[s.key])}</td>)}<td>{fmt(p.yht_vai)}</td></tr>)}</tbody></table></div>)}</details>
    <details><summary>Laskentatapa, lähde ja rajaukset</summary>
      <p>Tasaava kokonaisvaikutus = (tuotannontekijätulojen Gini − käytettävissä olevien rahatulojen Gini) / tuotannontekijätulojen Gini × 100. Saatujen tulonsiirtojen vaikutus käyttää vertailupohjana tuotannontekijätuloja; maksettujen vaikutus bruttotuloja. Näytämme lähteen valmiit tunnusluvut, jotka voivat poiketa hieman pyöristetyistä Gini-luvuista itse lasketuista arvoista.</p>
      <p>Tulonsiirtoihin sisältyvät myös eläkkeet. Maksetut tulonsiirrot eivät tarkoita kaikkia veroja: esimerkiksi kulutusverojen vaikutus ostovoimaan ei näy tässä samalla tavalla. Julkisten palvelujen, kuten koulutuksen ja hoidon, rahallista arvoa ei sisällytetä. Tämä ei siis ole koko hyvinvointivaltion vaikutuksen mitta.</p>
      <p>Tilastoyksikkö on asuntoväestön henkilö. Asuntokunnan tulot jaetaan kulutusyksiköillä, ja kukin jäsen saa saman laskennallisen tulon. Asunnottomat ja laitoksissa vakinaisesti asuvat eivät kuulu asuntoväestöön. Aineisto perustuu rekistereihin, eikä sitä voi suoraan yhdistää otospohjaisiin EU-SILC-sarjoihin. Koko aikasarja käyttää 1.1.2025 aluejakoa; osakuntaliitoksia ei yleensä ole huomioitu liitosta edeltäville vuosille. Maakuntien Gini kuvaa alueen sisäisiä eroja, ei maakuntien välistä tuloeroa.</p>
      <p>Tulonimikkeistön muutos katkaisee täyden vertailukelpoisuuden vuosien 2009 ja 2010 välillä. Viivaa ei yhdistetä tämän rajan yli. Puuttuvia havaintoja ei korvata nollilla. Tasaava vaikutus on havaittujen tulokäsitteiden vertailu, ei arvio siitä, millainen yhteiskunta olisi ilman veroja ja etuuksia. Aineisto haettu {data.retrieved}.</p>
      <a href="https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tjt/14ww.px/">Tilastokeskus: StatFin 14ww, määritelmät ja lähdetaulukko</a>
    </details>
  </section>;
}
