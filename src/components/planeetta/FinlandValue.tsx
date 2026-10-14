import { useId, useState } from 'react';
import { valueCompanies, valueSources, storaFinlandTaxes, taxTotals, observedShare, type ValueObservation } from './finland-value-data';
import { ssabSources } from './ssab-comparison-data';
import './finland-value.css';
const fmt=(n:number)=>n.toLocaleString('fi-FI',{maximumFractionDigits:1});
const value=(n:number|null)=>n===null?'Tieto puuttuu':fmt(n);
function Evidence({o,label}:{o:ValueObservation;label:string}){return <tr><th scope="row">{label} · {o.year}</th><td>{value(o.finland)}</td><td>{value(o.total)}</td><td>{o.unit}</td><td>{o.basis} <a href={o.source}>{o.location}</a></td></tr>;}
export function FinlandValue(){
 const uid=useId();const [company,setCompany]=useState('stora');const selected=valueCompanies.find(c=>c.id===company)!;
 const shares=selected.staff.map(o=>observedShare(o));
 return <section className="fv" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Tuotannosta toimeentuloon ja julkisiin tuloihin</p><h2 id={`${uid}-title`}>Mitä Suomeen jää tuotannosta?</h2>
 <p>Työpaikat, palkat, investoinnit, verot ja julkisen omistajan tulot kuvaavat eri vaikutuskanavia. Valitse yhtiö ja vertaa, mistä on mitattu havainto ja missä selitysketju jää avoimeksi.</p>
 <label htmlFor={`${uid}-company`}>Tarkasteltava yhtiö <select id={`${uid}-company`} value={company} onChange={e=>setCompany(e.target.value)}>{valueCompanies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <h3>Suomen osuus henkilöstöstä</h3>
 <svg viewBox="0 0 800 200" role="img" aria-label={`${selected.name}: Suomen henkilöstöosuudet. ${selected.staff.map((o,i)=>`${o.year}: ${shares[i]===null?'tieto puuttuu':fmt(shares[i]!)+' prosenttia'}`).join('; ')}. Mittaustavat taulukossa.`}>
 {[0,25,50,75,100].map(v=><g key={v}><line className="fv-grid" x1={100+v*6} x2={100+v*6} y1="30" y2="165"/><text x={100+v*6} y="20" textAnchor="middle">{v} %</text></g>)}
 {selected.staff.map((o,i)=><g key={o.year}><text x="20" y={68+i*70}>{o.year}</text>{shares[i]===null?<text x="110" y={68+i*70}>Maajako puuttuu — ei nollaa eikä laskettua osuutta</text>:<><rect x="100" y={45+i*70} width={shares[i]!*6} height="32" fill="#65d9ec"/><text x={110+shares[i]!*6} y={68+i*70}>{fmt(shares[i]!)} %</text></>}</g>)}
 </svg>
 <p>{company==='stora'?'Vuoden 1998 keskimääräinen henkilöstö ja vuoden 2018 rajattu vuoden lopun headcount eroavat määritelmältään. Osuudet ovat raporttihavaintoja; erotusta ei esitetä täsmällisenä työpaikkasiirtona.':'Vuoden 2013 konserniluku sisältää molemmat yhtiöt. Suomen yhteisluku puuttuu, joten osuuden muutoksen suuntaa ei päätellä vuoden 2024 havainnosta.'}</p>
 <div className="fv-table"><table><caption>{selected.name}: henkilöstö ja rahavirrat eri ajankohdilta</caption><thead><tr><th>Kanava ja vuosi</th><th>Suomi / julkinen vastaanottaja</th><th>Koko konserni</th><th>Yksikkö</th><th>Mitä mitataan ja lähde</th></tr></thead><tbody>
 {selected.staff.map(o=><Evidence key={o.year} o={o} label="Henkilöstö"/>)}<Evidence o={selected.pay} label="Palkat"/><Evidence o={selected.investment} label="Investoinnit"/><Evidence o={selected.dividend} label="Maksetut osingot"/><Evidence o={selected.sale} label="Osakemyynti / siirto"/>
 </tbody></table></div>
 <p><b>Julkiselle omistajalle maksettu osinko: tieto puuttuu.</b> {selected.publicDividendNote}</p>
 <p><b>Investointien ajoitus:</b> {selected.investmentEvent} <a href={company==='stora'?valueSources.storaInvestment:ssabSources.investment}>Tarkista päätöksen lähde</a>.</p>
 <p><b>Myyntitulon vastaanottaja ja luonne:</b> {selected.saleNote} {company==='stora'&&<a href={valueSources.solidiumReport}>Solidiumin katsaus 1.1.–30.6.2018</a>}</p>
 {company==='stora'?<>
 <h3>Yhteisövero on vain yksi osa verojalanjälkeä</h3><p>Suomen verot ja veronluonteiset maksut, milj. EUR. Sama asteikko molemmille vuosille; yhtiön oma osuus ja muiden puolesta tilitetty osuus erotetaan.</p>
 <svg viewBox="0 0 800 230" role="img" aria-label="Stora Enson Suomen verojalanjälki 2017: omat maksut 103, tilitetyt 246, yhteensä 349 miljoonaa euroa. 2018: omat 104, tilitetyt 256, yhteensä 360. Yhteisövero 0 ja 1 miljoonaa euroa. Tarkka erittely taulukossa.">
 {[0,100,200,300,400].map(n=><g key={n}><line className="fv-grid" x1={100+n*1.45} x2={100+n*1.45} y1="30" y2="160"/><text x={100+n*1.45} y="20" textAnchor="middle">{n}</text></g>)}
 {storaFinlandTaxes.map((t,i)=>{const totals=taxTotals(t);return <g key={t.year}><text x="20" y={68+i*70}>{t.year}</text><rect x="100" y={45+i*70} width={totals.own*1.45} height="32" fill="#65d9ec"/><rect x={100+totals.own*1.45} y={45+i*70} width={totals.collected*1.45} height="32" fill="#ffad83"/><text x={110+totals.total*1.45} y={68+i*70}>{totals.total}</text></g>;})}
 <text x="100" y="200">Turkoosi: yhtiön omat maksut</text><text x="420" y="200">Oranssi: muiden puolesta tilitetyt</text>
 </svg>
 <div className="fv-table"><table><caption>Raportin Suomen verojalanjälki · milj. EUR</caption><thead><tr><th>Maksu</th>{storaFinlandTaxes.map(t=><th key={t.year}>{t.year}</th>)}</tr></thead><tbody>
 {([{key:'income',label:'Oma: yhteisövero'},{key:'employment',label:'Oma: työhön liittyvät maksut'},{key:'operational',label:'Oma: toimintaan liittyvät maksut'},{key:'vat',label:'Tilitetty: ALV ja vastaavat'},{key:'payroll',label:'Tilitetty: palkkoihin liittyvät verot'},{key:'other',label:'Tilitetty: muut'}] as const).map(r=><tr key={r.key}><th scope="row">{r.label}</th>{storaFinlandTaxes.map(t=><td key={t.year}>{t[r.key]}</td>)}</tr>)}
 <tr><th scope="row">Omat + tilitetyt yhteensä</th>{storaFinlandTaxes.map(t=><td key={t.year}>{taxTotals(t).total}</td>)}</tr>
 </tbody></table></div>
 <p>Vuoden 2018 yhteisövero oli 1 milj. EUR, mutta koko raportoitu verojalanjälki 360 milj. EUR. Yhtiö selitti vähäistä yhteisöveroa aiempien vuosien tappioilla, joihin liittyi muun muassa sulkemis- ja rakennejärjestelykuluja. Muiden puolesta tilitetyt verot eivät ole yhtiön oma verorasitus. <a href={valueSources.storaFinancials}>Financials s. 86–87: määritelmät ja maataulukko</a>.</p>
 </>:<p><b>Suomen verojalanjälki: tieto puuttuu tästä aineistosta.</b> Konsernin tuloverokulua ei sijoiteta Suomeen eikä verovelkaa käsitellä maksettuna verona.</p>}
 <details><summary>Mitä tästä voi päätellä?</summary><p>Henkilöstön supistuminen voi pienentää palkkoihin kytkeytyvää tulovirtaa, mutta sen määrää ei mitata henkilömäärällä. Tuottavuus, palkkataso, alihankinta ja uudet investoinnit voivat muuttaa kokonaisuutta. Konsernin kasvu ja Suomen toiminnan supistuminen täytyy osoittaa samalla rajauksella; tässä olevat yksittäiset havainnot eivät vielä osoita tällaista pitkää trendiä.</p><p>Palkat, investoinnit, verot, osingot ja osakemyynnit eivät ole yhteenlaskettava Suomen hyötysumma. Palkkaverot sisältyvät palkkojen kautta kulkevaan ketjuun; investointi on tuotantopäätös, osakekauppa omistusvarallisuuden vaihto. Verot ja veronluonteiset maksut eivät ole kaikki valtion budjettituloa, ja verojalanjälki ei ole julkisten tukien jälkeinen nettovaikutus.</p><p>Stora Enson verojalanjäljen rajaus sisältää konserniyhtiöt ja vähintään 50-prosenttiset yhteistoiminnot suhteellisesti, kun työntekijöitä on vähintään 10 tai liikevaihto vähintään 5 milj. EUR. Rajaus eroaa henkilöstötaulukosta. Maakohtaiset palkat, toteutuneet investoinnit, julkiselle omistajalle saadut osingot ja yritysjärjestelyillä oikaistu aikasarja tarvitaan ennen omistuksen muutoksen vaikutuksen arviointia. Puuttuva tieto säilyy aukoksi merkittynä.</p></details>
 </section>;
}
