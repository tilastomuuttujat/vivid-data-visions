import { useId } from 'react';
import { ownershipSnapshots } from './stora-ownership-data';
import { storaSnapshots } from './stora-comparison-data';
import { useLinkedYear, TimelineCoverage } from './timeline-context';
import './stora-ownership.css';
const fmt=(v:number)=>v.toLocaleString('fi-FI',{maximumFractionDigits:1});
export function StoraOwnership(){
 const uid=useId();const [year,setYear]=useLinkedYear(2018,{min:1997,max:2018,observed:ownershipSnapshots.map(s=>s.year)});
 const selected=ownershipSnapshots.find(s=>s.year===year)!;
 return <section className="so" aria-labelledby={`${uid}-title`}>
  <p className="v-kicker">Omistus ja Suomeen jäävä toiminta · Enso–Stora Enso</p><h2 id={`${uid}-title`}>Osakeosuus ja äänivalta kulkivat eri polkuja</h2>
  <TimelineCoverage year={year} label="Omistuksen raporttihavainto"/>
  <p>Valtion ääniosuus putosi alle 50 prosentin jo 1.12.1997, kun A-osakkeita muunnettiin R-osakkeiksi. Vuoden 1998 yhdistyminen pienensi osuutta suuremmassa yhtiössä. Se oli osakevaihtojärjestely: osuuden laimentuminen ei sellaisenaan osoita valtiolle saatua myyntituloa.</p>
  <svg viewBox="0 0 850 360" role="img" aria-label="Omistus- ja ääniosuudet vuoden lopussa 1997, 1998 ja 2018. Asteikko 0–100 prosenttia. Tarkat luvut taulukossa.">
   {[0,50,100].map(v=><g key={v}><line x1={230+v*5} x2={230+v*5} y1="35" y2="295" className="so-grid"/><text x={230+v*5} y="25" textAnchor="middle">{v} %</text></g>)}
   {ownershipSnapshots.map((s,i)=><g key={s.year}><text x="210" y={70+i*90} textAnchor="end">{s.year} · {s.entity}</text><rect x="230" y={45+i*90} width={s.shares*5} height="20" fill="#65d9ec"/><text x={240+s.shares*5} y={60+i*90}>{fmt(s.shares)} %</text><rect x="230" y={70+i*90} width={s.votes*5} height="20" fill="#ffad83"/><text x={240+s.votes*5} y={85+i*90}>{fmt(s.votes)} %</text></g>)}
   <text x="230" y="335" fill="#65d9ec">Turkoosi: osakkeet</text><text x="480" y="335" fill="#ffad83">Oranssi: äänet</text>
  </svg>
  <label htmlFor={`${uid}-year`}>Omistushavainto <select id={`${uid}-year`} value={year} onChange={e=>setYear(Number(e.target.value))}>{ownershipSnapshots.map(s=><option key={s.year}>{s.year}</option>)}</select></label>
  <p><b>{selected.year}: {selected.channel}.</b> Osakkeet {fmt(selected.shares)} %, äänet {fmt(selected.votes)} %. {selected.otherPublic}</p><a href={selected.source}>{selected.location}: tarkista alkuperäinen omistajataulukko</a>
  <p><b>Keskeinen havainto:</b> vuoden 2018 Solidium-osuus on osakkeista pienempi, mutta äänistä suurempi kuin valtion suora osuus vuonna 1998. Pelkkä osakeosuuden lasku ei siis kuvaa vaikutuskanavan muutosta. Yhtiö ja omistuskanava ovat muuttuneet; kaikkia julkisia osuuksia ei yhdistetä yhdeksi ohjaavaksi omistajaksi.</p>
  <h3>Suomen henkilöstön painopiste · 1998 ja 2018</h3><div className="so-table"><table><caption>Raporttihavainnot; määritelmät eroavat</caption><thead><tr><th>Vuosi</th><th>Suomessa</th><th>Konserni</th><th>Suomen osuus</th><th>Mittaus</th></tr></thead><tbody>{storaSnapshots.map(s=><tr key={s.year}><th scope="row">{s.year}</th><td>{fmt(s.finland)}</td><td>{fmt(s.total)}</td><td>{fmt(s.finland/s.total*100)} %</td><td>{s.basis}</td></tr>)}</tbody></table></div>
  <p>Suomen raportoitu henkilöstöosuus laski, mutta havaintojen mittaustavat eroavat. Vuoden 1998 luku on yhdistetyn Storan ja Enson keskimääräinen henkilöstö; vuoden 2018 rajattu vuoden lopun headcount sulkee pois 50 %:n osuuksina käsiteltävät yhteistoiminnot. Erotusta ei tulkita yhdenmukaisesti mitatuksi työpaikkamenetykseksi.</p>
  <h3>Investoinnit: yksi varmennettu sijoittumishavainto</h3><p>Vuonna 1998 Suomeen kohdistui 190,5 miljoonaa euroa konsernin 896,4 miljoonan euron investoinneista. Raportti ilmoitti Suomen osuudeksi 21,2 %. Se totesi investointien sijoittumisen liittyvän olemassa olevan kapasiteetin sijaintiin. Tämä on yhden vuoden havainto, ei 1998–2018 investointitrendi. Vastaavaa vuoden 2018 maakohtaista lukua ei ole tässä vertailussa.</p>
  <details><summary>Päätösten ja lukujen rajat</summary><p>HE 80/1998 arvioi tulevaksi valtion osuudeksi 17,6 % osakkeista ja 21,1 % äänistä. Vuoden lopun raportin toteumahavainnot olivat 18,1 % ja 21,6 %: eri ajankohdan arviota ja raportoitua havaintoa ei yhdistetä samaksi luvuksi. Eduskunnan 17.6.1998 suostumus mahdollisti määrävähemmistöstä luopumisen, eikä ollut itsessään myyntitulo tai tehdaspäätös.</p><p>Äänien enemmistö, yli kolmanneksen osuus ja suurimman yksittäisen omistajan asema ovat eri vaikutuskanavia. Tosiasiallinen määräysvalta edellyttää myös muiden omistajien, sopimusten ja hallinnointirakenteen tarkastelua. Henkilöstön muutosta voivat selittää omistajapolitiikan rinnalla yritysostot, luovutukset, automaatio ja tuotteiden kysyntä.</p><ul><li><a href="https://www.finlex.fi/fi/hallituksen-esitykset/1998/80">HE 80/1998: järjestely, perustelut ja omistuksen alentaminen</a></li>{ownershipSnapshots.map(s=><li key={s.year}><a href={s.source}>Vuosikertomus {s.year}</a> · {s.location}</li>)}<li>Vuoden 1998 investoinnit: vuosikertomuksen painettu s. 15, PDF-sivu 17.</li></ul></details>
 </section>;
}
