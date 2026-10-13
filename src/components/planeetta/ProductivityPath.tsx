import { useLinkedYear, TimelineCoverage } from './timeline-context';
import { useId, useState } from 'react';
import data from './productivity-data.json';
import './productivity-path.css';
const fmt = (v: number) => v.toLocaleString('fi-FI', { maximumFractionDigits: 1 });
export function ProductivityPath() {
  const uid = useId();
  const [start, setStart] = useState(1980);
  const [year, setYear] = useLinkedYear(2024,{min:start,max:2024});
  const rows = data.series.filter(r => r.year >= start);
  const base = rows[0]!;
  const selected = rows.find(r => r.year === year)!;
  const normalize = (r: typeof base, key: 'productivity' | 'realEarnings') => r[key] / base[key] * 100;
  const x = (y: number) => 65 + (y - start) / (2024 - start) * 650;
  const ceiling = Math.ceil(Math.max(...rows.flatMap(r => [normalize(r,'productivity'),normalize(r,'realEarnings')])) / 50) * 50;
  const y = (v: number) => 285 - v / ceiling * 240;
  return <section className="pp" aria-labelledby={`${uid}-title`}>
    <p className="v-kicker">Tuottavuus ja toimeentulo · 1980–2024</p>
    <TimelineCoverage year={year} />
    <h2 id={`${uid}-title`}>Kulkeeko työntekijän vaurastuminen tuotannon mukana?</h2>
    <p>Vertaa arvonlisäystä työtuntia kohti ja palkansaajien ansioiden ostovoimaa. Molemmat alkavat valitusta vuodesta arvolla 100. Viivojen erkaneminen avaa kysymyksen hyötyjen jakautumisesta; se ei yksin osoita työn halpuuttamista tai omistajapolitiikan vaikutusta.</p>
    <label htmlFor={`${uid}-start`}>Vertailun alku </label><select id={`${uid}-start`} value={start} onChange={e => {const v=Number(e.target.value);setStart(v);}}>{[1980,1990,2000,2010].map(v => <option key={v}>{v}</option>)}</select>
    <p className="pp-legend"><span>Turkoosi: työn tuottavuus</span><span>Oranssi: reaaliansiot</span></p>
    <svg viewBox="0 0 790 335" role="img" aria-label={`Tuottavuus ja reaaliansiot, ${start}=100. Tarkat luvut taulukossa.`}>
      {Array.from({length:ceiling/50+1},(_,i)=>i*50).map(v => <g key={v}><line x1="65" x2="715" y1={y(v)} y2={y(v)} className="pp-grid"/><text x="55" y={y(v)+4} textAnchor="end">{v}</text></g>)}
      {[start, ...[1990,2000,2010,2024].filter(v=>v>start)].map(v=><text key={v} x={x(v)} y="315" textAnchor="middle">{v}</text>)}
      <line x1={x(year)} x2={x(year)} y1="40" y2="285" className="pp-cursor"/>
      {(['productivity','realEarnings'] as const).map((key,i)=><polyline key={key} points={rows.map(r=>`${x(r.year)},${y(normalize(r,key))}`).join(' ')} fill="none" stroke={i?'#ffad83':'#65d9ec'} strokeWidth="3"/>)}
    </svg>
    <label htmlFor={`${uid}-year`}>Tarkasteluvuosi: <b>{year}</b></label><input id={`${uid}-year`} type="range" min={start} max="2024" value={year} onChange={e=>setYear(Number(e.target.value))} aria-valuetext={String(year)}/>
    <p aria-live="polite">Tuottavuus <b>{fmt(normalize(selected,'productivity'))}</b> · reaaliansiot <b>{fmt(normalize(selected,'realEarnings'))}</b> ({start}=100).</p>
    <h3>Kuinka suuri osa arvonlisäyksestä korvaa työtä?</h3>
    <svg viewBox="0 0 790 220" role="img" aria-label="Työvoimakorvausten osuus arvonlisäyksestä, prosenttia. Asteikko 0–100.">
      {[0,50,100].map(v=><g key={v}><line x1="65" x2="715" y1={170-v*1.3} y2={170-v*1.3} className="pp-grid"/><text x="55" y={174-v*1.3} textAnchor="end">{v} %</text></g>)}
      <polyline points={rows.map(r=>`${x(r.year)},${170-r.labourShare*1.3}`).join(' ')} fill="none" stroke="#acd680" strokeWidth="3"/>
      {[start,2024].map(v=><text key={v} x={x(v)} y="205" textAnchor="middle">{v}</text>)}
    </svg>
    <p>Vuonna {year} työvoimakorvausten osuus oli <b>{fmt(selected.labourShare)} %</b>. Se sisältää palkansaajakorvaukset ja yrittäjätulon; se ei ole pelkkä palkkojen osuus. Jäljelle jäävä pääomakorvaus on tilastollinen jäännös, ei sama asia kuin osinko tai osakkeenomistajan voitto.</p>
    <details><summary>Laskentatapa, rajaukset ja tarkat luvut</summary>
      <p>Tuottavuus: StatFin 14w1, Yhteensä, arvonlisäys/työtunti. Työvoimakorvausten osuus: 14w6, työvoimakorvaukset / käypähintainen arvonlisäys × 100. Tuottavuustilasto sulkee pois markkinattomat tuottajat sekä maatalouden ja asumisen toimialat. Reaaliansiot lasketaan koko palkansaajajoukon ansiotasoindeksistä 14uu jakamalla se elinkustannusindeksillä 11xm ja suhteuttamalla vertailuvuoteen. Tämä on laskettu reaaliansiosarja, ei suoraan taulukon 14un reaaliansioindeksi.</p>
      <p>Ansiotasoindeksi sisältää laajemman palkansaajajoukon kuin tuottavuussarja. Vertailu ei mittaa saman työntekijäjoukon palkkaa suhteessa sen tuottavuuteen. Bruttoansiot eivät sisällä verotuksen, tulonsiirtojen tai palvelujen vaikutuksia. Vuosi 2024 sisältää ennakkotietoja, ja sarjat voivat tarkentua. Aineisto haettu {data.retrieved}. Alkuvuoden vaihto muuttaa indeksointia, ei alkuperäisiä havaintoja.</p>
      <div className="pp-table"><table><caption>Vuositiedot; indeksit {start}=100</caption><thead><tr><th>Vuosi</th><th>Tuottavuus</th><th>Reaaliansiot</th><th>Työvoimakorvausten osuus, %</th></tr></thead><tbody>{rows.map(r=><tr key={r.year}><th scope="row">{r.year}</th><td>{fmt(normalize(r,'productivity'))}</td><td>{fmt(normalize(r,'realEarnings'))}</td><td>{fmt(r.labourShare)}</td></tr>)}</tbody></table></div>
      <ul>{[['ttut','14w1','Tuottavuus'],['ttut','14w6','Työ- ja pääomakorvaukset'],['ati','14uu','Ansiotasoindeksi'],['khi','11xm','Elinkustannusindeksi']].map(([ds,id,label])=><li key={id}><a href={`https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__${ds}/${id}.px/`}>{label}: Tilastokeskus {id}</a></li>)}</ul>
    </details>
    <p><b>Seuraava selityskysymys:</b> miten toimialarakenne, työehtojen muutokset, investoinnit ja omistajapolitiikka liittyvät havaittuihin käänteisiin? Keskimääräinen kehitys voi peittää matalapalkkaisen työn ja alueiden erot.</p>
  </section>;
}
