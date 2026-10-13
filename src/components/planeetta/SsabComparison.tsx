import { useId } from 'react';
import { combinedBaselineTotal as total, ssabComparison as data, ssabSources as sources } from './ssab-comparison-data';
import './ssab-comparison.css';
const fmt=(n:number)=>n.toLocaleString('fi-FI',{maximumFractionDigits:1});
export function SsabComparison(){
 const id=useId();const later=data.later;
 return <section className="ssab-comparison" aria-labelledby={`${id}-title`}>
 <p className="v-kicker">Omistus ja toiminnan sijainti · Rautaruukki–SSAB</p>
 <h2 id={`${id}-title`}>Mitä muuttui yhdistymisen jälkeen?</h2>
 <p>Vuoden 2013 lähtötilanne sisältää sekä SSAB:n että Rautaruukin. Näin vuoden 2014 yhdistyminen ei yksin näytä henkilöstön kasvulta ulkomailla. Pylväät kuvaavat vuoden lopun raporttihavaintoja, eivät samoina säilyneiden tehtaiden työpaikkasarjaa.</p>
 <svg viewBox="0 0 900 230" role="img" aria-label="Vuonna 2013 SSAB ja Rautaruukki yhteensä 17 312 työntekijää; vuonna 2024 SSAB 15 263. Suomen vuoden 2013 yhteisluku puuttuu. Tarkat tiedot taulukossa.">
 {[{year:2013,total,known:data.baseline.ruukkiFinland},{year:2024,total:later.total,known:later.finland}].map((s,i)=><g key={s.year}>
 <text x="20" y={50+i*80}>{s.year}</text><rect x="100" y={25+i*80} width={s.total/total*650} height="35" fill={i===0?'#727f8d':'#ffad83'}/><rect x="100" y={25+i*80} width={s.known/total*650} height="35" fill="#65d9ec"/><text x={110+s.total/total*650} y={50+i*80}>{fmt(s.total)}</text>
 </g>)}
 <text x="100" y="190">Turkoosi: 2013 vain Ruukin Suomi; 2024 koko SSAB:n Suomi</text>
 <text x="100" y="215">Harmaa: maajako selvittämättä · Oranssi: muu maailma 2024</text>
 </svg>
 <div className="ssab-table"><table><caption>Vuoden lopun henkilöstö; konsernirakenne on muuttunut</caption><thead><tr><th>Havainto</th><th>Konserni</th><th>Suomessa</th><th>Muualla</th><th>Suomen osuus</th></tr></thead><tbody>
 <tr><th scope="row">Rautaruukki 2013</th><td>8 600</td><td>5 218</td><td>3 382</td><td>60,7 %</td></tr>
 <tr><th scope="row">SSAB 2013</th><td>8 712</td><td>Puuttuu</td><td>Puuttuu</td><td>Puuttuu</td></tr>
 <tr><th scope="row">Yhteinen lähtötilanne 2013</th><td>{fmt(total)}</td><td>Vähintään 5 218</td><td>Ei laskettavissa tarkasti</td><td>Ei laskettavissa tarkasti</td></tr>
 <tr><th scope="row">SSAB 2024</th><td>{fmt(later.total)}</td><td>{fmt(later.finland)}</td><td>{fmt(later.total-later.finland)}</td><td>{fmt(later.finland/later.total*100)} %</td></tr>
 </tbody></table></div>
 <p><b>Mitä luvut osoittavat?</b> Konsernien yhteenlaskettu henkilöstö 2013 oli suurempi kuin SSAB:n henkilöstö 2024. Vuoden 2024 Suomen luku on myös pienempi kuin pelkän Rautaruukin Suomen luku 2013. Suomen osuuden muutoksen suuntaa ja ulkomaisen henkilöstön kasvua ei kuitenkaan ratkaista ilman SSAB:n vuoden 2013 maajakoa. Erotus ei osoita työpaikkojen siirtoa: yritysmyynnit, yritysostot ja toiminnan muutokset vaikuttavat rajaukseen.</p>
 <h3>Omistuksen kanava jatkui</h3><p>Solidiumin kaikki SSAB-osakkeet päätettiin siirtää Suomen valtiolle pääoman palautuksena 14.9.2021. Vuoden 2024 lopussa Suomen valtio omisti {fmt(later.stateShares)} % osakkeista ja {fmt(later.stateVotes)} % äänistä. Solidiumin poistuminen omistajaluettelosta ei siis tarkoita julkisen omistuksen loppumista.</p>
 <h3>Investointien järjestys: päätös Ruotsiin, suunnitelma Suomeen</h3><p>SSAB päätti 2.4.2024 Luulajan uudesta terästehtaasta, jonka investointiarvio oli 4,5 miljardia euroa. Raahen muutos oli seuraava suunniteltu vaihe, ei samana päivänä tehty vastaava investointipäätös. Yhtiö perusteli järjestystä taloudellisilla syillä sekä Raahen uudenaikaisemmalla ja paremmassa kunnossa olevalla laitteistolla. Tämä kertoo päätösten ajoituksesta; se ei mittaa kaikkia Suomen investointeja eikä osoita omistuksen muutosta syyksi.</p>
 <details><summary>Lähteet ja vertailun rajat</summary><p>SSAB:n 2013 Suomen luku 111 on normaalien vuosityötuntien perusteella laskettu keskimäärä, ei vuoden lopun henkilömäärä. Sitä ei lisätä Rautaruukin lukuun 5 218. Vuonna 2024 mukana ovat vakituiset ja määräaikaiset työntekijät vuoden lopussa. Jatkotutkimuksessa tarvitaan vuoden 2013 SSAB:n maajako sekä yritysostojen ja luovutusten erittely.</p><ul>
 <li><a href={sources.ssab2013}>SSAB vuosikertomus 2013</a>: henkilöstö vuoden lopussa s. 38; keskimääräinen henkilöstö, liitetieto 19.</li>
 <li><a href={sources.ruukki2013}>Rautaruukki tilinpäätöstiedote 2013</a>: Personnel by region, PDF-sivu 12.</li>
 <li><a href={sources.ssab2024}>SSAB vuosikertomus 2024</a>: omistus s. 15; henkilöstön määritelmä ja luvut s. 108–109.</li>
 <li><a href={sources.transfer}>Solidium: pääoman palautuspäätös 2021</a></li>
 <li><a href={sources.investment}>SSAB: Luulajan investointipäätös 2.4.2024</a></li>
 </ul></details>
 </section>;
}
