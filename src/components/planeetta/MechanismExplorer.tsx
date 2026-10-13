import { useId, useState } from 'react';
import anchorSource from '@/data/anchors.json';
import { explanationModels } from './mechanism-models';
import './mechanism-explorer.css';

interface CaseStep { title: string; explanation: string; period: string; evidence_note?: string | null; alternative?: string | null; source_ids?: string[] | null }
interface Case { id: string; title: string; steps: CaseStep[]; sources: { id: string; title: string; url: string }[] }
const cases = (anchorSource as unknown as { anchors: Case[] }).anchors;

function CaseEvidence({ anchor }: { anchor: Case }) {
  const [index, setIndex] = useState(0);
  const step = anchor.steps[index];
  const label = useId();
  if (!step) return <p>Tapauksessa ei ole vaiheita.</p>;
  return <article className="mx-case">
    <h4>{anchor.title}</h4>
    <label htmlFor={label}>Tarkasteltava vaihe</label>
    <select id={label} value={index} onChange={e => setIndex(Number(e.target.value))}>{anchor.steps.map((s, i) => <option value={i} key={i}>{s.period} · {s.title}</option>)}</select>
    <p>{step.explanation}</p>
    <details><summary>Lähteet, rajaukset ja vaihtoehdot</summary>
      <p>{step.evidence_note || 'Tämän vaiheen näytön rajauksia ei ole kirjattu.'}</p>
      <p><b>Vaihtoehtoinen selitys:</b> {step.alternative || 'Ei kirjattua vaihtoehtoa; tämä ei sulje vaihtoehtoja pois.'}</p>
      <ul>{anchor.sources.filter(s => step.source_ids?.includes(s.id)).map(s => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ul>
    </details>
  </article>;
}

export function MechanismExplorer() {
  const [modelId, setModelId] = useState(explanationModels[0]!.id);
  const [explain, setExplain] = useState(true);
  const [node, setNode] = useState(0);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [notes, setNotes] = useState('');
  const uid = useId();
  const model = explanationModels.find(m => m.id === modelId)!;
  const candidates = model.anchors.map(id => cases.find(c => c.id === id)).filter((c): c is Case => Boolean(c));
  const first = cases.find(c => c.id === left) || candidates[0];
  const second = cases.find(c => c.id === right) || candidates[1];
  const feedback = model.id === 'feedback';
  const fork = model.id === 'costs' || model.id === 'inheritance';
  const positions = fork ? [[160, 155], [440, 75], [440, 235]] : [[130, 130], [350, 130], [570, 130]];
  return <section className="mx" aria-labelledby={`${uid}-heading`}>
    <p className="v-kicker">Selitysmallien laboratorio</p>
    <h2 id={`${uid}-heading`}>Tarinasta järjestelmän kysymykseen</h2>
    <p>Valitse ehdollinen selitysmalli ja vertaa tapauksia. Malliin liitetyt tapaukset ovat tutkimisen lähtökohtia, eivät todiste siitä, että mekanismi toimii kaikissa niissä.</p>
    <div className="mx-models" aria-label="Valitse selitysmalli">{explanationModels.map(m => <button key={m.id} aria-pressed={modelId === m.id} onClick={() => { setModelId(m.id); setNode(0); setLeft(''); setRight(''); }}>{m.title}</button>)}</div>
    <div className="mx-toolbar"><label><input type="checkbox" checked={explain} onChange={e => setExplain(e.target.checked)} />Näytä ehdotettu selityskerros</label><span>Katkoviiva = tutkittava yhteys</span></div>
    <h3>{model.question}</h3>
    {explain && <>
      <svg viewBox="0 0 700 310" role="img" aria-label={`${model.title}: ${model.nodes.join(' → ')}. Yhteydet ovat hypoteeseja.`}>
        <defs><marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor" /></marker></defs>
        {(fork ? [[0, 1], [0, 2]] : [[0, 1], [1, 2]]).map(([a, b], i) => { const p = positions[a!]!, q = positions[b!]!; return <path key={i} d={`M${p[0]! + 78} ${p[1]} L${q[0]! - 78} ${q[1]}`} className="mx-edge" markerEnd={`url(#${uid}-arrow)`} />; })}
        {feedback && <path d="M570 165 Q350 295 130 165" className="mx-edge" markerEnd={`url(#${uid}-arrow)`} />}
        {model.nodes.map((label, i) => <g key={label}><rect x={positions[i]![0]! - 80} y={positions[i]![1]! - 32} width="160" height="64" rx="12" className={node === i ? 'mx-node selected' : 'mx-node'} /><text x={positions[i]![0]} y={positions[i]![1]} textAnchor="middle" dominantBaseline="middle">{label}</text></g>)}
      </svg>
      <div className="mx-lenses" aria-label="Tarkastelukohta">{model.nodes.map((label, i) => <button key={label} aria-pressed={node === i} onClick={() => setNode(i)}>{label}</button>)}</div>
      <p className="mx-prompt"><b>{model.nodes[node]}:</b> {node === 0 ? 'Kuka toimi, missä oloissa ja mitä vaihtoehtoja oli?' : node === 1 ? 'Mikä yhteys on osoitettu ja mikä välivaihe jää avoimeksi?' : 'Kenelle seuraus kohdistui, milloin ja miten se havaittiin?'}</p>
      <div className="mx-three"><article><h4>Toimintaehto</h4><p>{model.condition}</p></article><article><h4>Vaihtoehtoinen selitys</h4><p>{model.alternative}</p></article><article><h4>Mikä koettelisi mallia?</h4><p>{model.challenge}</p></article></div>
    </>}
    {!explain && <p className="mx-prompt">Selityskerros on piilotettu. Tutki ensin tapausten kuvauksia ja lähderajoja ja muodosta oma kysymyksesi.</p>}
    <h3>Vertaa kahta tapausta</h3>
    <p>Avaa lähderajaukset: tapauskuvauksissakin voi olla kirjoittajan tulkintoja. Eri kohdejoukkoja ja aikakausia ei oleteta yhteismitallisiksi.</p>
    <div className="mx-compare">{[first, second].map((a, i) => <div key={i}><label htmlFor={`${uid}-case-${i}`}>Tapaus {i + 1}</label><select id={`${uid}-case-${i}`} value={a?.id || ''} onChange={e => (i === 0 ? setLeft : setRight)(e.target.value)}>{cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>{a && <CaseEvidence key={a.id} anchor={a} />}</div>)}</div>
    <label htmlFor={`${uid}-notes`}>Oma päätelmä: mikä toistuu, mikä eroaa ja mitä pitäisi vielä tietää?</label>
    <textarea id={`${uid}-notes`} rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kirjaa oma tulkintasi ja havainto, joka voisi muuttaa sitä…" />
    <p className="mx-foot">Muistiinpano säilyy tämän näkymän käytön ajan. Kaaviot kuvaavat käsitteellisiä suhteita; ne eivät laske vaikutuksia tai aseta malleja paremmuusjärjestykseen.</p>
  </section>;
}
