import { useId, useState } from 'react';
import { TimelineCoverage, useLinkedYear } from './timeline-context';
import { budgetAuthor, budgetEvents, budgetGroups, budgetPoint, budgetPoints, budgetValue, executionCabinets, incomeGroups, taxGroups, type BudgetPoint, type BudgetStage, type BudgetUnit } from './budget-history';
import './budget-power.css';

const format=(v:number|null,digits=2)=>v===null?'Ei havaintoa':v.toLocaleString('fi-FI',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const x=(year:number)=>80+(year-2000)/25*790;
const unitLabel=(unit:BudgetUnit,side:'expense'|'income')=>unit==='real'?'mrd. € · vuoden 2024 ostovoima':unit==='nominal'?'mrd. € · käypä raha':side==='expense'?'% menoista ilman velan lyhennyksiä':'% tuloista osastoissa 11–13';
const stages={actual:'Tilinpäätöksen toteuma',proposal:'Alkuperäinen hallituksen esitys'};
export function budgetSegments(points:BudgetPoint[],key:string,side:'expense'|'income',unit:BudgetUnit){
 const parts:{year:number;value:number}[][]=[];
 let part:{year:number;value:number}[]=[];
 for(let year=2000;year<=2025;year++){
  const point=points.find(p=>p.year===year),value=budgetValue(point,key,side,unit);
  const boundary=(side==='expense'&&((key==='32'&&year===2008)||(key==='29'&&[2013,2015].includes(year))||(['28','33'].includes(key)&&year===2023)))||(side==='income'&&year===2023);
  if(value===null||boundary){if(part.length)parts.push(part);part=[];}
  if(value!==null)part.push({year,value});
 }
 if(part.length)parts.push(part);
 return parts;
}
function BudgetChart({side,stage,unit,selected,year,authorId,tax=false}:{side:'expense'|'income';stage:BudgetStage;unit:BudgetUnit;selected:string[];year:number;authorId:string;tax?:boolean}){
 const groups=side==='expense'?budgetGroups:tax?taxGroups:incomeGroups;
 const points=budgetPoints.filter(p=>p.stage===stage);
 const series=groups.filter(g=>selected.includes(g.id)).map(g=>({...g,parts:budgetSegments(points,g.id,side,unit)}));
 const values=series.flatMap(s=>s.parts.flatMap(p=>p.map(v=>v.value)));
 const high=Math.max(1,...values)*1.08,low=Math.min(0,...values);
 const y=(v:number)=>245-(v-low)/(high-low)*190;
 return <div className="bp-chart"><svg viewBox="0 0 960 325" role="img" aria-label={`${side==='expense'?'Menojen':'Tulojen'} kehitys 2000–2025, ${stages[stage]}, ${unitLabel(unit,side)}. Tarkat luvut ovat taulukossa.`}>
 <text x="80" y="25">{unitLabel(unit,side)}</text>
 {authorId!=='all'&&Array.from({length:26},(_,i)=>2000+i).filter(yr=>budgetAuthor(yr).id===authorId).map(yr=><rect key={yr} x={x(yr)} y="40" width={790/25} height="214" fill="#f5ad70" opacity=".12"/>)}
 {[0,.25,.5,.75,1].map(t=>{const value=low+(high-low)*t;return <g key={t}><line x1="80" x2="870" y1={y(value)} y2={y(value)} className="bp-grid"/><text x="66" y={y(value)+4} textAnchor="end">{format(value,unit==='share'?1:2)}</text></g>;})}
 <line x1={x(year)} x2={x(year)} y1="40" y2="253" className="bp-cursor"/>
 {series.map(s=><g key={s.id}>{s.parts.map((part,i)=><polyline key={i} points={part.map(p=>`${x(p.year)},${y(p.value)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="3" strokeDasharray={stage==='proposal'?'7 4':undefined}/>)}{s.parts.flat().map(p=><circle key={p.year} cx={x(p.year)} cy={y(p.value)} r={p.year===year?5:2.7} fill={s.color}><title>{s.name}, {p.year}: {format(p.value)} · {unitLabel(unit,side)}</title></circle>)}</g>)}
 {[2000,2005,2010,2015,2020,2025].map(yr=><text key={yr} x={x(yr)} y="278" textAnchor="middle">{yr}</text>)}
 <text x="80" y="307">Viivat katkaistaan havaintoaukkojen ja merkittyjen luokittelumuutosten kohdalla.</text>
 </svg></div>;
}

export function BudgetPower(){
 const uid=useId();const [year,setYear]=useLinkedYear(2015,{min:2000,max:2025});
 const [stage,setStage]=useState<BudgetStage>('actual');const [unit,setUnit]=useState<BudgetUnit>('real');
 const [selected,setSelected]=useState(['29','30','36']);const [authorId,setAuthorId]=useState('all');
 const [eventId,setEventId]=useState<string|null>(null);
 const point=budgetPoint(year,stage),proposal=budgetPoint(year,'proposal'),actual=budgetPoint(year,'actual');
 const author=budgetAuthor(year),events=budgetEvents.filter(e=>e.year===year),event=events.find(e=>e.id===eventId)??events[0];
 const authors=Array.from(new Map(Array.from({length:26},(_,i)=>budgetAuthor(2000+i)).map(a=>[a.id,a])).values());
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
 return <section className="bp" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Budjettivalta · vuosittainen vertailu 2000–2025</p>
 <h2 id={`${uid}-title`}>Mihin yhteiskunnan suuntaa rahoitettiin?</h2>
 <p>Vertaa hallitusten alkuperäisiä esityksiä ja tilinpäätösten toteutumia. Hallituksen vaihtumisvuoden budjetti on usein edeltäjän valmistelema. Toteumaan vaikuttavat myös eduskunnan päätökset, lisätalousarviot, suhdanteet ja aiempien vuosien sitoumukset.</p>
 <TimelineCoverage year={year} label="Budjettivallan vuosikehys"/>
 <div className="bp-controls">
 <label htmlFor={`${uid}-stage`}>Budjetin vaihe <select id={`${uid}-stage`} value={stage} onChange={e=>setStage(e.target.value as BudgetStage)}><option value="actual">Tilinpäätöksen toteuma</option><option value="proposal">Alkuperäinen hallituksen esitys</option></select></label>
 <label htmlFor={`${uid}-unit`}>Rahan mittari <select id={`${uid}-unit`} value={unit} onChange={e=>setUnit(e.target.value as BudgetUnit)}><option value="real">Vuoden 2024 ostovoima</option><option value="nominal">Käypä raha</option><option value="share">Osuus kokonaisuudesta</option></select></label>
 <label htmlFor={`${uid}-author`}>Korosta budjetin valmistelija <select id={`${uid}-author`} value={authorId} onChange={e=>{setAuthorId(e.target.value);const first=budgetPoints.filter(p=>p.stage===stage&&budgetAuthor(p.year).id===e.target.value).sort((a,b)=>a.year-b.year)[0];if(first)setYear(first.year);}}><option value="all">Kaikki hallitukset</option>{authors.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label>
 </div>
 <label className="bp-year" htmlFor={`${uid}-year`}>Budjettivuosi {year}<input id={`${uid}-year`} type="range" min="2000" max="2025" step="1" value={year} aria-valuetext={String(year)} onChange={e=>setYear(Number(e.target.value))}/></label>
 <div className="bp-responsibility" aria-live="polite"><h3>Budjettivastuu {year}</h3>
 <p><b>Alkuperäisen esityksen valmistelija:</b> {author.name}. Valtiovarainministeri: {author.minister}.</p>
 <p><b>Valmistelleen hallituksen puolueet:</b> {author.parties}.</p>
 <p><b>Vuoden aikana toimineet hallitukset:</b> {executionCabinets(year)}.</p>
 <p>{year<2002?'Vuosien 2000–2001 valmistelija on ajoitettu hallituskauden perusteella; alkuperäistä esitystä ei ole tässä arkistolinkissä.':'Valmistelijan lähteenä on alkuperäinen esitys. Täydentävä esitys ja eduskunnan hyväksyntä voivat tapahtua toisen hallituksen aikana.'} <a href={author.source}>Tarkista valmistelijan lähde</a>.</p>
 <a href="https://budjetti.vm.fi/tae/etusivu_aiemmat.jsp?lang=fi">Tarkista vuoden täydentävät esitykset ja lisätalousarviot</a>
 </div>
 <h3>Menojen painopisteet</h3>
 <fieldset className="bp-legend"><legend>Valitse vertailtavat pääluokat</legend>{budgetGroups.map(g=><label key={g.id}><input type="checkbox" checked={selected.includes(g.id)} onChange={()=>toggle(g.id)}/><span style={{color:g.color}}>{g.name}</span></label>)}</fieldset>
 {selected.length?<BudgetChart side="expense" stage={stage} unit={unit} selected={selected} year={year} authorId={authorId}/>:<p>Valitse vähintään yksi pääluokka nähdäksesi käyrän.</p>}
 {selected.map(id=>{const group=budgetGroups.find(g=>g.id===id)!;return <p className="bp-note" key={id}><b>{group.name}:</b> {group.note}</p>;})}
 <div className="bp-table"><table aria-label={`Menojen budjettivertailu ${year}`}><caption>{year}: alkuperäinen esitys ja toteuma · {unitLabel(unit,'expense')}</caption><thead><tr><th>Pääluokka</th><th>Esitys</th><th>Toteuma</th><th>Toteuma − esitys</th></tr></thead><tbody>{budgetGroups.map(g=>{const p=budgetValue(proposal,g.id,'expense',unit),a=budgetValue(actual,g.id,'expense',unit);return <tr key={g.id}><th scope="row">{g.name}</th><td>{format(p)}</td><td>{format(a)}</td><td>{format(p===null||a===null?null:a-p)}</td></tr>;})}</tbody></table></div>
 <p className="bp-note">Erotus kuvaa kahden asiakirjavaiheen väliä. Se ei yksin mittaa leikkausta tai uuden hallituksen päätösvaikutusta. Osuusnäkymässä erotus on prosenttiyksikköä.</p>
 <h3>Rahan lähteet</h3>
 <p>Osasto 13 kokoaa korkoja, osinkoja, voiton tuloutuksia ja osakkeiden myyntejä. Tämän sarjan perusteella niitä ei voi erottaa toisistaan. Sekalaisiin tuloihin voi sisältyä myös rahastosiirtoja ja käyttämättömien määrärahojen peruutuksia.</p>
 <div className="bp-legend">{incomeGroups.map(g=><span key={g.id} style={{color:g.color}}>{g.name}</span>)}</div>
 <BudgetChart side="income" stage={stage} unit={unit} selected={incomeGroups.map(g=>g.id)} year={year} authorId={authorId}/>
 <div className="bp-table"><table aria-label={`Tulojen lähteet ${year}`}><caption>{year}: {stages[stage]} · miljoonaa käypää euroa</caption><thead><tr><th>Tulon lähde</th><th>Määrä</th></tr></thead><tbody>{incomeGroups.map(g=><tr key={g.id}><th scope="row">{g.name}</th><td>{format(point?.income[g.id]??null,0)}</td></tr>)}<tr><th scope="row">Nettolainanotto ja velanhallinta (15.03.01)</th><td>{format(point?.income['borrowing']??null,0)}</td></tr></tbody></table></div>
 <p className="bp-note">Nettolainanotto esitetään erillään tulokäyristä ja niiden osuuksista. Vanhoissa taulukoissa lainaerittely voi puuttua; puuttuvaa havaintoa ei muuteta nollaksi. Talousarvion tasapaino ei ole sama kuin kansantalouden tilinpidon alijäämä tai velan muutos.</p>
 <details><summary>Verotuksen painopiste · momenttierittely 2012–2025</summary>
 <p>Tulon ja varallisuuden verot ovat luvussa 11.01; liikevaihdon perusteella kannettavat verot ja maksut sekä valmisteverot luvuissa 11.04 ja 11.08. Muut osaston 11 verot näkyvät omana ryhmänään. Jaottelu ei yksin kerro verorasituksen jakautumista kotitalouksille.</p>
 <div className="bp-legend">{taxGroups.map(g=><span key={g.id} style={{color:g.color}}>{g.name}</span>)}</div>
 <BudgetChart side="income" stage={stage} unit={unit} selected={taxGroups.map(g=>g.id)} year={year} authorId={authorId} tax/>
 <div className="bp-table"><table aria-label={`Verotuksen painopiste ${year}`}><caption>{year}: {stages[stage]} · {unitLabel(unit,'income')}</caption><thead><tr><th>Veroryhmä</th><th>Määrä tai osuus</th></tr></thead><tbody>{taxGroups.map(g=><tr key={g.id}><th scope="row">{g.name}</th><td>{format(budgetValue(point,g.id,'income',unit))}</td></tr>)}</tbody></table></div>
 <p className="bp-note">Erittely perustuu VM:n momentti-CSV:hen. Se hyväksytään vain, kun momenttien summa täsmää pääluokan erikseen julkaistuun summaan miljoonapyöristyksen tarkkuudella. Poistuneet momentit voivat jättää aiempien vuosien CSV-erittelyn vajaaksi, jolloin kaikki kyseisen vuoden veroryhmät jätetään puuttuviksi.</p>
 {point?.incomeDetailSource&&<p>{point.incomeDetailVerified?'Valitun vuoden erittely täsmää kokonaissummaan.':'Valitun vuoden erittely ei täsmää kokonaissummaan; kuvaajassa on havaintoaukko.'} <a href={point.incomeDetailSource}>Tarkista veromomenttien CSV</a>.</p>}
 </details>
 <h3>Budjetin käännekohdat</h3>
 <div className="bp-events">{budgetEvents.map(e=><button key={e.id} type="button" aria-pressed={event?.id===e.id} onClick={()=>{setYear(e.year);setEventId(e.id);}}>{e.year} · {e.title}</button>)}</div>
 <div aria-live="polite">{event?<article><h4>{event.title}</h4><p><b>{event.kind}</b></p><p>{event.text}</p><a href={event.url}>Lue käännekohdan alkuperäislähde</a></article>:<p>Valitulle vuodelle ei ole käännekohtaa tässä koosteessa.</p>}</div>
 <details><summary>Aineisto, laskenta ja vertailun rajat</summary>
 <p>Lähde: valtiovarainministeriön talousarvioesitysten yleisperustelujen pääluokka- ja tulotaulukot. Toteumat 2000–2024 ja alkuperäiset esitykset 2002–2025. Luvut ovat lähteen erikseen pyöristämiä miljoonia euroja. Kukin toteuma poimitaan kaksi vuotta myöhemmän esityksen tilinpäätössarakkeesta. Vuoden 2025 toteuma jää tässä aineistossa puuttuvaksi.</p>
 <p>Pääluokan 37 velan vähentämistä ei lasketa meno-osuuden nimittäjään. TEM:n sarja katkeaa 2008, opetusalan sarja 2013 ja 2015 sekä soteen liittyvät sarjat 2023. Muutkin tehtävä- ja rahoitussiirrot voivat vaikuttaa vertailuun; näitä pääluokkia ei pidetä vakiosisältöisinä palveluluokkina.</p>
 <p>Ostovoimakorjaus: määrä × vuoden 2024 elinkustannusindeksi / tarkasteluvuoden indeksi. Indeksi kuvaa kuluttajahintoja, joten se ei mittaa palvelutuotannon kustannuksia tai palvelujen määrää. <a href="https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__khi/11xm.px/">Tilastokeskuksen vuosikeskiarvot</a>.</p>
 <p>Valtion budjetti ei kata koko julkista taloutta, kuntien omaa rahoitusta tai kaikkia eläkejärjestelmän rahavirtoja. Hallitusvalinta korostaa alkuperäisten esitysten vuosia; se ei jaa toteumaa puolueille ministeripäivien perusteella.</p>
 {point&&<p><a href={point.expenseSource}>Valitun vaiheen menotaulukko</a> · <a href={point.incomeSource}>Valitun vaiheen tulotaulukko</a></p>}
 <p>Aineisto tarkistettu 14.10.2026. <a href="https://budjetti.vm.fi/">VM:n budjettipalvelu</a> · <a href="https://www.valtiokonttori.fi/palvelu/valtion-tilinpaatos/">Valtion tilinpäätökset</a>.</p>
 </details>
 </section>;
}
