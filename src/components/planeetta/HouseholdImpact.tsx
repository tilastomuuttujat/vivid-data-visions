import { useId, useState } from 'react';
import { useLinkedYear, useTimeline } from './timeline-context';
import { distribution2018, householdChange, householdImpactEvents, householdPoint, householdVintages, impactSources, type DistributionElasticity, type DistributionVariant } from './household-impact';
import './household-impact.css';

const format=(value:number,digits=0)=>value.toLocaleString('fi-FI',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const signed=(value:number,digits=0)=>`${value>0?'+':''}${format(value,digits)}`;
const palette={positive:'#6ee7d5',negative:'#ffad83',neutral:'#d5dee7'};
export function HouseholdImpact(){
 const uid=useId(),context=useTimeline();
 const [vintageId,setVintageId]=useState('2025'),[profileId,setProfileId]=useState('single-parent');
 const vintage=householdVintages.find(v=>v.id===vintageId)!;
 const years=vintage.profiles[0]!.points.map(p=>p.year);
 const [linkedYear,setYear]=useLinkedYear(2024,{min:2015,max:2025,observed:years});
 const year=context&&(context.year<2015||context.year>2025)?2024:linkedYear;
 const [reference,setReference]=useState(2023),[comparisonUnit,setComparisonUnit]=useState<'percent'|'euro'>('percent');
 const availableReference=years.filter(y=>y<=year),from=availableReference.includes(reference)?reference:availableReference.at(-1)!;
 const profile=vintage.profiles.find(p=>p.id===profileId)!,point=householdPoint(vintageId,profileId,year)!,base=householdPoint(vintageId,profileId,from)!;
 const change=householdChange(vintageId,profileId,from,year)!;
 const comparisons=vintage.profiles.map(p=>({profile:p,change:householdChange(vintageId,p.id,from,year)!}));
 const values=comparisons.map(p=>comparisonUnit==='percent'?p.change.percent:p.change.net),scale=Math.max(1,...values.map(Math.abs));
 const stages=[{label:'Bruttotulo',value:change.gross},{label:'Tulonsiirrot',value:change.transfers},{label:'Verojen vaikutus',value:change.taxEffect},...(change.rounding?[{label:'Pyöristys',value:change.rounding}]:[])];
 let running=0;const waterfall=stages.map(s=>{const start=running;running+=s.value;return {...s,start,end:running};});
 const extremes=[0,change.net,...waterfall.flatMap(s=>[s.start,s.end])],low=Math.min(...extremes),high=Math.max(...extremes),span=Math.max(30,high-low);
 const wy=(value:number)=>250-(value-low+span*.15)/(span*1.3)*195;
 const [variant,setVariant]=useState<DistributionVariant>('A'),[elasticity,setElasticity]=useState<DistributionElasticity>('0');
 const [eventId,setEventId]=useState<string|null>(null);
 const eventYear=context?.year??year;
 const event=householdImpactEvents.find(e=>e.id===eventId&&e.year===eventYear)??householdImpactEvents.find(e=>e.year===eventYear);
 const distribution=distribution2018.variants[variant],changes=distribution.changes[elasticity];
 const chooseYear=(value:number)=>setYear(value);
 return <section className="hi" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Kotitalouksien toimeentulo · verot ja etuudet yhdessä</p>
 <h2 id={`${uid}-title`}>Kenelle muutos jäi käteen?</h2>
 <p>Bruttotulon kasvu, verotuksen keveneminen ja etuuksien muutos voivat vetää eri suuntiin. Näissä kuvitteellisten kotitalouksien laskelmissa erot näkyvät erikseen. Alempana väestöä koskeva tutkimus näyttää, miten myös vaikutusarvion oletukset muuttavat tulosta.</p>
 <div className="hi-controls">
 <label htmlFor={`${uid}-vintage`}>Esimerkkilaskelman julkaisu <select id={`${uid}-vintage`} value={vintageId} onChange={e=>setVintageId(e.target.value)}><option value="2025">Labore 29.10.2025</option><option value="2024">Labore 10.10.2024</option></select></label>
 <label htmlFor={`${uid}-profile`}>Esimerkkikotitalous <select id={`${uid}-profile`} value={profileId} onChange={e=>setProfileId(e.target.value)}>{vintage.profiles.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
 <label htmlFor={`${uid}-reference`}>Vertailun lähtövuosi <select id={`${uid}-reference`} value={from} onChange={e=>setReference(Number(e.target.value))}>{availableReference.map(y=><option value={y} key={y}>{y}</option>)}</select></label>
 </div>
 <label className="hi-year" htmlFor={`${uid}-year`}>Esimerkkilaskelman vuosi {year}<input id={`${uid}-year`} type="range" min="2015" max="2025" step="1" value={year} aria-valuetext={String(year)} onChange={e=>chooseYear(Number(e.target.value))}/></label>
 <div className="hi-years">{years.map(y=><button type="button" key={y} aria-pressed={year===y} onClick={()=>chooseYear(y)}>{y}{y>=vintage.forecastFrom?' · ennustelaskelma':''}</button>)}</div>
 {context&&context.year!==year&&<p className="hi-note"><b>Yhteinen vuosi {context.year}:</b> julkaisussa ei ole esimerkkilaskelmaa tälle vuodelle. Näytetään laskentavuosi {year}; puuttuvia vuosia ei täytetä.</p>}
 <p className="hi-source"><b>{year>=vintage.forecastFrom?'Julkaisuhetken ennustelaskelma':'Retrospektiivinen esimerkkilaskelma'}</b> · oletukset {vintage.calculated} · <a href={`${vintage.url}#page=${profile.page}`}>Labore, liitetaulukko, s. {profile.page}</a>. Tämä on mallinnettu kotitalous, ei väestön toteutunut keskiarvo.</p>
 <h3>{profile.name}: {from} → {year}</h3><p>{profile.description}</p>
 {profileId==='earnings-unemployed'&&<p className="hi-assumption"><b>Päivärahan rajaus:</b> {vintage.earningsNote}</p>}
 <p>Kuukaudessa käytettävä nimellinen tulo muuttui laskelmassa {format(base.net)} eurosta {format(point.net)} euroon: <b>{signed(change.net)} €/kk ({signed(change.percent,1)} %)</b>. Verojen osuus bruttotulosta muuttui {format(base.taxShare,1)} prosentista {format(point.taxShare,1)} prosenttiin.</p>
 <div className="hi-chart"><svg viewBox="0 0 940 335" role="img" aria-label={`${profile.name}: tulon muutoksen erittely ${from}–${year}. Bruttotulo ${signed(change.gross)}, tulonsiirrot ${signed(change.transfers)}, verojen tulovaikutus ${signed(change.taxEffect)}, lopullinen muutos ${signed(change.net)} euroa kuukaudessa. Tarkat luvut taulukossa.`}>
 <text x="45" y="22">Nimellisen kuukausitulon muutos · €/kk</text>
 <line x1="45" x2="875" y1={wy(0)} y2={wy(0)} className="hi-zero"/>
 {waterfall.map((s,i)=>{const x=70+i*155;return <g key={s.label}><rect x={x} y={Math.min(wy(s.start),wy(s.end))} width="100" height={Math.max(2,Math.abs(wy(s.start)-wy(s.end)))} fill={s.value<0?palette.negative:palette.positive}/><text x={x+50} y={Math.min(wy(s.start),wy(s.end))-8} textAnchor="middle">{signed(s.value)}</text><text x={x+50} y="285" textAnchor="middle">{s.label}</text>{i<waterfall.length-1&&<line x1={x+100} x2={x+155} y1={wy(s.end)} y2={wy(s.end)} className="hi-connector"/>}</g>;})}
 <rect x="750" y={Math.min(wy(0),wy(change.net))} width="100" height={Math.max(2,Math.abs(wy(change.net)-wy(0)))} fill={palette.neutral}/><text x="800" y={Math.min(wy(0),wy(change.net))-8} textAnchor="middle">{signed(change.net)}</text><text x="800" y="285" textAnchor="middle">Muutos yhteensä</text>
 <text x="45" y="320">Positiivinen verojen vaikutus tarkoittaa maksettujen verojen vähenemistä.</text>
 </svg></div>
 <div className="hi-table"><table aria-label={`Esimerkkikotitalouden tulot ${from} ja ${year}`}><caption>Julkaisu {vintageId} · lähteen nimelliset, pyöristetyt €/kk</caption><thead><tr><th>Tuloerä</th><th>{from}</th><th>{year}</th><th>Muutos tuloon</th></tr></thead><tbody>
 {[['Bruttotulo',base.gross,point.gross,change.gross],['Lisätulonsiirrot',base.transfers,point.transfers,change.transfers],['Verot ja veronluonteiset maksut',base.taxes,point.taxes,change.taxEffect],['Käytettävissä oleva tulo',base.net,point.net,change.net]].map(([label,a,b,delta])=><tr key={String(label)}><th scope="row">{label}</th><td>{format(Number(a))}</td><td>{format(Number(b))}</td><td>{signed(Number(delta))}</td></tr>)}
 {change.rounding!==0&&<tr><th scope="row">Lähteen pyöristysten erotus</th><td>—</td><td>—</td><td>{signed(change.rounding)}</td></tr>}
 </tbody></table></div>
 <p className="hi-note">Etuudensaajan bruttotulo voi olla veronalainen etuus tai eläke. Bruttotulon muutos ei siis aina ole palkankorotus. Verovaikutus näytetään vähennysmerkkisenä, kun maksetut verot kasvavat. Laskelma sisältää myös ansio- ja indeksikehityksen oletuksia; erotus ei yksin ole hallituksen päätösvaikutus.</p>
 <h3>Eri kotitaloudet samassa vertailussa</h3>
 <label htmlFor={`${uid}-comparison`}>Kotitalouksien vertailun mittari <select id={`${uid}-comparison`} value={comparisonUnit} onChange={e=>setComparisonUnit(e.target.value as 'percent'|'euro')}><option value="percent">Nimellisen nettotulon muutos, %</option><option value="euro">Nimellisen nettotulon muutos, €/kk</option></select></label>
 <div className="hi-chart"><svg viewBox="0 0 960 455" role="img" aria-label={`Kahdeksan esimerkkikotitalouden nimellisen nettotulon muutos ${from}–${year}, julkaisu ${vintageId}. Tarkat luvut taulukossa.`}>
 <text x="300" y="23">{from} → {year} · {comparisonUnit==='percent'?'%':'€/kk'} · sama julkaisu</text><line x1="570" x2="570" y1="42" y2="405" className="hi-zero"/>
 {comparisons.map(({profile:p,change:c},i)=>{const v=comparisonUnit==='percent'?c.percent:c.net,width=Math.abs(v)/scale*250,cy=65+i*43;return <g key={p.id}><text x="20" y={cy+5} className={p.id===profileId?'hi-selected':''}>{p.name}</text><rect x={v<0?570-width:570} y={cy-12} width={Math.max(2,width)} height="24" fill={v<0?palette.negative:palette.positive}/><text x={v<0?570-width-8:570+width+8} y={cy+5} textAnchor={v<0?'end':'start'}>{signed(v,comparisonUnit==='percent'?1:0)}</text></g>;})}
 <text x="20" y="437">Kotitalouksien koko ja elämäntilanne eroavat; tämä ei ole väestöryhmien keskiarvovertailu.</text>
 </svg></div>
 <div className="hi-table"><table aria-label={`Kotitalouksien nettotulon muutokset ${from}–${year}`}><thead><tr><th>Esimerkki</th><th>Muutos €/kk</th><th>Muutos %</th><th>Lähde</th></tr></thead><tbody>{comparisons.map(({profile:p,change:c})=><tr key={p.id}><th scope="row"><button type="button" onClick={()=>setProfileId(p.id)}>{p.name}</button></th><td>{signed(c.net)}</td><td>{signed(c.percent,1)}</td><td><a href={`${vintage.url}#page=${p.page}`}>s. {p.page}</a></td></tr>)}</tbody></table></div>
 <p className="hi-note">Euromäärä kertoo kotitalouden kuukausitulosta. Prosenttimuutos suhteutetaan saman esimerkin lähtötuloon. Kuluttajahintoja, palvelumaksuja ja kaikkia elinkustannuksia ei vähennetä tästä nimellisestä tulomittarista; ostovoima voi muuttua eri tavalla.</p>
 <details><summary>Mitä yhteisvaikutus tekee pienipalkkaisen työn kannustimille?</summary>
 <p>Kelan 25.4.2024 esimerkkilaskelmassa yksinhuoltajan toimeentulotukioikeuden palkkaraja oli ilman muutoksia noin 150 €/kk ja muutosten jälkeen noin 1 050 €/kk. Esimerkin 1 000 euron palkkatulolla efektiivinen työllistymisveroaste oli noin 85 % toimeentulotuki huomioiden.</p>
 <p>Silloin 1 000 euron bruttolisästä jäi laskennallisesti noin <b>150 euroa</b> lisää käytettäväksi; noin 850 euroa vastasi verojen ja pienenevien etuuksien yhteisvaikutusta. Tämä on työttömyydestä työhön siirtymisen vertailu, ei seuraavan ansaitun euron marginaaliveroprosentti.</p>
 <p>Laskelma koskee tiettyä helsinkiläistä yksinhuoltajaa. Toimeentulotuki voi suojata minimituloa samalla kun lisäansioiden vaikutus käytettävissä olevaan tuloon pienenee. <a href={impactSources.kela}>Kelan laskelman asetelma ja rajaukset</a>.</p>
 </details>
 <h3>Väestötason tutkimus: miten oletus muuttaa tulosta?</h3>
 <p>Kärkkäisen ja Tervolan vuoden 2018 tutkimuksessa joulukuun 2015 ja 2018 säännöt simuloitiin samassa vuoden 2015 väestöaineistossa. Valitse tutkimuksen oma vertailutapa ja työn tarjonnan jousto. Nämä ovat vaihtoehtoisia malliarvioita.</p>
 <div className="hi-controls"><label htmlFor={`${uid}-variant`}>Politiikkamuutoksen rajaus <select id={`${uid}-variant`} value={variant} onChange={e=>setVariant(e.target.value as DistributionVariant)}><option value="A">A: suhteessa hintatasoon</option><option value="B">B: aktiivisiksi tulkitut päätökset</option></select></label>
 <label htmlFor={`${uid}-elasticity`}>Työllistymisen oletus <select id={`${uid}-elasticity`} value={elasticity} onChange={e=>setElasticity(e.target.value as DistributionElasticity)}><option value="0">Staattinen: ei käyttäytymismuutosta</option><option value="0.1">Jousto 0,10</option><option value="0.25">Tutkimuksen oletusjousto 0,25</option><option value="0.5">Herkkyystarkastelu: jousto 0,50</option></select></label></div>
 <div className="hi-chart"><svg viewBox="0 0 960 280" role="img" aria-label={`Vuosien 2015–2018 tutkimuksen ${variant}-vaihtoehto, jousto ${elasticity}. Tulonjakomittareiden arvioidut muutokset prosenttiyksikköinä. Tarkat lähtö- ja loppuarvot taulukossa.`}>
 <text x="375" y="22">Arvioitu muutos · prosenttiyksikköä</text><line x1="555" x2="555" y1="42" y2="230" className="hi-zero"/>
 {distribution2018.metrics.map((m,i)=>{const v=changes[i]!,width=Math.abs(v)/2*230,cy=65+i*48;return <g key={m.id}><text x="20" y={cy+5}>{m.name}</text><rect x={v<0?555-width:555} y={cy-11} width={Math.max(2,width)} height="23" fill={v<0?palette.positive:palette.negative}/><text x={v<0?555-width-8:555+width+8} y={cy+5} textAnchor={v<0?'end':'start'}>{signed(v,1)}</text></g>;})}
 <text x="20" y="261">Negatiivinen muutos: tuloero tai suhteellinen pienituloisuus pienenee.</text>
 </svg></div>
 <div className="hi-table"><table aria-label="Vuoden 2018 tutkimuksen tulonjakoarvio"><caption>Taulukko 5 · vaihtoehto {variant} · jousto {elasticity}</caption><thead><tr><th>Mittari</th><th>Lähtötaso</th><th>Muutos, %-yks.</th><th>Arvioitu lopputaso</th></tr></thead><tbody>{distribution2018.metrics.map((m,i)=><tr key={m.id}><th scope="row">{m.name}</th><td>{format(distribution.base[i]!,1)}</td><td>{signed(changes[i]!,1)}</td><td>{format(distribution.base[i]!+changes[i]!,1)}</td></tr>)}</tbody></table></div>
 <p className="hi-note">A huomioi muutokset suhteessa hintatasoon. B vertaa hallituksen aloitteesta tehdyiksi tulkittuja päätöksiä tilanteeseen ilman niitä; siinä kunnallisverojen ja sosiaalivakuutusmaksujen muutokset rajataan pois. Työllisyyttä arvioidaan työn tarjonnan kautta. Työn kysyntää ja työpaikkojen saatavuutta ei mallinneta.</p>
 <p className="hi-note">Työllisyysoletus voi nostaa mediaanituloa ja siten suhteellisen pienituloisuuden rajaa. Yli 65-vuotiaiden pienituloisuusaste voi siksi nousta, vaikka ryhmän tulot eivät laskisi. Aktiivimalli, palvelumaksut ja lääkekorvaukset eivät sisälly tähän yhteislaskelmaan. <a href={`${distribution2018.source}#page=21`}>Tutkimuksen taulukko 5 ja menetelmät</a>.</p>
 <details><summary>Lähteet ja laskelmien lukutapa</summary><p>Esimerkkiperheiden julkaisut ovat Laboren mallilaskelmia. Julkaisuvuotta vaihtamalla vaihtuvat myös ansio-, hinta- ja sääntöoletukset; laskelmien välisiä muutoksia ei käytetä päätösvaikutusten mittarina. Näkymä ei korvaa SISU-mallia tai henkilökohtaista etuuslaskuria.</p>
 <p>Tulon erittely on bruttotulo + lisätulonsiirrot − verot ja maksut. Lähteen kuukausiluvut on pyöristetty erikseen. Kahden vuoden vertailuun jäävä pyöristyserotus näytetään omana eränään. Muutoksia lasketaan vain saman julkaisun ja esimerkin välillä. Puuttuvia vuosia ei interpoloida.</p>
 <p>Väestötason tutkimuksen tulokset ovat laskennallisia sääntömuutosten vaikutuksia. Niitä ei yhdistetä esimerkkitalouksien euromääriin tai havaittuun Gini-vuosisarjaan. <a href={householdVintages[0]!.web}>Labore 2024</a> · <a href={householdVintages[1]!.web}>Labore 2025</a> · <a href={distribution2018.source}>Kärkkäinen ja Tervola 2018</a> · <a href={impactSources.thl}>THL:n tutkijan aktiivimalliarvio 2019</a> · <a href={impactSources.kela}>Kela 2024</a>.</p>
 <p>Yhteiseen aikajanaan on liitetty julkaisujen ajoitus. Julkaisuvuosi ja arvioitu vaikutusvuosi erotetaan. Aineisto tarkistettu 14.10.2026.</p></details>
 <div className="hi-events">{householdImpactEvents.map(e=><button type="button" key={e.id} onClick={()=>{setEventId(e.id);chooseYear(e.year);}}>{e.year} · {e.title}</button>)}</div>
 {event&&<article aria-live="polite"><h4>{event.title}</h4><p><b>{event.kind}</b></p><p>{event.text}</p><a href={event.url}>Tarkista vaikutusarvion lähde</a></article>}
 </section>;
}
