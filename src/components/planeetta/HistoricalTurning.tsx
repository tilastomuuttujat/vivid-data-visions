import { useId, useState } from 'react';
import { electionYears, partySeries, historicalSources } from './historical-election-data';
import './historical-turning.css';
import { PoliticalFeedback } from './PoliticalFeedback';

const fmt = (v: number) => v.toLocaleString('fi-FI', { maximumFractionDigits: 1 });
const X = (year: number) => 65 + (year - 1962) / (1991 - 1962) * 650;
const Y = (value: number) => 290 - value / 30 * 235;
export function HistoricalTurning() {
  const [index, setIndex] = useState(7);
  const [visible, setVisible] = useState(partySeries.map(p => p.id));
  const uid = useId();
  const year = electionYears[index]!;
  return <section className="ht" aria-labelledby={`${uid}-heading`}>
    <p className="v-kicker">Historiallinen suunnanmuutos · 1962–1991</p>
    <h2 id={`${uid}-heading`}>Toimeentulon rakenne muuttui. Muuttuiko myös poliittinen suunta?</h2>
    <p>Vaalitulokset näyttävät muutoksen ajoituksen. Vuoden 1991 tutkimus auttaa kysymään, miten palveluammattien kasvu, koulutus ja tulot liittyivät siihen.</p>
    <div className="ht-controls" aria-label="Näytettävät puolueet">{partySeries.map(p => <label key={p.id} style={{ color: p.color }}><input type="checkbox" checked={visible.includes(p.id)} onChange={e => setVisible(v => e.target.checked ? [...v, p.id] : v.filter(id => id !== p.id))} />{p.name}</label>)}</div>
    <svg viewBox="0 0 790 345" role="img" aria-label="Puolueiden valtakunnallinen kannatus eduskuntavaaleissa 1962–1991. Tarkat luvut taulukossa.">
      <rect x={X(1980)} y="40" width={X(1989) - X(1980)} height="250" className="ht-decade" />
      <text x={X(1980) + 6} y="32">1980-luku</text>
      {[0, 10, 20, 30].map(v => <g key={v}><line x1="65" x2="715" y1={Y(v)} y2={Y(v)} className="ht-grid" /><text x="55" y={Y(v) + 4} textAnchor="end">{v} %</text></g>)}
      {[1962, 1970, 1980, 1991].map(y => <text key={y} x={X(y)} y="323" textAnchor="middle">{y}</text>)}
      <line x1={X(year)} x2={X(year)} y1="40" y2="290" className="ht-cursor" />
      {partySeries.filter(p => visible.includes(p.id)).map(p => <g key={p.id} style={{ color: p.color }}><polyline fill="none" stroke="currentColor" strokeWidth="3" points={p.values.map((v, i) => `${X(electionYears[i]!)},${Y(v)}`).join(' ')} />{p.values.map((v, i) => <circle key={i} cx={X(electionYears[i]!)} cy={Y(v)} r={i === index ? 6 : 3} fill="currentColor"><title>{p.name} {electionYears[i]}: {fmt(v)} %</title></circle>)}</g>)}
    </svg>
    <label htmlFor={`${uid}-year`}>Valitse vaalivuosi: <b>{year}</b></label>
    <input id={`${uid}-year`} className="ht-range" type="range" min="0" max={electionYears.length - 1} step="1" value={index} onChange={e => setIndex(Number(e.target.value))} aria-valuetext={String(year)} />
    <div className="ht-values" aria-live="polite">{partySeries.filter(p => visible.includes(p.id)).map(p => <span key={p.id} style={{ color: p.color }}>{p.name}: <b>{fmt(p.values[index]!)} %</b></span>)}</div>
    <p><b>Suunnan havainto:</b> Kokoomuksen kannatus nousi 13,8 prosentista (1966) 23,1 prosenttiin (1987), mutta laski 19,3 prosenttiin vuonna 1991. Nousu alkoi ennen 1980-lukua; se ei ollut jatkuva tai kaikkien puolueiden yhteinen liike.</p>
    <details><summary>Tarkat vaalitulokset ja sarjarajat</summary><div className="ht-table"><table><caption>Valtakunnallinen ääniosuus, %</caption><thead><tr><th scope="col">Vuosi</th>{partySeries.map(p => <th scope="col" key={p.id}>{p.name}</th>)}</tr></thead><tbody>{electionYears.map((y, i) => <tr key={y}><th scope="row">{y}</th>{partySeries.map(p => <td key={p.id}>{fmt(p.values[i]!)}</td>)}</tr>)}</tbody></table></div><p>Keskustan sarjassa vuosi 1983 sisältää LKP:n. SKDL:n vuoden 1987 luku sisältää DEVA:n; vuonna 1991 sarja kuvaa Vasemmistoliittoa. Muut puolueet eivät näy tässä, joten osuudet eivät summaudu sataan. Vuosina 1962–1975 lähteen luvut sisältävät Ahvenanmaan äänet. Viivat yhdistävät vain vaalihavainnot, eivät vuosittaisia mittauksia.</p><a href={historicalSources.results} target="_blank" rel="noreferrer">Tilastokeskus: alkuperäinen tulostaulukko ja alaviitteet</a></details>
    <h3>Mihin kannatuksen muutos liittyi?</h3>
    <p>Martikaisen ja Yrjösen kuntatutkimuksessa (1991, painetut s. 80–81) Kokoomuksen kasvu Etelä-Suomen keskuksissa liittyi palveluammattien ja väestön kasvuun sekä tulo- ja koulutustason nousuun. Palveluammattien kasvun ja kannatuksen kasvun korrelaatioksi raportoitiin 0,66 tässä rajatussa tarkastelussa.</p>
    <p>Maaseudulla yhteydet olivat heikompia ja tulotaso nousi esiin. Etelä-Suomessa myös LKP:n väistyminen avasi Kokoomukselle tilaa. Kuntatulos ei osoita yksittäisen työläisen puoluevaihdosta tai veromotiivia.</p>
    <a href={historicalSources.research} target="_blank" rel="noreferrer">Vaalit, puolueet ja yhteiskunnan muutos (1991)</a>
    <h3>Pääpolun mahdollinen poliittinen palaute</h3>
    <p className="ht-hypothesis">Elinkeinorakenteen muutos ⇢ koulutus ja tulot ⇢ muuttuva kannatuspohja ⇢ uuden ohjauspolitiikan valinnat</p>
    <p>Katkonuoli tarkoittaa koeteltavaa selitystä. Keskiluokkaistuminen on mahdollinen osamekanismi. Vaalitulokset eivät osoita koko ketjua eivätkä sitä, että koulutus olisi aiheuttanut veronalennusten, yksityistämisen tai sääntelyn purkamisen kannatuksen.</p>
    <p><b>Seuraava aineistokysymys:</b> kasvoiko kannatus ryhmien sisällä vai kasvoivatko Kokoomusta suosivat ryhmät? Vuosien 1973–1990 haastatteluissa on koulutus-, sosiaaliryhmä-, tulotietoja ja poliittisia asenteita. Muuttujien vertailukelpoisuus ja verokysymysten saatavuus eri vuosille on tarkistettava ennen laskentaa.</p>
    <a href={historicalSources.survey} target="_blank" rel="noreferrer">FSD2276: historiallisen haastatteluaineiston kuvaus</a>
    <PoliticalFeedback />
  </section>;
}
