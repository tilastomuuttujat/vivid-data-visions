import { useId, useState } from 'react';
import { useLinkedYear, TimelineCoverage } from './timeline-context';
import { laws, lawThemes, lawEventYears } from './law-history';
import { LawDetails } from './LawDetails';
import './law-timeline.css';
const x=(year:number)=>220+(year-1850)/175*640;
export function LawTimeline(){
 const uid=useId();const [theme,setTheme]=useState('Kaikki');const [selectedId,setSelectedId]=useState('income-tax-1992');
 const [year,setYear]=useLinkedYear(1992,{min:1850,max:2025,observed:lawEventYears});
 const shown=laws.filter(l=>theme==='Kaikki'||l.theme===theme);
 const matches=shown.filter(l=>l.enacted===year||l.entryYear===year);
 const selected=matches.find(l=>l.id===selectedId)??matches[0];
 return <section className="law-timeline" aria-labelledby={`${uid}-title`}>
 <p className="v-kicker">Lainsäädäntö ja yhteiskunnan suunta · kehys 1850–2025</p><h2 id={`${uid}-title`}>Mitä lait muuttivat — ja keiden asemaa?</h2>
 <p>Tässä on yhdeksän valikoitua säädöstä viideltä polulta. Kyse ei ole kaikkien keskeisten lakien tai lakimuutosten täydellisestä luettelosta. Pisteen väri kertoo aiheesta, ei vaikutuksen suuruudesta tai puolueesta.</p>
 <TimelineCoverage year={year} label="Säädöksen anto- tai voimaantulohavainto"/>
 <label htmlFor={`${uid}-theme`}>Lakipolku <select id={`${uid}-theme`} value={theme} onChange={e=>setTheme(e.target.value)}>{['Kaikki',...lawThemes].map(t=><option key={t}>{t}</option>)}</select></label>
 <div className="law-chart"><svg viewBox="0 0 960 430" role="img" aria-label="Valikoitujen säädösten aikajana 1850–2025 viidellä polulla. Täytetty piste: säädös annettu; avoin piste: varmennettu voimaantulovuosi. Näitä yhdistävä viiva ei mittaa vaikutuksen kestoa. Tapahtumat valitaan painikkeista.">
 {[1850,1900,1950,2000,2025].map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1="35" y2="365" className="law-grid"/><text x={x(v)} y="22" textAnchor="middle">{v}</text></g>)}
 <line x1={x(year)} x2={x(year)} y1="35" y2="365" className="law-cursor"/>
 {lawThemes.map((t,i)=><g key={t}><text x="205" y={80+i*65} textAnchor="end">{t}</text><line x1="220" x2="860" y1={75+i*65} y2={75+i*65} className="law-grid"/>
 {shown.filter(l=>l.theme===t).map(l=><g key={l.id} style={{color:['#acd680','#ffad83','#65d9ec','#d5a4f1','#ffd57c'][i]}}>
 {l.entryYear!==null&&l.entryYear!==l.enacted&&<line x1={x(l.enacted)} x2={x(l.entryYear)} y1={75+i*65} y2={75+i*65} stroke="currentColor" strokeWidth="3"/>}
 <circle cx={x(l.enacted)} cy={75+i*65} r={selected?.id===l.id?8:5} fill="currentColor"><title>{l.enacted}: {l.title}, annettu</title></circle>
 {l.entryYear!==null&&<circle cx={x(l.entryYear)} cy={87+i*65} r="5" fill="#18232c" stroke="currentColor" strokeWidth="2"><title>{l.entryYear}: {l.title}, voimaantulo</title></circle>}
 </g>)}
 </g>)}
 <text x="220" y="395">Täytetty: annettu · Avoin: voimaantulovuosi</text><text x="220" y="419">Voimaantulotietoa ei piirretä, jos sitä ei ole varmennettu.</text>
 </svg></div>
 <p>Ajallinen aukko ei tarkoita lainsäädännön puuttumista. Tämän koonnin ensimmäinen säädös on vuodelta 1866 ja viimeisin vuodelta 2021; vuoden 2025 kehys ei tarkoita, että siihen asti tehdyt muutokset olisi kaikki tarkistettu.</p>
 <div className="law-buttons" aria-label="Valitse säädös">{shown.map(l=><button key={l.id} type="button" aria-pressed={selected?.id===l.id} onClick={()=>{setSelectedId(l.id);setYear(l.enacted);}}>{l.enacted} · {l.title}<small>{l.number}</small></button>)}</div>
 <div aria-live="polite">{selected?<><p><b>Kohdistusvuosi {year}:</b> {selected.enacted===year&&selected.entryYear===year?'anto- ja voimaantulovuosi':selected.enacted===year?'säädöksen antovuosi':'voimaantulovuosi'}. Samalle vuodelle voi olla useita säädöksiä.</p><LawDetails id={selected.id}/></>:<p>Tälle kohdistusvuodelle ei ole valitussa lakipolussa tapahtumaa. Valitse säädös painikkeista.</p>}</div>
 <details><summary>Ministeripäivät ja lakien tekijät</summary><p>Ministeripäivien osuudet kuvaavat hallitustyöhön osallistumisen kestoa. Ne eivät suoraan osoita lain valmistelijaa, eduskunnan kannatusta tai vaikutusta. Tähän näkymään ei ole vielä tuotu tarkistettua ministeripäiväaineistoa eikä kuvan prosentteja jäljennetty.</p><p>Seuraava aineistokerros tarvitsee ministerin tehtäväkauden, puolueen kyseisenä aikana ja ministeriön. Saman henkilön samanaikaisia nimikkeitä ei saa vahingossa moninkertaistaa. Valmistelu, lain antaminen ja toimeenpano yhdistetään omiin ajankohtiinsa. Ennen itsenäisyyttä senaatin ja säätyjen järjestelmä käsitellään erillisenä.</p><p><a href="https://valtioneuvosto.fi/hallitukset-ja-ministerit/ministerit">Valtioneuvosto: ministerit ja ministeripäivät</a> · <a href="https://valtioneuvosto.fi/hallitukset-ja-ministerit/ministerit-ministerioittain">Ministerikohtaiset tehtäväkaudet</a></p></details>
 </section>;
}
