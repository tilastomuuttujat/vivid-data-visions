import { useId, useState } from 'react';
import { useLinkedYear, useLinkedRegion, TimelineCoverage } from './timeline-context';
import { norwayShares, norwaySource, structuralEvents, transitionRegions, transitionChange } from './structural-choices';
import { StructuralChoiceDetails } from './StructuralChoiceDetails';
import './structural-choices.css';
const fmt=(n:number|null)=>n===null?'Ei havaintoa':n.toLocaleString('fi-FI',{maximumFractionDigits:1});
const lanes=['Leonia–Sampo','Norjan omistus','Vaikutuskanavat'];
export function StructuralChoices(){
 const uid=useId();const [eventId,setEventId]=useState('leonia-proposal-2000');const [eventYear,setEventYear]=useLinkedYear(2000,{min:1990,max:2015,observed:structuralEvents.map(e=>e.year)});
 const e=structuralEvents.find(e=>e.id===eventId&&e.year===eventYear)??structuralEvents.find(e=>e.year===eventYear)!;
 const [region,setRegion]=useLinkedRegion('MK08');const [year,setYear]=useLinkedYear(2023,{min:2000,max:2023});
 const selected=transitionRegions.find(r=>r.id===region)!;const points=selected.points.filter(p=>p.year>=2000&&p.year<=2023);
 const max=Math.max(1,...points.flatMap(p=>[p.industry??0,p.information??0]));
 const path=(key:'industry'|'information')=>points.reduce((d,p,i)=>p[key]===null?d:d+`${i===0||points[i-1]![key]===null?'M':'L'}${90+(p.year-2000)/23*660},${270-p[key]!/max*210} `,'');
 const industry=transitionChange(region,year,'industry'),information=transitionChange(region,year,'information');
 return <section className="sc" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Omistus, vaikutusvalta ja siirtymän kustannukset</p><h2 id={`${uid}-title`}>Kenelle jäi tuotto, määräysvalta ja sopeutumisen hinta?</h2>
 <p>Kolme näkökulmaa yhdistää nykyisiä polkuja: omistuksen muuttaminen, päätöksentekoon pääsy ja vanhan työn rinnalle syntyvä uusi työ. Ajallinen yhteys ei yksin osoita yhteistä suunnitelmaa.</p>
 <h3>1. Omistus ja vaikutuskanavat</h3><TimelineCoverage year={eventYear} label="Omistus- tai vaikutuskanavatapahtuma"/>
 <svg viewBox="0 0 920 280" role="img" aria-label="Leonia–Sampo, Norjan omistus ja vaikutuskanavat vuosina 1990–2015. Avoimet pisteet merkitsevät esitystä tai tavoitetta, täytetyt toteutunutta tapahtumaa tai päätöstä. Yksityiskohdat avataan painikkeista.">
 {[1990,1995,2000,2005,2010,2015].map(y=><g key={y}><line x1={220+(y-1990)/25*620} x2={220+(y-1990)/25*620} y1="30" y2="230" className="sc-grid"/><text x={220+(y-1990)/25*620} y="20" textAnchor="middle">{y}</text></g>)}
 {lanes.map((l,i)=><g key={l}><text x="205" y={70+i*65} textAnchor="end">{l}</text><line x1="220" x2="840" y1={65+i*65} y2={65+i*65} className="sc-grid"/>{structuralEvents.filter(e=>e.lane===l).map(a=><circle key={a.id} cx={220+(a.year-1990)/25*620} cy={65+i*65} r={a.id===e.id?8:5} fill={a.kind==='Hallituksen esitys'||a.kind==='Etujärjestön tavoite'?'#18232c':['#65d9ec','#acd680','#ffad83'][i]} stroke={['#65d9ec','#acd680','#ffad83'][i]} strokeWidth="2"><title>{a.date}: {a.title} · {a.kind}</title></circle>)}</g>)}
 <text x="220" y="265">Avoin: esitys / tavoite · Täytetty: toteutuma / päätös</text>
 </svg>
 <div className="sc-events">{structuralEvents.map(a=><button key={a.id} type="button" aria-pressed={a.id===e.id} onClick={()=>{setEventId(a.id);setEventYear(a.year);}}>{a.date} · {a.title}<small>{a.kind}</small></button>)}</div><div aria-live="polite"><StructuralChoiceDetails id={e.id}/></div>
 <p><b>Leonia-tapauksen avoin kysymys:</b> valtiolle saatu vastike ei ratkaise arvostuksen oikeudenmukaisuutta. Aliarvostuksen arvio vaatii aikalaisarvostukset, vaihtosuhteen, ostajat ja vaihtoehtoiset tarjoukset. Jälkikäteinen myyntivoitto ei yksin osoita alihintaa. Valtion saamat osingot, osakemyyntitulot ja jäljelle jäänyt omistus on täsmäytettävä erikseen.</p>
 <h3>2. Norja: omistusta myös vahvistettiin</h3>
 <svg viewBox="0 0 860 250" role="img" aria-label="Norjan valtion Statoil-osuus 2001 81,7 %, 2005 70,9 %, 2007 62,5 % ja 2009 67 %. Rajatut omistushavainnot, ei vuosittainen sarja.">
 {[0,50,100].map(v=><g key={v}><line x1="90" x2="750" y1={200-v*1.5} y2={200-v*1.5} className="sc-grid"/><text x="75" y={205-v*1.5} textAnchor="end">{v} %</text></g>)}
 <polyline points={norwayShares.map(p=>`${90+(p.year-2001)/8*660},${200-p.value*1.5}`).join(' ')} fill="none" stroke="#acd680" strokeWidth="3"/>
 {norwayShares.map(p=><g key={p.year}><circle cx={90+(p.year-2001)/8*660} cy={200-p.value*1.5} r="5" fill="#acd680"/><text x={90+(p.year-2001)/8*660} y={185-p.value*1.5} textAnchor="middle">{fmt(p.value)} %</text><text x={90+(p.year-2001)/8*660} y="230" textAnchor="middle">{p.year}</text></g>)}
 </svg>
 <div className="sc-table"><table><caption>Norjan omistus: eri järjestelyjen jälkeiset havainnot</caption><thead><tr><th>Vuosi</th><th>Valtion osuus</th><th>Ajankohta</th></tr></thead><tbody>{norwayShares.map(p=><tr key={p.year}><th scope="row">{p.year}</th><td>{fmt(p.value)} %</td><td>{p.basis}</td></tr>)}</tbody></table></div>
 <p>Valtio osti osakkeita palauttaakseen vuoden 2007 laimentuneen osuuden tavoiteltuun 67 prosenttiin. Viiva yhdistää rajatut havainnot; välivuosille ei muodosteta omistuslukuja. <a href={norwaySource}>Norjan hallitus: omistushistoria, Prop. 84 S (2015–2016), luku 2</a>.</p>
 <p>Öljyrahasto, suorat öljyomistukset ja Statoil-omistus ovat eri kanavia. Suomen pankin tai siirrettävän teollisuustuotannon vertaaminen öljyvarantoon ei ole saman omaisuuslajin vertailu. Norjan enemmistövallan säilyttäminen osoittaa omistajapoliittisen vaihtoehdon; se ei osoita Suomen kauppoja alihintaisiksi tai Norjan kaikkia kauppoja ongelmattomiksi.</p>
 <h3>3. Siirtymän kuilu: riittikö uusi työ vanhan rinnalle?</h3>
 <p>Tämä kuvaaja antaa nykyisen alueellisen taustan vuosilta 2000–2023. Se ei mittaa pienviljelystä teollisuuteen siirtymisen nopeutta. Teollisuus ja informaatio sekä viestintä ovat kaksi rajattua toimialaa, eivät kaikki vanha ja uusi työ.</p>
 <TimelineCoverage year={year} label="Alueellinen toimialatyöllisyys"/>
 <label htmlFor={`${uid}-region`}>Siirtymän maakunta <select id={`${uid}-region`} value={region} onChange={v=>setRegion(v.target.value)}>{transitionRegions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
 <label htmlFor={`${uid}-year`}>Siirtymän tarkasteluvuosi <select id={`${uid}-year`} value={year} onChange={v=>setYear(Number(v.target.value))}>{points.map(p=><option key={p.year}>{p.year}</option>)}</select></label>
 <svg viewBox="0 0 850 345" role="img" aria-label={`${selected.name}: teollisuuden sekä informaation ja viestinnän työllisyys 2000–2023, henkilöä vuosikeskiarvona. Sama pystyakseli molemmille, asteikko vaihtuu maakunnan mukaan. Tarkat valitun vuoden luvut taulukossa.`}>
 {[0,.5,1].map(v=><g key={v}><line x1="90" x2="750" y1={270-v*210} y2={270-v*210} className="sc-grid"/><text x="75" y={275-v*210} textAnchor="end">{fmt(max*v)}</text></g>)}
 <text x="90" y="30">Henkilöä · vuosikeskiarvo</text><path d={path('industry')} fill="none" stroke="#65d9ec" strokeWidth="3"/><path d={path('information')} fill="none" stroke="#ffad83" strokeWidth="3"/>
 <line x1={90+(year-2000)/23*660} x2={90+(year-2000)/23*660} y1="50" y2="270" className="sc-cursor"/>
 {[2000,2010,2020,2023].map(y=><text key={y} x={90+(y-2000)/23*660} y="295" textAnchor="middle">{y}</text>)}
 <text x="90" y="330">Turkoosi: teollisuus</text><text x="360" y="330">Oranssi: informaatio ja viestintä</text>
 </svg>
 <div className="sc-table"><table><caption>{selected.name}: toimialatyöllisyyden muutos 2000–{year}</caption><thead><tr><th>Toimiala</th><th>2000</th><th>{year}</th><th>Nettomuutos, henkilöä</th></tr></thead><tbody>{[['Teollisuus',industry],['Informaatio ja viestintä',information]].map(([name,r])=>{const a=r as typeof industry;return <tr key={name as string}><th scope="row">{name as string}</th><td>{fmt(a?.base??null)}</td><td>{fmt(a?.current??null)}</td><td>{fmt(a?.change??null)}</td></tr>;})}</tbody></table></div>
 <p>Työlliset ovat aluetilinpidon alueellisen tuotannon työllisiä, eivät vuoden lopun rekisterityöpaikkoja. Nettomuutos ei kerro, siirtyivätkö samat ihmiset toimialalta toiselle tai kuinka paljon työpaikkoja syntyi ja hävisi. Vuoden 2024 toimialatiedot puuttuvat tästä aineistosta. <a href="https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__altp/12bg.px/">Tilastokeskus: 12bg</a>.</p>
 <details><summary>Mitä väitteitä tämä auttaa tutkimaan?</summary><p>Siirtymän kuilun mittaaminen tarvitsee toimialojen lisäksi työttömyyden keston, muutot, koulutuksen, asumisen ja samojen ihmisten työurat. Kaksi toimialasarjaa ei osoita omistuksen muutosta syyksi eikä korvaavien töiden kokonaismäärää.</p><p>VM:n läheisyys EK:hon, tietoinen velkarahoitettu työttömyysstrategia ja puna-valkoisen jaon jatkuvuus ovat tässä tutkittavia hypoteeseja. Henkilösidos, etujärjestön tavoite, hallituksen päätös ja toteutunut vaikutus on erotettava. Niiden arviointi tarvitsee valmisteluasiakirjat, sidonnaisuudet, hyötyjät sekä toteutuneiden päätösten ja vaikutusten erittelyn.</p><p>Julkisten kustannusten siirtymistä voidaan tutkia vertaamalla yritysten sopeutuksia menetettyihin palkkatuloihin, työttömyysturvaan ja verotuloihin. Työttömyyden mahdollinen palkkapaineita hillitsevä vaikutus ei yksin osoita sen olleen tavoite tai kansantaloudelle hyödyllistä.</p></details>
 </section>;
}
