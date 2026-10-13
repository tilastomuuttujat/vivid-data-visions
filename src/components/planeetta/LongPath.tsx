import { useId, useState } from 'react';
import raw from '@/data/anchors.json';
import { longPath } from './long-path-data';
import './long-path.css';
interface Anchor { id: string; title: string; steps: { title: string; period: string; explanation: string; evidence_note?: string | null; source_ids?: string[] | null }[]; sources: { id: string; title: string; url: string }[] }
const anchors = (raw as unknown as { anchors: Anchor[] }).anchors;
const colors = ['#68dfd4', '#ffba86', '#c9a9fa'];
export function LongPath() {
  const [index, setIndex] = useState(0);
  const [track, setTrack] = useState(0);
  const [caseId, setCaseId] = useState('');
  const uid = useId();
  const phase = longPath[index]!;
  const linked = phase.anchors.map(id => anchors.find(a => a.id === id)).filter((a): a is Anchor => Boolean(a));
  const active = linked.find(a => a.id === caseId) || linked[0];
  const labels = ['Tuotannon perusta', 'Ihmisten toimeentulo', 'Omistus ja päätösvalta'];
  const x = (year: number) => 100 + (year - 1850) / 175 * 750;
  // Positions encode three reading perspectives only, never measured distance or magnitude.
  const y = (i: number, t: number) => 95 + t * 90 + Math.sin(i * 1.3 + t) * 20;
  return <section className="lp" aria-labelledby={`${uid}-title`}>
    <p className="v-kicker">Pitkä pääpolku · 1800-luvulta nykyhetkeen</p>
    <h2 id={`${uid}-title`}>Tuotanto muuttuu. Kulkeeko toimeentulo mukana?</h2>
    <p>Seuraa kolmea rinnakkaista juonta. Aiemmat kerrokset säilyvät: teollisuus ei poista maataloutta eikä digitalisaatio rajoitu tietotyöhön.</p>
    <div className="lp-tracks">{labels.map((label, i) => <button key={label} aria-pressed={track === i} style={{ color: colors[i] }} onClick={() => setTrack(i)}>{label}</button>)}</div>
    <svg viewBox="0 0 950 410" role="img" aria-label="Tuotannon, toimeentulon ja päätösvallan rinnakkaiset lukupolut 1850–2025. Käytä alla olevia aikakausipainikkeita.">
      {[1850, 1900, 1950, 2000, 2025].map(year => <g key={year}><line x1={x(year)} x2={x(year)} y1="40" y2="360" className="lp-grid" /><text x={x(year)} y="390" textAnchor="middle">{year}</text></g>)}
      <line x1={x(phase.year)} x2={x(phase.year)} y1="40" y2="360" className="lp-now" />
      {labels.map((label, t) => <g key={label} opacity={track === t ? 1 : .3} style={{ color: colors[t] }}><path d={longPath.map((p, i) => `${i ? 'L' : 'M'}${x(p.year)},${y(i,t)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={track === t ? 5 : 3} />{longPath.map((p,i) => <circle key={p.year} cx={x(p.year)} cy={y(i,t)} r={index === i ? 9 : 5} fill="currentColor" />)}</g>)}
    </svg>
    <p className="lp-note">Viivojen sijainti, välimatkat ja leveys eivät ole mittauksia. Vuodet ovat lukureitin kiinnekohtia; kaudet menevät päällekkäin.</p>
    <div className="lp-periods" aria-label="Valitse aikakausi">{longPath.map((p,i) => <button key={p.year} aria-pressed={index === i} onClick={() => {setIndex(i); setCaseId('');}}>{p.period}<span>{p.title}</span></button>)}</div>
    <div aria-live="polite"><h3>{phase.title}</h3><p className="lp-focus"><b>{labels[track]}:</b> {[phase.production, phase.livelihood, phase.power][track]}</p><h4>{phase.question}</h4><p><b>Mahdollinen mekanismi:</b> {phase.mechanism}</p><p><b>Toinen tulkinta tai rajaus:</b> {phase.alternative}</p></div>
    <h3>Tarkista yhteys tarinasta</h3>
    <label htmlFor={`${uid}-case`}>Ankkuritapaus</label><select id={`${uid}-case`} value={active?.id || ''} onChange={e => setCaseId(e.target.value)}>{linked.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
    {active && <div className="lp-evidence"><h4>{active.title}</h4>{active.steps.map((s,i) => <details key={i}><summary>{s.period} · {s.title}</summary><p>{s.explanation}</p><p><b>Näytön raja:</b> {s.evidence_note || 'Ei kirjattua näyttörajausta.'}</p><ul>{active.sources.filter(source => s.source_ids?.includes(source.id)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>)}</div>}
    <p className="lp-note">Pääpolku on toimituksellinen tutkimuskehys. Tapausten lähteet tukevat niiden rajattuja havaintoja, eivät yhtä koko historian syyselitystä. Alustoihin ja tekoälyyn liittyvät mekanismit ovat avoimia tutkimuskysymyksiä; valitut tapaukset eivät osoita niiden vaikutuksia.</p>
  </section>;
}
