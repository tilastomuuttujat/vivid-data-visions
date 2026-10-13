import { useState } from 'react';
import './ownership-path.css';
export const ownershipEvents = [
  { date: '22.1.2014', year: 2014, lane: 0, title: 'Rautaruukin omistus ennen järjestelyä', text: 'Osakevaihtotarjouksen julkistuksessa Solidium omisti 39,7 % Rautaruukin osakkeista. Tämä on yhden yhtiön omistusosuus, ei henkilöstö- tai investointimittari.', limit: 'Solidium oli valtion kokonaan omistama yhtiö. Vähemmistöosuus ei yksin osoita määräysvaltaa yksittäisessä tehdaspäätöksessä.', url: 'https://www.globenewswire.com/news-release/2014/01/22/603800/0/fi/ssab-ja-rautaruukki-yhdistyv%C3%A4t-ssab-tekee-rautaruukin-hallituksen-suositteleman-osakevaihtotarjouksen-rautaruukin-osakkeenomistajille.html' },
  { date: '29.7.2014', year: 2014.58, lane: 1, title: 'Osakevaihto: uusi yhtiö ja eri äänivalta', text: 'Järjestelyn valmistuttua Solidiumilla oli 17,1 % SSAB:n osakkeista ja 10,1 % äänistä. Valtion omistuskanava jatkui; omistusosuus ja äänivalta ovat eri asioita.', limit: 'Prosentit koskevat eri yhtiöitä ja eri ajankohtia. Niiden erotusta ei nimetä vaikutusvallan menetyksen määräksi.', url: 'https://www.globenewswire.com/news-release/2014/07/29/654217/0/sv/Flaggningsmeddelande-i-SSAB-AB.html' },
  { date: '15.12.2015', year: 2015.95, lane: 2, title: 'Raahessa ilmoitetaan 180 työtehtävän vähennys', text: 'Yhtiön tiedote ilmoitti neuvottelutuloksena 180 työtehtävän vähennyksen. Se liitti järjestelyn yhdistymisestä seuranneeseen tehostamis- ja synergiaohjelmaan sekä tuotannollisiin ja taloudellisiin syihin.', limit: '180 työtehtävää ei tarkoita 180 toteutunutta irtisanomista. Ilmoitus ei osoita tehtävien siirtoa ulkomaille eikä omistajan kantaa ratkaisuun. Toteutustavat ja myöhempi toimeentulo tarvitsevat erillisen seurannan.', url: 'https://www.ssab.com/fi-fi/uutiset/2015/12/ssabn-henkilstvhennyksi-koskevat-neuvottelut-raahessa-pttyneet' },
];
export function OwnershipPath() {
  const [selected, setSelected] = useState(0);
  const event = ownershipEvents[selected]!;
  const lanes = ['Omistus', 'Äänivalta', 'Työ Suomessa'];
  return <section className="op" aria-labelledby="ownership-path-title">
    <p className="v-kicker">Yrityksen kasvu ja Suomeen jäävä hyöty · ensimmäinen lähdepilotti</p>
    <h2 id="ownership-path-title">Omistus muuttui. Mitä tapahtui työlle?</h2>
    <p>Rautaruukki–SSAB ja Raahe 2014–2015. Rinnakkaiset tapahtumat avaavat tutkimuskysymyksen; ne eivät vielä muodosta kasvun, tuotantosiirtojen tai valtion omistuksen syyvaikutuksen aikasarjaa.</p>
    <svg viewBox="0 0 850 340" role="img" aria-label="Omistuksen, äänivallan ja Suomessa olevan työn dokumentoidut tapahtumat 2014–2015. Valitse tapahtuma alla olevista painikkeista.">
      {lanes.map((label,i)=><g key={label}><text x="140" y={75+i*90} textAnchor="end">{label}</text><line x1="170" x2="785" y1={70+i*90} y2={70+i*90} className="op-line"/></g>)}
      {ownershipEvents.map((e,i)=><g key={e.date}><circle cx={200+(e.year-2014)*280} cy={70+e.lane*90} r={selected===i?11:7} className="op-point"/><text x={200+(e.year-2014)*280} y={45+e.lane*90} textAnchor="middle">{e.date}</text></g>)}
      <text x="200" y="315">2014</text><text x="480" y="315">2015</text>
    </svg>
    <p className="op-note">Rivit erottavat havaintolajit. Pisteen koko, rivin korkeus ja viivan pituus eivät mittaa määrää. Tapahtumat on ajoitettu likimääräisesti vuoden sisälle.</p>
    <div className="op-picks">{ownershipEvents.map((e,i)=><button key={e.date} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{e.date}<span>{e.title}</span></button>)}</div>
    <article aria-live="polite"><h3>{event.title}</h3><p>{event.text}</p><p className="op-limit"><b>Näytön raja:</b> {event.limit}</p><a href={event.url} target="_blank" rel="noreferrer">Tarkista tapahtuman lähde</a></article>
    <h3>Mitä seuraavan vertailun pitää näyttää?</h3>
    <div className="op-table"><table><caption>Tutkimuksen kattavuus tässä pilotissa</caption><thead><tr><th scope="col">Seurattava asia</th><th scope="col">Näytön tila</th></tr></thead><tbody>
      <tr><th scope="row">Omistus ja äänivalta</th><td>Kaksi dokumentoitua järjestelyhetken havaintoa, eri yhtiöistä.</td></tr>
      <tr><th scope="row">Suomen henkilöstö</th><td>Raahen ilmoitettu järjestely; ei koko Suomen toteutunutta henkilöstösarjaa.</td></tr>
      <tr><th scope="row">Ulkomainen henkilöstö</th><td>Vertailukelpoinen sarja puuttuu tästä pilotista. Yritysostot on erotettava uusista työpaikoista.</td></tr>
      <tr><th scope="row">Tuotanto ja investointien sijainti</th><td>Sarja puuttuu. Liikevaihto ei yksin mittaa tuotantomäärää tai Suomeen jäävää hyötyä.</td></tr>
      <tr><th scope="row">Verot, palkat ja paikallinen ostovoima</th><td>Ei laskettu. Julkisen talouden kustannusta tai nettovaikutusta ei arvioida.</td></tr>
    </tbody></table></div>
    <p><b>Koeteltava yhteys:</b> vähensikö omistajan vaikutuskanavan muutos Suomen työpaikkojen ja investointien painoa päätöksissä? Vai selittävätkö markkinat, teknologia ja tuotannon uudelleenjärjestelyt tuloksen?</p>
    <p>Yhtiön ilmoittama yhteys synergiaohjelmaan on dokumentoitu perustelu. Se ei yksin erota yhdistymisen vaikutusta muista tekijöistä. Seuraava vaihe tarvitsee samoilla määritelmillä koottuja Suomen ja ulkomaiden henkilöstö- ja investointitietoja.</p>
  </section>;
}
