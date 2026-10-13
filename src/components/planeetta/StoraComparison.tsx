import { useState } from 'react';
import { storaSnapshots, snapshotShare } from './stora-comparison-data';
import './stora-comparison.css';
const fmt = (v:number) => v.toLocaleString('fi-FI',{maximumFractionDigits:1});
export function StoraComparison() {
  const [mode,setMode] = useState<'counts'|'share'>('counts');
  return <section className="sc" aria-labelledby="stora-comparison-title">
    <p className="v-kicker">20 vuoden tarkastelu · Stora Enso 1998 ja 2018</p>
    <h2 id="stora-comparison-title">Missä konsernin työ oli?</h2>
    <p>Kaksi vuosikertomuksen tilannekuvaa. Vuoden 1998 tiedot löytyvät Aallon kirjaston yrityspalvelimelta; vuoden 2018 tiedot yhtiön raportista. Tarkastelu ei rajoitu yhden yritysjärjestelyn ympärille.</p>
    <p className="sc-limit"><b>Määritelmät eroavat:</b> 1998 on vuosikeskiarvo, 2018 vuoden lopun henkilömäärä. Vuoden 2018 taulukko sulkee pois Veracelin ja Montes del Platan yhteistoiminnot. Sarjoja ei ole harmonisoitu, eikä näistä lasketa työpaikkojen nettomenetystä.</p>
    <div className="sc-controls" aria-label="Vertailun näkökulma"><button aria-pressed={mode==='counts'} onClick={()=>setMode('counts')}>Julkaistut henkilömäärät</button><button aria-pressed={mode==='share'} onClick={()=>setMode('share')}>Suomen osuus omassa tilannekuvassa</button></div>
    {storaSnapshots.map(s=><article key={s.year}><h3>{s.year} · {s.basis}</h3>{mode==='counts'?<>
      {[{name:'Suomi',value:s.finland},{name:'Muut maat, laskennallinen erotus',value:s.total-s.finland}].map(row=><div key={row.name}><p>{row.name}: <b>{fmt(row.value)}</b></p><div className="sc-bar" role="img" aria-label={`${s.year}, ${row.name}: ${row.value} henkilöä`}><span style={{width:`${row.value/45000*100}%`}}/></div></div>)}
      <p>Raportoitu kokonaismäärä: <b>{fmt(s.total)}</b>. Yhteinen palkkiasteikko 0–45 000 henkilöä.</p>
    </>:<><p>Suomessa <b>{fmt(snapshotShare(s))} %</b> tämän taulukon henkilömäärästä.</p><div className="sc-bar" role="img" aria-label={`${s.year}: Suomen osuus ${fmt(snapshotShare(s))} prosenttia`}><span style={{width:`${snapshotShare(s)}%`}}/></div><p>Palkkiasteikko 0–100 %. Osuudet ovat omien taulukoiden sisäisiä laskelmia.</p></>}
      <a href={s.source} target="_blank" rel="noreferrer">Vuosikertomus {s.year} · {s.page}</a>
    </article>)}
    <details><summary>Poiminnan ja vertailukelpoisuuden tarkistus</summary><p>1998: Average number of employees by country, Finland 15 601 ja Total 40 679. Raportti esittää yhdistyneen konsernin luvut pooling-menetelmällä; taulukko ei ole yksin Enson lähtöluku.</p><p>2018: Suomen naiset 1 320 ja miehet 5 150, yhteensä noin 6 470. Taulukon kokonaismäärä 25 880. Luvut on pyöristetty lähteessä lähimpään kymmeneen. Sustainability s. 21 ilmoittaa vuoden lopun headcountin sekä siirtymisen FTE-raportoinnista headcountiin. Financials-osan noin 26 100 sisältää puolestaan 50 % yhteistoimintojen henkilöstöstä; sitä ei käytetä tämän maataulukon nimittäjänä.</p><p>Muut maat lasketaan kokonaismäärästä vähentämällä Suomen luku saman taulukon sisällä. Yritysostot, myynnit, ulkoistukset ja toiminnan muutokset voivat muuttaa konsernirajaa 20 vuodessa. Molempien taulukoiden otsikot, luvut ja alaviitteet tarkistettiin sivukuvista 13.10.2026.</p></details>
    <h3>Mitä tämä kertoo pääpolusta?</h3><p>Julkaistuissa tilannekuvissa Suomen henkilöstö ja sen osuus ovat pienemmät vuonna 2018. Myös kokonaismäärä ja muun maailman laskennallinen määrä ovat pienemmät. Tämä tapaus ei osoita konsernin kokonaishenkilöstön kasvua samaan aikaan Suomen henkilöstön vähenemisen kanssa.</p>
    <p>Vertailu avaa kysymyksen Suomen aseman muuttumisesta, mutta ei osoita vastaavien työpaikkojen siirtoa ulkomaille tai valtion omistuksen syyvaikutusta. Seuraava tarkistus tarvitsee harmonisoidun henkilöstömäärän ja välivuosien yritys- ja tuotantotapahtumat. Verot, palkkavirrat, omistus ja investoinnit eivät sisälly tähän poimintaan.</p>
  </section>;
}
