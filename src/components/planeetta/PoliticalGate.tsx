import { useId } from 'react';
import { useLinkedYear, TimelineCoverage } from './timeline-context';
import { gateElectionResults, gateSources, politicalGateRecords } from './political-gate-data';
import { historicalSources } from './historical-election-data';
import './political-gate.css';
const fmt=(n:number)=>n.toLocaleString('fi-FI',{maximumFractionDigits:1});
const observed=[1979,1981,1982,1983,1987];
const x=(year:number)=>100+(year-1979)/8*620;
const y=(share:number)=>230-share/30*180;
export function PoliticalGate(){
 const uid=useId();const [year,setYear]=useLinkedYear(1987,{min:1979,max:1987,observed});
 const record=politicalGateRecords.find(r=>r.year===year);
 const election=gateElectionResults.find(r=>r.year===year);
 return <section className="pg" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Poliittisen suunnanmuutoksen edellytykset · 1979–1987</p><h2 id={`${uid}-title`}>Kannatuksesta päätösvallaksi</h2>
 <p>Kokoomuksen kannatus oli kasvanut ennen hallitusasemaa. Presidentin vallankäyttö ja hallitusyhteistyön rajat vaikuttivat siihen, miten kannatus saattoi muuttua päätösvallaksi. Vuoden 1981 kiista ja vuoden 1987 ratkaisu näyttävät tämän mekanismin eri vaiheita.</p>
 <TimelineCoverage year={year} label="Poliittinen tapahtuma tai vaalihavainto"/>
 <svg viewBox="0 0 840 420" role="img" aria-label="Kokoomuksen vaalikannatus 1979 21,7 %, 1983 22,1 %, 1987 23,1 %. Puolue oli oppositiossa ennen Holkerin hallituksen aloitusta 30.4.1987. Vuoden 1981 valtakiista sijoittuu vaalien väliin. Hallitusaseman rivi on luokittelu, ei prosenttisarja.">
 {[0,10,20,30].map(n=><g key={n}><line x1="100" x2="720" y1={y(n)} y2={y(n)} className="pg-grid"/><text x="85" y={y(n)+5} textAnchor="end">{n} %</text></g>)}
 <text x="100" y="28">Kokoomuksen ääniosuus · vain vaalivuosien havainnot</text>
 <line x1={x(year)} x2={x(year)} y1="40" y2="355" className="pg-cursor"/>
 <polyline points={gateElectionResults.map(r=>`${x(r.year)},${y(r.kok)}`).join(' ')} fill="none" stroke="#65d9ec" strokeWidth="3"/>
 {gateElectionResults.map(r=><g key={r.year}><circle cx={x(r.year)} cy={y(r.kok)} r="6" fill="#65d9ec"/><text x={x(r.year)} y={y(r.kok)-13} textAnchor="middle">{fmt(r.kok)} %</text><text x={x(r.year)} y="253" textAnchor="middle">{r.year}</text></g>)}
 <text x="100" y="289">Hallitusasema · ei numeerista asteikkoa</text>
 <line x1="100" x2="720" y1="314" y2="314" stroke="#9aa6b6" strokeWidth="14"/>
 <circle cx="720" cy="314" r="11" fill="#ffad83"/><text x="310" y="344" textAnchor="middle">Oppositiossa</text><text x="720" y="344" textAnchor="middle">Hallitus 30.4.1987</text>
 <line x1={x(1981)} x2={x(1981)} y1="362" y2="375" stroke="#d5a4f1" strokeWidth="2"/><text x={x(1981)} y="395" textAnchor="middle">1981: erovaatimus torjutaan</text>
 </svg>
 <p>Vaalipisteitä yhdistävä viiva ei mittaa kannatusta vaalien välillä. Vuoden 1987 piste kuvaa vaalitulosta, ja hallituksen alku ajoitetaan erikseen huhtikuulle. Kannatuksen kasvu ei yksin määrännyt hallitusasemaa.</p>
 <div className="pg-table"><table><caption>Vaalikannatus ja Kokoomuksen hallitusasema</caption><thead><tr><th>Vaalivuosi</th><th>Kokoomus</th><th>SDP</th><th>Keskusta</th><th>Kokoomuksen asema</th></tr></thead><tbody>{gateElectionResults.map(r=><tr key={r.year}><th scope="row">{r.year}</th><td>{fmt(r.kok)} %</td><td>{fmt(r.sdp)} %</td><td>{fmt(r.kesk)} %</td><td>{r.year===1987?'Hallitukseen 30.4.1987':'Oppositiossa'}</td></tr>)}</tbody></table></div>
 <p><a href={historicalSources.results}>Tilastokeskus: vaalitulokset</a> · <a href={gateSources.coalition}>Yle: oppositiokauden päättyminen ja hallitusratkaisu</a></p>
 <label htmlFor={`${uid}-year`}>Valitse vaihe <select id={`${uid}-year`} value={year} onChange={e=>setYear(Number(e.target.value))}>{observed.map(v=><option key={v}>{v}</option>)}</select></label>
 <article className="pg-detail" aria-live="polite"><h3>{record?`${record.date}: ${record.title}`:`${year}: kannatus kasvaa, hallitusasema ei vielä muutu`}</h3>
 {record?<><p><b>Tapahtuma:</b> {record.change}</p><p><b>Toimijat:</b> {record.actors}</p><p><b>Tulkinta:</b> {record.assessment}</p><p><b>Rajaus:</b> {record.limit}</p>{record.sources.map(s=><p key={s.url}><a href={s.url}>{s.title}</a> · {s.location}</p>)}</>:<><p>Kokoomus sai {fmt(election!.kok)} % äänistä mutta jatkoi oppositiossa. Vaalitulos ei kerro yksittäisten äänestäjien veromotiiveja.</p>{year===1979&&<p>Koiviston toinen hallitus aloitti 26.5.1979. <a href={gateSources.start}>Valtioneuvosto: Koivisto II</a>.</p>}<p><a href={historicalSources.results}>Vaalituloksen lähde</a></p></>}
 </article>
 <h3>Presidentin vaikutusvalta ei päättynyt vuonna 1981</h3><p>Koivisto vaikutti myös vuoden 1987 hallituksen muodostamiseen. Parlamentaarisen toimintaperustan vahvistuminen ja presidentin käytännön ohjausvalta saattoivat esiintyä rinnakkain. Poliittisen portin avautuminen on tässä tulkinta päätöksenteon mahdollisuuksista, ei väite yhdestä hetkestä, jolloin kaikki valta vaihtoi paikkaa.</p>
 <details><summary>Yhteys talouspolitiikan myöhempään muutokseen</summary><p>Kannatus antaa puolueelle edustusta; hallitusyhteistyö antaa mahdollisuuden valmistella ja toteuttaa ohjelmaa. Vuoden 1987 sinipuna yhdisti Kokoomuksen ja SDP:n, joten myöhempiä ratkaisuja ei käsitellä yhden puolueen yksin tekemänä politiikkana. Omistus-, vero- ja työmarkkinapäätökset on osoitettava omilla lähteillään ja ajoitettava erikseen.</p><p>Rahoitusmarkkinoiden vapautuminen oli rinnakkainen kehityskulku. Sitä ei kuvata vuoden 1981 valtakiistan automaattisena seurauksena. <a href={gateSources.finance}>Suomen Pankki: Säännöstelystä markkinoille</a> tarkastelee raha- ja valuuttasääntelyn muutosta 1970–1980-luvuilla.</p></details>
 </section>;
}
