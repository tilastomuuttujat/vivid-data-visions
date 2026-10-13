import { useId, useState } from 'react';
import raw from '@/data/anchors.json';
import './transition-path.css';
interface Anchor { id: string; title: string; steps: { title: string; period: string; explanation: string; evidence_note?: string | null; source_ids?: string[] | null }[]; sources: { id: string; title: string; url: string }[] }
const anchors = (raw as unknown as { anchors: Anchor[] }).anchors;
export const transitionTracks = [
  { name: 'Työ', anchor: 'ruotsiin-muutto-ja-perheiden-arki', step: 0, start: 1969, end: 1969, question: 'Työ löytyi tässä kertomuksessa. Miten koko perheen mahdollisuudet järjestyivät?' },
  { name: 'Asuminen', anchor: 'ruotsiin-muutto-ja-perheiden-arki', step: 1, start: 1969, end: 1974, question: 'Työnantajan asunto auttoi asettumaan; kasvavan perheen koti järjestyi myöhemmin toista reittiä.' },
  { name: 'Osaaminen', anchor: 'peruskoulu-uudistus', step: 2, start: 1972, end: 1977, question: 'Peruskoulu laajeni vaiheittain. Tämä ei ole näyttö Aron perheen koulutuksesta tai aikuisen uudelleenkoulutuksesta.' },
  { name: 'Lastenhoito', anchor: 'ruotsiin-muutto-ja-perheiden-arki', step: 3, start: 1974, end: 1974, question: 'Suomenkielisen hoitajan löytyminen liittyi uuteen muuttoon. Järjestäjä ja kuntien tarjonta jäävät avoimiksi.' },
];
export function TransitionPath() {
  const [selected, setSelected] = useState(0);
  const [context, setContext] = useState(false);
  const uid = useId();
  const track = transitionTracks[selected]!;
  const anchor = anchors.find(a => a.id === track.anchor);
  const step = anchor?.steps[track.step];
  const x = (year: number) => 140 + (year - 1950) / 27 * 600;
  return <section className="tp" aria-labelledby={`${uid}-title`}>
    <p className="v-kicker">Siirtymän edellytykset · 1950–1975, koulun toteutus vuoteen 1977</p>
    <h2 id={`${uid}-title`}>Työ löytyi. Milloin arki tuli mukaan?</h2>
    <p>Maataloudesta teolliseen palkkatyöhön siirtymistä tarkastellaan työn, kodin, osaamisen ja hoivan kautta. Meeri Aron perhemuisto antaa yhden konkreettisen polun; peruskoulu on erillinen yhteiskunnallinen rinnakkaiskehitys.</p>
    <svg viewBox="0 0 810 350" role="img" aria-label="Työn, asumisen, osaamisen ja lastenhoidon rinnakkaiset ajoitukset. Tarkastele rivejä alla olevista painikkeista.">
      {[1950,1960,1969,1974,1977].map(year => <g key={year}><line x1={x(year)} x2={x(year)} y1="30" y2="290" className="tp-grid"/><text x={x(year)} y="325" textAnchor="middle">{year}</text></g>)}
      {transitionTracks.map((t,i) => <g key={t.name} opacity={selected === i ? 1 : .5}><text x="120" y={65 + i*65} textAnchor="end">{t.name}</text><line x1={x(t.start)} x2={x(t.end)} y1={60+i*65} y2={60+i*65} className={i === 2 ? 'tp-span context' : 'tp-span'} /><circle cx={x(t.start)} cy={60+i*65} r="6" className="tp-point"/>{t.start !== t.end && <circle cx={x(t.end)} cy={60+i*65} r="6" className="tp-point"/>}</g>)}
    </svg>
    <p className="tp-note">Viiva näyttää lähdevaiheen tarkasteluvälin, ei palvelun jatkuvaa saatavuutta. Asuntojen vaihtojen tarkkoja vuosia ei tunneta. Katkoviiva on erillinen koulutuskehitys, ei tämän perheen seuranta. Rivien korkeudet eivät mittaa onnistumista.</p>
    <div className="tp-buttons" aria-label="Valitse siirtymän edellytys">{transitionTracks.map((t,i) => <button key={t.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>{t.name}</button>)}</div>
    <div aria-live="polite"><h3>{track.name}: {step?.period}</h3><p className="tp-question">{track.question}</p>{step && <><h4>{step.title}</h4><p>{step.explanation}</p><details><summary>Näyttö ja lähteet</summary><p>{step.evidence_note}</p><ul>{anchor?.sources.filter(s => step.source_ids?.includes(s.id)).map(s => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ul></details></>}</div>
    <button className="tp-context" aria-expanded={context} onClick={() => setContext(v => !v)}>Avaa lähtöalueen ja palvelujen rinnakkaiset kysymykset</button>
    {context && <div><p><b>Lähtöalue:</b> asuttamisen aineisto dokumentoi maan ja rakentamisen järjestelyjä, mutta ei osoita myöhempää muuttoa ratkaisun epäonnistumiseksi.</p><p><b>Palvelut:</b> Suomen päivähoitolaki 1973 ja Ruotsin perhemuisto ovat eri lähteitä ja eri maita. Päätös ei yksin osoita jokaisen perheen saamaa hoitoa.</p>{['asuttaminen-ja-jalleenrakennus-1945-1955','paivahoito-ja-naisten-palkkatyo'].map(id => {const a = anchors.find(a => a.id === id);return a && <details key={id}><summary>{a.title}</summary>{a.steps.slice(0,2).map((s,i) => <div key={i}><p>{s.explanation}</p><p className="tp-note">{s.evidence_note}</p><ul>{a.sources.filter(source => s.source_ids?.includes(source.id)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></div>)}</details>;})}</div>}
    <p><b>Koeteltava mekanismi:</b> uusi työmahdollisuus tarvitsee täydentäviä edellytyksiä. Tarkastele, mikä järjestyi, mikä johti uuteen ratkaisuun ja mitä lähteet eivät kerro. Tämä näkymä ei luokittele muuttajia onnistujiksi ja epäonnistujiksi eikä mittaa siirtymien yleisyyttä.</p>
  </section>;
}
