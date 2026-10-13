import { useState } from 'react';
import { electionEvidence as data, participationGap } from './election-evidence';
import './election-evidence.css';

const fmt = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });
export function ElectionEvidence() {
  const [showAbsent, setShowAbsent] = useState(true);
  return <section className="ee" aria-labelledby="election-evidence-title">
    <p className="v-kicker">Vaalit · havainto ja tulkinta</p>
    <h2 id="election-evidence-title">Ketkä ovat mukana päätösvallassa?</h2>
    <p>Toimeentulon muutos voi liittyä sekä puoluevalintaan että osallistumiseen. Näitä yhteyksiä tarkastellaan erikseen.</p>
    <h3>Yhtä suuri äänioikeutettujen joukko, eri määrä ääniä</h3>
    <p>Vuoden 2023 eduskuntavaalit: tuloryhmien osallistuminen sähköisen äänioikeusrekisterin alueilla.</p>
    <label className="ee-toggle"><input type="checkbox" checked={showAbsent} onChange={e => setShowAbsent(e.target.checked)} />Näytä myös äänestämättä jäänyt osuus</label>
    <div className="ee-bars">{data.income.map(row => <div key={row.label}>
      <div className="ee-rowlabel"><b>{row.label}</b><span>{fmt(row.turnout)} % äänesti</span></div>
      <div className="ee-bar" role="img" aria-label={`${row.label}: ${fmt(row.turnout)} prosenttia äänesti, ${fmt(100 - row.turnout)} prosenttia ei äänestänyt.`}>
        <span className="ee-voted" style={{ width: `${row.turnout}%` }} />
        <span className={`ee-absent ${showAbsent ? '' : 'hidden'}`} style={{ width: `${100 - row.turnout}%` }} />
      </div>
    </div>)}</div>
    <div className="ee-scale" aria-hidden="true"><span>0 %</span><span>50 %</span><span>100 %</span></div>
    <p className="ee-legend"><i /> Äänesti {showAbsent && <><i className="absent" /> Ei äänestänyt</>}</p>
    <p className="ee-finding"><strong>{fmt(participationGap())} prosenttiyksikön ero.</strong> Sama muodollinen äänioikeus ei tarkoita samaa osallistumisastetta.</p>
    <details><summary>Mitä luvut kattavat?</summary><p>Kaiken äänestämisen sisältävä aineisto kattaa {fmt(data.coverage)} % Suomessa asuvista äänioikeutetuista. Alueet eivät jakaudu tasaisesti koko maahan. Tulot ovat vuoden 2021 käytettävissä olevia rahatuloja. Palkki on prosenttiasteikko, ei ryhmän koko tai eduskuntapaikkojen määrä. Aineisto ei kerro, mitä puoluetta henkilö äänesti.</p><a href={data.source} target="_blank" rel="noreferrer">Tilastokeskus: äänestäneiden tausta-analyysi 2023</a></details>
    <h3>Koulutus ja osallistuminen</h3>
    <p>Samassa aineistossa ylemmän korkeakoulututkinnon tai tutkijakoulutuksen suorittaneiden äänestysaktiivisuus oli <b>{fmt(data.educationGap)} prosenttiyksikköä</b> pelkän perusasteen suorittaneita korkeampi. Tämä on ryhmäero, ei koulutuksen erillinen syyvaikutus.</p>
    <h3>Rakennemuutos ja puoluekannatus: historiallinen havainto</h3>
    <p>Martikaisen ja Yrjösen tutkimuksessa (Tilastokeskus, 1991, painetut s. 80–81) Kokoomuksen kasvu Etelä-Suomen keskuksissa liittyi palveluammattien lisääntymiseen, väestönkasvuun sekä tulo- ja koulutustason nousuun. Palveluammattien kasvun ja kannatuksen kasvun korrelaatioksi raportoitiin 0,66 tässä rajatussa kuntatarkastelussa. Maaseudulla yhteydet olivat heikompia; myös LKP:n väistyminen nousi selitykseksi.</p>
    <p>Kunnan muutos ei osoita yksittäisen ihmisen puoluevaihdosta, veromotiivia tai peruskoulu-uudistuksen vaikutusta. Historiallista havaintoa ja vuoden 2023 ryhmäeroja ei yhdistetä yhdeksi aikasarjaksi.</p>
    <a href={data.historicalSource} target="_blank" rel="noreferrer">Vaalit, puolueet ja yhteiskunnan muutos (1991)</a>
    <h3>Koeteltava yhteys pääpolkuun</h3>
    <p className="ee-hypothesis">Tuotannon muutos ⇢ toimeentulon ja koulutuksen asemat ⇢ osallistuminen ja puoluevalinta ⇢ seuraavan muutoksen päätökset</p>
    <p>Katkonainen nuoli tarkoittaa tutkimuskysymystä. Näillä havainnoilla ei osoiteta koko ketjun syy-yhteyttä eikä sukupolvisykliä.</p>
    <p><b>Oma tulkinta:</b> johtuuko poliittinen muutos ryhmien kokojen muuttumisesta, osallistumisen eroista vai ryhmien sisäisistä kannatuksen muutoksista? Mitä aineistoa tarvitaan niiden erottamiseen?</p>
  </section>;
}
