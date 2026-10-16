import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ROOT_PATHS, KIND_TXT, stepDecisions, type RootKind } from "./juurisyyt-model";
import { PolkuAikajana } from "./PolkuAikajana";

export function Juurisyyt({ onDecision }: { onDecision?: (id: string) => void } = {}) {
  const [filter, setFilter] = useState<RootKind | "all">("all");
  const [sel, setSel] = useState(ROOT_PATHS[0]!.id);
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"kortit" | "aikajana" | "risteys">("kortit");
  const [multi, setMulti] = useState<string[]>(["syntyvyys", "asunto", "hoiva"].filter((id) => ROOT_PATHS.some((p) => p.id === id)));
  const path = ROOT_PATHS.find((p) => p.id === sel)!;
  const shown = ROOT_PATHS.filter((p) => filter === "all" || p.kind === filter);
  const selectFilter = (kind: RootKind | "all") => {
    setFilter(kind);
    if (kind !== "all" && path.kind !== kind) {
      setSel(ROOT_PATHS.find((p) => p.kind === kind)!.id);
      setOpen(null);
    }
  };

  return (
    <section className="j-root" aria-label="Käänteinen polkumalli">
      <div className="j-head">
        <h2>Jäljitä juurisyy</h2>
        <p>Valitse nykytilan ilmiö — polku kulkee taaksepäin päätösten ja viiveiden kautta.</p>
        <p>
          Polut ovat toimituksellisia selitysehdotuksia. Päätöksen lähde todentaa päätöstä;
          vaikutusketju ja sen viive tarvitsevat erillistä näyttöä.
        </p>
        <div className="m-legend">
          {(["all", "vinouma", "heikkous", "vahvuus"] as const).map((k) => (
            <button
              key={k}
              aria-pressed={filter === k}
              className={`m-chip j-k-${k}${filter === k ? " on" : ""}`}
              onClick={() => selectFilter(k)}
            >
              <i />
              {k === "all" ? "Kaikki" : KIND_TXT[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="m-mode j-view" role="tablist" aria-label="Näkymä">
        {([
          ["kortit", "Kortit"],
          ["aikajana", "Aikajanapolku"],
          ["risteys", "Risteävät polut"],
        ] as const).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
            {l}
          </button>
        ))}
      </div>
      {view === "risteys" && <p className="j-hint">Valitse 2–4 ilmiötä. Yhteiset päätökset näkyvät risteyskohtina.</p>}

      <div className="j-cards">
        {shown.map((p) => {
          const on = view === "risteys" ? multi.includes(p.id) : p.id === sel;
          return (
            <button
              key={p.id}
              aria-pressed={on}
              className={`j-card j-k-${p.kind}${on ? " on" : ""}`}
              onClick={() => {
                if (view === "risteys") {
                  setMulti(multi.includes(p.id) ? multi.filter((m) => m !== p.id) : [...multi, p.id].slice(-4));
                } else {
                  setSel(p.id);
                  setOpen(null);
                }
              }}
            >
              <em>{KIND_TXT[p.kind]}</em>
              <strong>{p.title}</strong>
            </button>
          );
        })}
      </div>

      {view !== "kortit" && (
        <PolkuAikajana
          ids={view === "risteys" ? (multi.length ? multi : [sel]) : [sel]}
          onPick={(id) => (onDecision ? onDecision(id) : undefined)}
        />
      )}

      {view === "kortit" && (
      <div className={`j-path j-k-${path.kind}`}>
        <div className="j-now">
          <span className="j-era">Tarkastelun lähtökohta · ei yksittäinen tilastohavainto</span>
          <h3>{path.title}</h3>
          <p>{path.now}</p>
          <p className="j-q">{path.question}</p>
          <p>
            <b>Vaihtoehtoinen selitys.</b> {path.alternative}
          </p>
          <p>
            <b>Miten koetellaan?</b> {path.check}
          </p>
          <nav aria-label="Polun tausta-analyysit" className="j-analysis">
            {path.analysis.map((a) => (
              <Link key={a.hash} to="/laboratorio" hash={a.hash}>
                {a.label} →
              </Link>
            ))}
          </nav>
        </div>
        <ol className="j-steps">
          {path.steps.map((s, i) => (
            <li key={s.era} className="j-step">
              <div className="j-lag">
                <span>↑ Vaikutusviive: ei arvioitu tässä polussa</span>
              </div>
              <div className="j-body">
                <span className="j-era">
                  Askel {i + 1} · {s.era}
                </span>
                <h4>{s.title}</h4>
                <p>
                  <b>Selitysehdotus.</b> {s.mechanism}
                </p>
                <ul className="j-laws">
                  {stepDecisions(s).map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => setOpen(open === d.id ? null : d.id)}
                        aria-expanded={open === d.id}
                      >
                        <b>{d.aika}</b> {d.paatos}
                      </button>
                      {open === d.id && (
                        <div className="j-law-body">
                          {d.metatarina && (
                            <p>
                              <b>Merkitys.</b> {d.metatarina}
                            </p>
                          )}
                          {d.riskinjako && (
                            <p>
                              <b>Riskinjako.</b> {d.riskinjako}
                            </p>
                          )}
                          {d.toimeenpano && (
                            <p>
                              <b>Toimeenpano.</b> {d.toimeenpano}
                            </p>
                          )}
                          {d.lahdelinkki && (
                            <p>
                              <a href={d.lahdelinkki} target="_blank" rel="noreferrer">
                                Päätöksen lähde: {d.lahde || "avaa lähde"}
                              </a>
                            </p>
                          )}
                          {onDecision && (
                            <button onClick={() => onDecision(d.id)}>
                              Tutki taustoja ja seurauksia →
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        <p className="j-note">
          Polku on tulkinnallinen prosessijäljitys: se osoittaa mahdollisia vaikutusketjuja, ei
          todistettuja syy-yhteyksiä.
        </p>
      </div>
      )}
    </section>
  );
}
