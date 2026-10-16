import { useState } from 'react';
import { ROOT_PATHS, KIND_TXT, stepDecisions, type RootKind } from './juurisyyt-model';

export function Juurisyyt() {
  const [filter, setFilter] = useState<RootKind | 'all'>('all');
  const [sel, setSel] = useState(ROOT_PATHS[0]!.id);
  const [open, setOpen] = useState<string | null>(null);
  const path = ROOT_PATHS.find((p) => p.id === sel)!;
  const shown = ROOT_PATHS.filter((p) => filter === 'all' || p.kind === filter);

  return (
    <section className="j-root" aria-label="Käänteinen polkumalli">
      <div className="j-head">
        <h2>Jäljitä juurisyy</h2>
        <p>Valitse nykytilan ilmiö — polku kulkee taaksepäin päätösten ja viiveiden kautta.</p>
        <div className="m-legend">
          {(['all', 'vinouma', 'heikkous', 'vahvuus'] as const).map((k) => (
            <button key={k} className={`m-chip j-k-${k}${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}><i />{k === 'all' ? 'Kaikki' : KIND_TXT[k]}</button>
          ))}
        </div>
      </div>

      <div className="j-cards">
        {shown.map((p) => (
          <button key={p.id} className={`j-card j-k-${p.kind}${p.id === sel ? ' on' : ''}`} onClick={() => { setSel(p.id); setOpen(null); }}>
            <em>{KIND_TXT[p.kind]}</em><strong>{p.title}</strong>
          </button>
        ))}
      </div>

      <div className={`j-path j-k-${path.kind}`}>
        <div className="j-now">
          <span className="j-era">Nyt · 2026</span>
          <h3>{path.title}</h3>
          <p>{path.now}</p>
          <p className="j-q">{path.question}</p>
        </div>
        <ol className="j-steps">
          {path.steps.map((s, i) => (
            <li key={s.era} className="j-step">
              <div className="j-lag">{s.lag && <span>↑ {s.lag}</span>}</div>
              <div className="j-body">
                <span className="j-era">Askel {i + 1} · {s.era}</span>
                <h4>{s.title}</h4>
                <p>{s.mechanism}</p>
                <ul className="j-laws">
                  {stepDecisions(s).map((d) => (
                    <li key={d.id}>
                      <button onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id}>
                        <b>{d.aika}</b> {d.paatos}
                      </button>
                      {open === d.id && (
                        <div className="j-law-body">
                          {d.metatarina && <p><b>Merkitys.</b> {d.metatarina}</p>}
                          {d.riskinjako && <p><b>Riskinjako.</b> {d.riskinjako}</p>}
                          {d.toimeenpano && <p><b>Toimeenpano.</b> {d.toimeenpano}</p>}
                          {d.lahdelinkki && <p><a href={d.lahdelinkki} target="_blank" rel="noreferrer">{d.lahde || 'Lähde'}</a></p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        <p className="j-note">Polku on tulkinnallinen prosessijäljitys: se osoittaa mahdollisia vaikutusketjuja, ei todistettuja syy-yhteyksiä.</p>
      </div>
    </section>
  );
}
