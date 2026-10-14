import { useId, useState } from 'react';
import { careEvents, careIndex, careIndicators, careLegalThreshold, careRegions, careValue, careYears, type CareMeasure } from './care-capacity';
import { TimelineCoverage, useLinkedYear } from './timeline-context';
import './care-capacity.css';
const fmt=(n:number|null,digits=1)=>n===null?'Ei havaintoa':n.toLocaleString('fi-FI',{maximumFractionDigits:digits});
const colors=['#65d9ec','#ffad83','#d5a4f1'];
type Line={name:string;values:(number|null)[];breaks?:number[]};
function Trend({title,unit,lines,year,fixedMax}:{title:string;unit:string;lines:Line[];year:number;fixedMax?:number}){
 const all=lines.flatMap(l=>l.values.filter((v):v is number=>v!==null)),max=fixedMax??Math.max(1,...all)*1.12;
 const x=(i:number)=>58+i*46,y=(v:number)=>190-v/max*150;
 const path=(l:Line)=>l.values.reduce<string>((d,v,i)=>v===null?d:d+`${i===0||l.values[i-1]===null||l.breaks?.includes(careYears[i]!)?'M':'L'}${x(i)},${y(v)} `,'');
 return <figure className="cc-trend"><figcaption><b>{title}</b><span>{unit}</span></figcaption><svg viewBox="0 0 530 235" role="img" aria-label={`${title}. Tarkat luvut alla olevassa taulukossa.`}>
 {[0,.5,1].map(t=><g key={t}><line x1="58" x2="472" y1={y(max*t)} y2={y(max*t)} className="cc-grid"/><text x="49" y={y(max*t)+4} textAnchor="end">{fmt(max*t,0)}</text></g>)}
 <line x1={x(year-2016)} x2={x(year-2016)} y1="30" y2="195" className="cc-cursor"/>
 {lines.map((l,j)=><g key={l.name} stroke={colors[j]}><path d={path(l)} fill="none" strokeWidth="3"/>{l.values.map((v,i)=>v===null?null:<circle key={i} cx={x(i)} cy={y(v)} r={year===careYears[i]?5:3} fill={colors[j]}><title>{careYears[i]} · {l.name}: {fmt(v)}</title></circle>)}</g>)}
 {[2016,2019,2022,2025].map(v=><text key={v} x={x(v-2016)} y="217" textAnchor="middle">{v}</text>)}
 </svg><ul className="cc-legend">{lines.map((l,i)=><li key={l.name}><i style={{background:colors[i]}}/>{l.name}</li>)}</ul></figure>;
}
export function CareCapacity(){
 const uid=useId(),[region,setRegion]=useState(658),[real,setReal]=useState(true);
 const [year,setYear]=useLinkedYear(2024,{min:2016,max:2025});
 const name=careRegions.find(r=>r.id===region)!.name;
 const values=(m:CareMeasure)=>careYears.map(y=>careValue(region,y,m,m==='cost'&&real));
 const rows:[CareMeasure,string,string][]=[['population','75 vuotta täyttäneet','henkilöä'],['clients','Säännöllisen kotihoidon asiakkaat 75+ vuoden aikana','henkilöä'],['coverage','Kotihoidon peittävyys 75+','% ikäryhmästä'],['cost','Iäkkäiden sosiaalipalvelujen nettokäyttökustannus',real?'€ (2025) / 75+ asukas':'€ / 75+ asukas'],['fixed','Kiinteän 0,7-mitoituksen täyttävät yksiköt','% yksiköistä'],['legal','Vuoden seurantajakson lakirajan täyttävät yksiköt','% yksiköistä'],['hours','Suunnitellut kotihoidon tunnit toteutuvat vähintään kokonaan','% yksiköistä']];
 const population=careValue(region,year,'population'),clients=careValue(region,year,'clients'),coverage=careValue(region,year,'coverage');
 return <section className="cc" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Ikääntyminen · palvelujen kantokyky</p><h2 id={`${uid}-title`}>Kasvaako palvelu ikääntyneiden mukana?</h2>
 <p>Ikääntyneiden määrä, palveluja käyttävien määrä ja palvelun toteutuminen voivat kulkea eri suuntiin. Rinnasta kehitystä kustannuksiin ja henkilöstöön. Ikäryhmän kasvu kuvaa mahdollista palvelupainetta; se ei mittaa yksilöllistä avuntarvetta.</p>
 <div className="cc-controls"><label htmlFor={`${uid}-region`}>Palvelujen alue <select id={`${uid}-region`} value={region} onChange={e=>setRegion(Number(e.target.value))}>{careRegions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label><input type="checkbox" checked={real} onChange={e=>setReal(e.target.checked)}/> Kustannukset vuoden 2025 kuluttajahinnoin</label></div>
 <p className="cc-note">Aluevalinta käyttää Sotkanetin hyvinvointialueita ja Helsingin kaupunkia. Se on erillinen yhteisen aikajanan maakuntavalinnasta. Väestö ja kustannukset sisältävät koko maan valinnassa Ahvenanmaan; henkilöstö- ja tuntiseuranta koskee Manner-Suomea.</p>
 <label htmlFor={`${uid}-year`}>Palvelujen havaintovuosi {year}<input id={`${uid}-year`} type="range" min="2016" max="2025" value={year} aria-valuetext={String(year)} onChange={e=>setYear(Number(e.target.value))}/></label>
 <TimelineCoverage year={year} label="Vanhuspalvelujen näkymä"/>
 <div className="cc-headline" aria-live="polite"><strong>{name} · {year}</strong><span>75+ väestö <b>{fmt(population,0)}</b></span><span>Kotihoidon asiakkaat vuoden aikana <b>{fmt(clients,0)}</b></span><span>Peittävyys <b>{coverage===null?'Ei havaintoa':`${fmt(coverage)} %`}</b></span></div>
 <div className="cc-panels">
 <Trend title="Väestö ja kotihoidon asiakasmäärä" unit="2016 = 100 · eri ajankohtien henkilömäärät" year={year} lines={[{name:'75+ väestö, 31.12.',values:careYears.map(y=>careIndex(region,y,'population'))},{name:'75+ kotihoidon asiakkaat vuoden aikana',values:careYears.map(y=>careIndex(region,y,'clients'))}]}/>
 <Trend title="Kustannus suhteessa ikäryhmään" unit={real?'€ (2025) / 75+ asukas':'Nimelliset € / 75+ asukas'} year={year} lines={[{name:'Iäkkäiden sosiaalipalvelut yhteensä',values:values('cost'),breaks:[2022,2023]}]}/>
 <Trend title="Henkilöstön kaksi vertailurajaa" unit="% ympärivuorokautisen hoidon yksiköistä" fixedMax={100} year={year} lines={[{name:'Kiinteä mitoitus 0,7',values:values('fixed')},{name:'Voimassa oleva vähimmäismitoitus',values:values('legal'),breaks:[2022,2023,2025]}]}/>
 <Trend title="Toteutuivatko suunnitellut tunnit?" unit="% kotihoidon yksiköistä · seurannan kalenterikuukausi" fixedMax={100} year={year} lines={[{name:'Toteutuneet tunnit ≥ suunnitellut tunnit',values:values('hours'),breaks:[2025]}]}/>
 </div>
 <p className="cc-note"><b>Viivan katkos on tulkinnan raja.</b> Kustannusluokat muuttuvat 2022 ja organisaatiot 2023. Lakiraja vaihtuu vuosina 2022, 2023 ja 2025. Tuntiseurannan rajaus muuttuu 2025. Puuttuvat havainnot jäävät aukoiksi.</p>
 <div className="cc-table"><table><caption>{name} · täsmälliset havainnot {year}</caption><thead><tr><th>Mittari</th><th>Havainto</th><th>Yksikkö ja rajaus</th></tr></thead><tbody>{rows.map(([m,label,unit])=><tr key={m}><th scope="row">{label}</th><td>{fmt(careValue(region,year,m,m==='cost'&&real),m==='population'||m==='clients'?0:1)}</td><td>{unit}{m==='legal'&&careLegalThreshold(year)!==null?` · lakiraja ${fmt(careLegalThreshold(year),2)}`:''}</td></tr>)}</tbody></table></div>
 <div className="cc-reading"><h3>Mitä suunnan erosta voi päätellä?</h3><p>Kun ikäryhmä kasvaa asiakasmäärää nopeammin, peittävyys pienenee. Tämä voi liittyä kohdentamisen muutokseen, terveempään ikääntymiseen, palvelumuotojen vaihtumiseen tai avun puutteeseen. Pelkkä peittävyys ei ratkaise, mikä selitys on oikea.</p><p>Suunniteltujen tuntien toteutuminen kertoo päätetyn palvelun toteutuksesta. Se ei kerro palvelun ulkopuolelle jäävien avuntarpeesta eikä siitä, onko suunnitelman tuntimäärä riittävä. Yksikköjen osuus ei ole asiakkaiden osuus eikä toteutuneiden tuntien prosenttiosuus.</p><p>Kustannus asukasta kohti ei ole palvelutunti tai henkilöstömäärä. Mukana ovat myös poistot, arvonalentumiset ja sisäiset erät, joista tuotot vähennetään. Kuluttajahintaindeksi poistaa yleistä hintojen nousua; se ei mittaa hoivatyön tuotantokustannuksia tai tuottavuutta. Ikäryhmän 75+ sisäinen ikä- ja toimintakykyrakenne jää vakioimatta.</p></div>
 <div className="cc-events">{careEvents.map(e=><button type="button" key={e.id} aria-pressed={year===e.year} onClick={()=>setYear(e.year)}>{e.year} · {e.title}</button>)}</div>
 {careEvents.filter(e=>e.year===year).map(e=><article key={e.id}><h4>{e.title}</h4><p>{e.text} <a href={e.url}>Lähde</a></p></article>)}
 <details><summary>Lähteet, kattavuus ja mittarien erot</summary>
 <p>Tilastokeskuksen väestö ja THL:n kotihoitorekisteri: väestö vuoden lopussa, asiakkaat koko vuoden aikana. Säännöllinen kotihoito tarkoittaa kotikäyntiä vähintään kuutena päivänä 60 päivän aikana. Vuoden aikana asiakkaana olleita ei rinnasteta vuoden lopun kotihoitoasiakkaisiin. Käytössä on sama Avohilmo-indikaattori 5513 myös takautuville vuosille 2016–2018; sitä ei yhdistetä vanhaan marraskuun asiakaslaskentaan.</p>
 <p>Kotihoitorekisterissä on lähteen mukaan puutteita: Vantaa 2019–2023, Helsinki ja Kerava 2021–2023, useita Lapin kuntia sekä Pyhäranta ja Lapinjärvi. Ahvenanmaan vuoden 2025 tiedot ovat osittain puutteellisia. Myös koko maan peittävyyden muutosta voi siksi selittää kirjaaminen. Tarkista ajantasaiset rajoitteet lähteestä.</p>
 <p>Henkilöstömitoitus perustuu toteutuneeseen välittömään asiakastyöhön kolmen viikon seurantajaksolla, ei työntekijöiden henkilömäärään. Näytetään vuoden viimeisen seurantajakson tieto. Vuoden 2025 lakirajan 0,60 täyttämistä ei verrata suoraan vuosien 2023–2024 rajaan 0,65. Kiinteä 0,7 on vertailuraja, eikä sitä esitetä näiden vuosien lakisääteisenä vähimmäistasona.</p>
 <p>Kotihoidon tuntiseurannan vastausprosentti: 2023 90,1 %, 2024 90,4 %, 2025 85 %. Vuoden 2025 yksityiset yksiköt rajataan hyvinvointialueiden ostopalvelu- ja palvelusetelikumppaneihin. Seuranta sisältää mukana olevien yksiköiden kaikki kotihoidon asiakkaat iästä riippumatta. Asiakkaasta johtuvat keskeytykset huomioidaan suunniteltujen tuntien määrässä.</p>
 <ul>{careIndicators.map(i=><li key={i.id}><a href={`https://sotkanet.fi/rest/1.1/indicators/${i.id}`}>{i.id} · {i.title}</a> · päivitetty {i.updated}</li>)}</ul>
 <p><a href="https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__khi/statfin_khi_pxt_11xm.px/">Kuluttajahintaindeksi</a> · Sotkanet-aineisto tarkistettu 14.10.2026. Havaintovuosia ei täytetä ennusteilla. Rinnastus ei osoita yksittäisen hallituksen päätöksen syyvaikutusta.</p>
 </details></section>;
}
