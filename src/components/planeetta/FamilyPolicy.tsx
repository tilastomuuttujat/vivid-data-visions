import { useId, useState } from 'react';
import { useLinkedYear, TimelineCoverage } from './timeline-context';
import { cabinets, cabinetsInYear, familyPolicyEvents, fertility, fluxSources } from './family-policy-data';
import { FamilyPolicyDetails } from './FamilyPolicyDetails';
import './family-policy.css';
const fmt=(n:number)=>n.toLocaleString('fi-FI',{minimumFractionDigits:2,maximumFractionDigits:2});
const x=(year:number)=>80+(year-2010)/16*780;
const y=(v:number)=>240-v/2.2*190;
const dateYear=(s:string)=>{const d=new Date(`${s}T00:00:00Z`),year=d.getUTCFullYear();return year+(d.getTime()-Date.UTC(year,0,1))/(Date.UTC(year+1,0,1)-Date.UTC(year,0,1));};
export function FamilyPolicy(){
 const uid=useId();const [year,setYear]=useLinkedYear(2019,{min:2010,max:2025});const [eventId,setEventId]=useState<string|null>(null);
 const annual=fertility.points.find(p=>p.year===year)!;
 const events=familyPolicyEvents.filter(e=>e.year===year);const selected=events.find(e=>e.id===eventId)??events[0];
 return <section className="fp" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Perheen perustaminen, hallitusvastuu ja työvoima · 2010–2025</p><h2 id={`${uid}-title`}>Millaiset päätökset tukivat tulevaa sukupolvea?</h2>
 <p>Syntyvyyden lasku ajoittuu useiden hallitusten kausille. Kokoomuksen hallitusvastuu, vuosien 2019–2023 oppositiojakso ja paluu pääministeripuolueeksi erotetaan. Päätökset, puheet ja tutkimustulokset ovat eri näyttölajeja.</p>
 <TimelineCoverage year={year} label="Syntyvyyden vuosisarja"/>
 <div className="fp-chart"><svg viewBox="0 0 960 430" role="img" aria-label="Suomen kokonaishedelmällisyysluku vuosittain 2010–2025 ja hallituskaudet. Kokoomus oli oppositiossa Rinteen ja Marinin hallituksissa 2019–2023. Vuoden 2025 luku 1,30. Tarkat luvut ja kaudet taulukoissa.">
 {[0,1,1.5,2].map(v=><g key={v}><line x1="80" x2="860" y1={y(v)} y2={y(v)} className="fp-grid"/><text x="65" y={y(v)+4} textAnchor="end">{fmt(v)}</text></g>)}
 <text x="80" y="25">Kokonaishedelmällisyysluku · laskennallinen lapsimäärä</text>
 <line x1={x(year+.5)} x2={x(year+.5)} y1="40" y2="355" className="fp-cursor"/>
 <polyline points={fertility.points.map(p=>`${x(p.year+.5)},${y(p.tfr)}`).join(' ')} fill="none" stroke="#65d9ec" strokeWidth="3"/>
 {fertility.points.map(p=><circle key={p.year} cx={x(p.year+.5)} cy={y(p.tfr)} r={p.year===year?6:3} fill="#65d9ec"><title>{p.year}: {fmt(p.tfr)}</title></circle>)}
 {[2010,2015,2020,2025].map(v=><text key={v} x={x(v+.5)} y="262" textAnchor="middle">{v}</text>)}
 <text x="80" y="293">Kokoomuksen asema · hallituskausien rajat päivämääristä</text>
 {cabinets.map(c=>{const start=Math.max(2010,dateYear(c.start)),end=c.end?Math.min(2026,dateYear(c.end)):2026;return <g key={c.id}><rect x={x(start)} y="310" width={x(end)-x(start)} height="28" fill={c.kok==='Oppositiossa'?'#d5a4f1':c.kok==='Pääministeripuolue'?'#ffad83':'#acd680'} stroke="#18232c"><title>{c.name}: {c.kok}, {c.start} – {c.end??'jatkuu'}</title></rect></g>;})}
 <text x="80" y="368">Vihreä: hallituspuolue</text><text x="330" y="368">Oranssi: pääministeripuolue</text><text x="620" y="368">Violetti: oppositiossa</text>
 <text x="80" y="408">Vuosisarjan pisteet vuoden keskellä · taulukossa kaikki hallitukset vaihtumisvuosina</text>
 </svg></div>
 <p>Kokonaishedelmällisyysluku ei ole saman sukupolven lopullinen lapsiluku. Se kertoo laskennallisen lapsimäärän, jos tarkasteluvuoden ikäkohtaiset hedelmällisyysluvut säilyisivät. Vuoden 2025 nousu ei yksin osoita minkään hallituksen päätöksen vaikutusta. <a href={fertility.source}>Tilastokeskus: 12dt, haettu {fertility.retrieved}</a>.</p>
 <label htmlFor={`${uid}-year`}>Perhepolitiikan tarkasteluvuosi <select id={`${uid}-year`} value={year} onChange={e=>{setYear(Number(e.target.value));setEventId(null);}}>{fertility.points.map(p=><option key={p.year}>{p.year}</option>)}</select></label>
 <p><b>{year}: {fmt(annual.tfr)}.</b> Vuoden aikana: {cabinetsInYear(year).map(c=>`${c.name} (${c.kok})`).join('; ')}.</p>
 <div className="fp-table"><table><caption>Syntyvyyden vuosihavainnot ja hallitusvastuu</caption><thead><tr><th>Vuosi</th><th>Kokonaishedelmällisyysluku</th><th>Vuoden aikana toimineet hallitukset ja Kokoomuksen asema</th></tr></thead><tbody>{fertility.points.map(p=><tr key={p.year}><th scope="row">{p.year}</th><td>{fmt(p.tfr)}</td><td>{cabinetsInYear(p.year).map(c=>`${c.name}: ${c.kok}`).join('; ')}</td></tr>)}</tbody></table></div>
 <h3>Valikoidut päätökset ja puheet</h3><div className="fp-events">{familyPolicyEvents.map(e=><button key={e.id} type="button" aria-pressed={selected?.id===e.id} onClick={()=>{setYear(e.year);setEventId(e.id);}}>{e.date} · {e.title}<small>{e.kind}</small></button>)}</div>
 <div aria-live="polite">{selected?<FamilyPolicyDetails id={selected.id}/>:<p>Tälle vuodelle ei ole päätösmerkintää tässä valikoidussa koosteessa.</p>}</div>
 <h3>FLUX: epävarmuus liittyi perheenmuodostuksen eriytymiseen</h3><p>Vuoden 2024 tutkimuskooste tarkasteli Suomen vuosia 2010–2019 ja 153 koulutusryhmää. Syntyvyys laski voimakkaammin aloilla, joilla työmarkkinanäkymät olivat epävarmemmat. Työttömyyden yhteys oli vahvin myös muiden tarkasteltujen tekijöiden huomioinnin jälkeen. Laskua oli silti vakaampien näkymien aloilla. Tämä ei ole yksittäisten hallitusten tai leikkausten kausaalinen arvio. <a href={fluxSources.uncertainty}>FLUX: tutkimuksen menetelmät ja tulokset</a>.</p>
 <p>Toinen tutkimuslinja osoittaa koulutusryhmien eriytymistä myös lopullisessa lapsiluvussa: matalammin koulutetuilla yleistyivät sekä lapsettomuus että suuret lapsiluvut. Naisia tarkasteltiin 40- ja miehiä 45-vuotiaina. Kotitaloudessa asuvien lasten keskimäärä on eri mittari. <a href={fluxSources.education}>Turun yliopisto: koulutus ja toteutunut lapsiluku</a>.</p>
 <details><summary>Hallituskaudet, yhteistyö ja näytön rajat</summary><div className="fp-table"><table><caption>Hallitukset tarkastelujaksolla; koostumuksen muutokset huomioidaan sanallisesti</caption><thead><tr><th>Hallitus ja kausi</th><th>Pääministeripuolue</th><th>Kokoomus</th><th>Yhteistyö ja rajaus</th></tr></thead><tbody>{cabinets.map(c=><tr key={c.id}><th scope="row"><a href={c.source}>{c.name}</a><br/>{c.start} – {c.end??'jatkuu'}</th><td>{c.pm}</td><td>{c.kok}</td><td>{c.parties}. {c.note}</td></tr>)}</tbody></table></div>
 <p>Hallituskauden aikana havaittu syntyvyys ei ole automaattisesti sen politiikan tulos. Päätökset vaikuttavat viiveellä, ja pandemia, suhdanteet, parisuhteet sekä väestön rakenne vaikuttavat rinnalla. Ministeripäivien osuuksia tai puoluekohtaista vaikutuskerrointa ei ole laskettu.</p><p>Työperäinen maahanmuutto ja perheen perustamisen edellytykset voidaan vahvistaa rinnakkain. Rekrytointiohjelma ei yksin osoita halpatyövoiman tavoittelua: palkat, työehdot, valvonta ja työnantajariippuvuus tarvitsevat oman aineiston. Tätä rinnastusta ei käytetä väitteeseen, että lasten syntyminen olisi tietoisesti korvattu maahanmuutolla.</p></details>
 </section>;
}
