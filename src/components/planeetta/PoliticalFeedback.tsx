import { useId, useState } from 'react';
import { historicalSources } from './historical-election-data';
import './political-feedback.css';

const mechanisms = [
  { title: 'Vaurastuminen ja kannatus', status: 'Tutkimuksen tukema yhteys', body: 'Vuosien 1962–1983 kuntatutkimus yhdistää Kokoomuksen kasvun Etelä-Suomen keskuksissa palveluammattien, tulojen ja koulutuksen kasvuun. Keskiluokan ei tarvitse olla yhtenäinen: riittää, että kannatuspohjan muutos vahvistaa puolueen asemaa. Alueellinen yhteys ei yksin paljasta äänestäjän veromotiivia.' },
  { title: 'Kannatus ja päätösvalta', status: 'Tutkittava poliittinen mekanismi', body: 'Vaalivoiman kasvu voi vahvistaa veronkevennyksiä ja markkinoiden roolia suosivan politiikan asemaa. Vaikutus riippuu hallituskoalitioista ja päätöksistä. Kokoomus on puolue, EK työnantajajärjestö: tavoitteiden yhtäläisyys on osoitettava päätöskohtaisesti. Nykyisen EK:n nimeä ei pidä siirtää sellaisenaan 1980-luvulle.' },
  { title: 'Omistus ja Suomen painopiste', status: 'Tutkittava syy-yhteys', body: 'Valtion omistuksen ja määräysvallan vähentyminen voi heikentää mahdollisuutta ohjata investointien ja työpaikkojen sijaintia. Suomen henkilöstöosuuden lasku on painopisteen muutos myös silloin, kun ulkomainen henkilöstö vähenee. Osuus, kotimainen henkilömäärä ja investoinnit on silti erotettava. Norja osittain yksityisti Statoilin vuonna 2001 mutta säilytti määräysvallan; omistuksesta luopumisen laajuus oli valinta.' },
  { title: 'Työ, verotus ja riskien jako', status: 'Päätöksiä ja tutkittava kokonaisvaikutus', body: 'Vuoden 2026 budjettiesityksessä menosäästöt ja veronkevennykset esiintyvät rinnakkain. Säästön koko hyöty ei silloin välttämättä vähennä alijäämää. Työn halpuuttamista pitää tutkia palkkaosuuden, reaalipalkkojen, työehtojen ja neuvotteluvoiman avulla. Velka siirtää rahoituspainetta tulevaisuuteen, mutta myös suhdanteet ja menotarpeet vaikuttavat siihen.' },
];
export function PoliticalFeedback() {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const detail = mechanisms[selected]!;
  return <section className="pf" aria-labelledby={`${uid}-title`}>
    <h3 id={`${uid}-title`}>Yhteinen vaurastuminen, muuttuva valta</h3>
    <p>Voiko yhteisesti rakennettu vaurastuminen vahvistaa politiikkaa, joka jakaa turvaa, tuottoja ja päätösvaltaa uudella tavalla? Valitse kuvasta yhteys ja tarkastele sen näyttöä.</p>
    <p className="pf-legend">Yhtenäinen viiva: tutkimuksen tukema yhteys. Katkoviiva: tutkittava mekanismi. Kuvan sijainnit ja viivojen paksuus eivät kuvaa mitattua vaikutusta.</p>
    <svg viewBox="0 0 800 430" role="img" aria-label="Vaurastumisen poliittinen palaute ja hyötyjen sekä riskien eriytyminen">
      <path d="M100 110 Q200 25 300 110" className="pf-supported" />
      <path d="M300 110 Q400 25 500 110 M500 110 Q700 130 640 260 M640 260 Q400 400 180 260 M180 260 Q40 210 100 110" className="pf-proposed" />
      <text x="185" y="55">kannatuspohja →</text><text x="375" y="55">politiikka →</text>
      <text x="505" y="190">tuotot ja valta ↓</text><text x="280" y="345">riskit ja rahoituspaine ←</text>
      {[[100,110,'Koulutus ja tulot'],[300,110,'Kokoomuksen asema'],[500,110,'Omistus ja verotus'],[640,260,'Omistajat ja vahva työ'],[180,260,'Haavoittuva työ ja alueet']].map(([x,y,label]) => <g key={label} transform={`translate(${x},${y})`}><circle r="16" /><text y="39" textAnchor="middle">{label}</text></g>)}
      <text x="390" y="225" textAnchor="middle">Kuka hyötyy — kuka kantaa riskin?</text>
    </svg>
    <div className="pf-controls" aria-label="Tarkasteltava yhteys">{mechanisms.map((m,i) => <button type="button" key={m.title} aria-pressed={selected === i} aria-controls={`${uid}-detail`} onClick={() => setSelected(i)}>{m.title}</button>)}</div>
    <div id={`${uid}-detail`} className="pf-detail" aria-live="polite"><strong>{detail.status}: {detail.title}</strong><p>{detail.body}</p></div>
    <p><b>Eriarvoisuus näkyy usealla tasolla:</b> omistuksessa ja tuotoissa, työehdoissa, alueiden elinvoimassa sekä mahdollisuudessa saada palveluja. Koko ketju on selitysmalli, ei todistettu yhtenäinen syy-seuraussarja.</p>
    <details><summary>Lähteet ja seuraava koettelu</summary><ul>
      <li><a href={historicalSources.research}>Martikainen ja Yrjönen 1991, s. 80–81: kannatus ja rakennemuutos</a></li>
      <li><a href="https://www.doria.fi/handle/10024/148691">VATT: Valtionyhtiöt 1975–2008 — omistajapolitiikan tausta</a></li>
      <li><a href="https://www.regjeringen.no/no/dokumenter/Stmeld-nr-38-2003-2004-/id404848/?ch=4">Norjan hallitus: Statoilin osittainen yksityistäminen 2001</a></li>
      <li><a href="https://www.regjeringen.no/no/dokumenter/prop.-84-s-20152016/id2480589/?ch=2">Norjan hallitus: 67 prosentin omistuslinja</a></li>
      <li><a href="https://budjetti.vm.fi/sisalto.jsp?lang=fi&maindoc=%2F2026%2Ftae%2FhallituksenEsitys%2FhallituksenEsitys.xml&opennode=0%3A1%3A3%3A13%3A&year=2026">VM: vuoden 2026 budjettiesitys — säästöt ja veronkevennykset</a></li>
    </ul><p>Yhdistä yhtiökohtaisesti omistus ja määräysvalta, Suomen henkilöstö- ja investointiosuus sekä sulkemiset ja yritysostot. Vertaa päätösten perusteluja ja tulonjakovaikutuksia. Norjan paikallaan pysyvä öljyvaranto rajoittaa vertailua siirrettävään teolliseen tuotantoon.</p></details>
  </section>;
}
