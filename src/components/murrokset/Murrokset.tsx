import { MainLinks } from "@/components/MainLinks";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  PHASES,
  TURNS,
  KIND_LABEL,
  PREP,
  FUNDING,
  GUIDE,
  decisionsIn,
  fourQuestions,
  type Decision,
  type Period,
  type TurnKind,
} from "./murrokset-model";
import { Juurisyyt } from "./Juurisyyt";
import { Ankkurit } from "./Ankkurit";
import { Maisema } from "./Maisema";
import "./murrokset.css";

const AnchorTimeline = lazy(() =>
  import("./AnchorTimeline").then((m) => ({ default: m.AnchorTimeline })),
);

const DecisionExplorer = lazy(() =>
  import("./DecisionExplorer").then((m) => ({ default: m.DecisionExplorer })),
);

type Focus = { from: number; to: number; title: string; sub: string };
const Q = [
  ["vahvistui", "Mikä vahvistui?"],
  ["heikkeni", "Mikä heikkeni?"],
  ["riski", "Kuka kantoi riskin?"],
  ["viive", "Mikä näkyi viiveellä?"],
] as const;

export function Murrokset() {
  const [focus, setFocus] = useState<Focus>(PHASES[3]!.periods[0]);
  const [kinds, setKinds] = useState<Record<TurnKind, boolean>>({
    paatos: true,
    kriisi: true,
    rakenne: true,
  });
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"maisema" | "kronologia" | "juuret" | "verkosto" | "ankkurit" | "systeemi">(
    "maisema",
  );
  const [networkDecision, setNetworkDecision] = useState("d050");
  const [networkFocus, setNetworkFocus] = useState<string | undefined>();
  const exploreDecision = (id: string, nodeId?: string) => {
    setNetworkFocus(nodeId);
    setNetworkDecision(id);
    setMode("verkosto");
  };
  const list = useMemo(() => decisionsIn(focus.from, focus.to), [focus]);
  const q = useMemo(() => fourQuestions(list), [list]);
  const pick = (f: Focus) => {
    setFocus(f);
    setOpen(null);
    document.getElementById("m-jakso")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="varaan murrokset">
      <div className="v-aurora" aria-hidden />
      <div className="m-wrap">
        <header className="v-top">
          <span className="v-kicker">Murrokset · metatarina 1850–2025</span>
          <nav className="pl-nav">
            <MainLinks exclude="/murrokset" />
          </nav>
        </header>
        <div className="m-hero">
          <h1>Minkä varaan Suomi rakentuu?</h1>
          <p className="m-lead">
            Yhteisen kantokyvyn murrokset 1850–2025 · viisi päävaihetta · kymmenen tarkastelujaksoa
            · 116 päätöstä
          </p>
          <div className="m-mode" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "maisema"}
              className={mode === "maisema" ? "on" : ""}
              onClick={() => setMode("maisema")}
            >
              Murrosmaisema
            </button>
            <button
              role="tab"
              aria-selected={mode === "kronologia"}
              className={mode === "kronologia" ? "on" : ""}
              onClick={() => setMode("kronologia")}
            >
              Kronologia 1850 → 2025
            </button>
            <button
              role="tab"
              aria-selected={mode === "juuret"}
              className={mode === "juuret" ? "on" : ""}
              onClick={() => setMode("juuret")}
            >
              Juurisyyt · nykytilasta historiaan
            </button>
            <button
              role="tab"
              aria-selected={mode === "verkosto"}
              className={mode === "verkosto" ? "on" : ""}
              onClick={() => setMode("verkosto")}
            >
              Taustat ja seuraukset
            </button>
            <button
              role="tab"
              aria-selected={mode === "ankkurit"}
              className={mode === "ankkurit" ? "on" : ""}
              onClick={() => setMode("ankkurit")}
            >
              7 systeemistä ankkuria
            </button>
            <button
              role="tab"
              aria-selected={mode === "systeemi"}
              className={mode === "systeemi" ? "on" : ""}
              onClick={() => setMode("systeemi")}
            >
              Systeeminen aikajana
            </button>
          </div>
        </div>

        {mode === "maisema" ? (
          <Maisema onExplore={(id) => exploreDecision(id)} />
        ) : mode === "systeemi" ? (
          <Suspense fallback={<p role="status">Ladataan systeemistä aikajanaa…</p>}>
            <AnchorTimeline onExplore={exploreDecision} />
          </Suspense>
        ) : mode === "ankkurit" ? (
          <Ankkurit />
        ) : mode === "verkosto" ? (
          <Suspense fallback={<p role="status">Ladataan päätösverkostoa…</p>}>
            <DecisionExplorer
              key={`${networkDecision}:${networkFocus ?? ""}`}
              decisionId={networkDecision}
              initialFocus={networkFocus}
              onDecision={(id) => {
                setNetworkDecision(id);
                setNetworkFocus(undefined);
              }}
            />
          </Suspense>
        ) : mode === "juuret" ? (
          <Juurisyyt onDecision={exploreDecision} />
        ) : (
          <>
            <section className="m-phases" aria-label="Viisi päävaihetta">
              {PHASES.map((p) => (
                <article key={p.n} className="m-phase" style={{ ["--tone" as string]: p.tone }}>
                  <div className="m-phase-head">
                    <span className="m-num">{p.n}</span>
                    <div>
                      <h2>{p.title}</h2>
                      <span className="m-years">
                        {p.from}–{p.to}
                      </span>
                    </div>
                  </div>
                  <div className="m-periods">
                    {p.periods.map((pe: Period) => {
                      const n = decisionsIn(pe.from, pe.to).length;
                      const on = focus.from === pe.from && focus.to === pe.to;
                      return (
                        <button
                          key={pe.id}
                          className={`m-period${on ? " on" : ""}`}
                          onClick={() => pick(pe)}
                        >
                          <span className="m-dot" />
                          <b>
                            {pe.from}–{pe.to}
                          </b>
                          <strong>{pe.title}</strong>
                          <small>{pe.sub}</small>
                          <em>{n} päätöstä</em>
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </section>

            <section id="m-jakso" className="m-focus">
              <div className="m-focus-head">
                <span className="m-years">
                  {focus.from}–{focus.to}
                </span>
                <h2>{focus.title}</h2>
                <p>{focus.sub}</p>
              </div>
              <h3 className="m-q-title">Mitä seuraavalle jaksolle jäi?</h3>
              <div className="m-qgrid">
                {Q.map(([k, label]) => (
                  <div key={k} className={`m-q m-q-${k}`}>
                    <h4>{label}</h4>
                    {q[k].length === 0 ? (
                      <p className="m-empty">Aineistossa ei tämän jakson kohtaa.</p>
                    ) : (
                      <ul>
                        {q[k].slice(0, 4).map((d) => (
                          <li key={d.id}>
                            <span>{d.aika}</span>{" "}
                            {k === "riski"
                              ? d.riskinjako
                              : k === "viive"
                                ? `${short(d.paatos)} → ${d.toimeenpano}`
                                : d.metatarina}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <h3 className="m-q-title">Jakson päätökset ({list.length})</h3>
              <div className="m-laws">
                {list.length === 0 && <p className="m-empty">Ei päätöksiä tällä aikavälillä.</p>}
                {list.map((d) => (
                  <LawCard
                    key={d.id}
                    d={d}
                    open={open === d.id}
                    toggle={() => setOpen(open === d.id ? null : d.id)}
                    explore={() => exploreDecision(d.id)}
                  />
                ))}
              </div>
            </section>

            <section className="m-turns">
              <div className="m-turns-head">
                <h2>Suomen käännepisteet</h2>
                <p>Mitä murroksissa muuttui? Klikkaa käännettä nähdäksesi sen päätökset.</p>
                <div className="m-legend">
                  {(Object.keys(KIND_LABEL) as TurnKind[]).map((k) => (
                    <button
                      key={k}
                      className={`m-chip m-k-${k}${kinds[k] ? " on" : ""}`}
                      onClick={() => setKinds({ ...kinds, [k]: !kinds[k] })}
                    >
                      <i />
                      {KIND_LABEL[k]}
                    </button>
                  ))}
                </div>
              </div>
              <ol className="m-axis">
                {TURNS.filter((t) => kinds[t.kind]).map((t, i) => (
                  <li
                    key={t.label + t.title}
                    className={`m-turn m-k-${t.kind} ${i % 2 ? "r" : "l"}`}
                  >
                    <button
                      onClick={() => pick({ from: t.from, to: t.to, title: t.title, sub: t.sub })}
                    >
                      <span className="m-tlabel">{t.label}</span>
                      <strong>{t.title}</strong>
                      <small>{t.sub}</small>
                      <em>
                        {KIND_LABEL[t.kind]} · {decisionsIn(t.from, t.to).length} päätöstä
                      </em>
                    </button>
                    <i className="m-node" />
                  </li>
                ))}
              </ol>
              <p className="m-turns-q">Kuka kantoi riskin – ja mitä jäi seuraaville?</p>
            </section>
          </>
        )}

        <details className="m-guide">
          <summary>Lukuohje: fakta ja tulkinta</summary>
          <dl>
            {GUIDE.map((g) => (
              <div key={g.otsikko}>
                <dt>{g.otsikko}</dt>
                <dd>{g.teksti}</dd>
              </div>
            ))}
          </dl>
        </details>
        <p className="m-foot">
          Tulkinnallinen jaksotus. Rajat kuvaavat siirtymiä, eivät säännöllistä sykliä. Arvio,
          riskinjako ja merkitys metatarinalle ovat toimituksellista tulkintaa.
        </p>
      </div>
    </div>
  );
}

function short(s: string) {
  return s.length > 70 ? s.slice(0, 68) + "…" : s;
}

function LawCard({
  d,
  open,
  toggle,
  explore,
}: {
  d: Decision;
  open: boolean;
  toggle: () => void;
  explore: () => void;
}) {
  const prep = PREP.filter((p) => p.paatosId === d.id);
  const fund = FUNDING.filter((f) => f.paatosId === d.id);
  return (
    <article className={`m-law m-a-${d.arvioLuokka}${open ? " open" : ""}`}>
      <button className="m-law-head" onClick={toggle} aria-expanded={open}>
        <span className="m-law-year">{d.aika}</span>
        <span className="m-law-main">
          <strong>{d.paatos}</strong>
          <small>
            {d.teema} · <b>{d.arvio}</b>
          </small>
        </span>
      </button>
      {open && (
        <div className="m-law-body">
          <p>
            <b>Merkitys metatarinalle.</b> {d.metatarina}
          </p>
          {d.tavoite && (
            <p>
              <b>Tavoite.</b> {d.tavoite}
            </p>
          )}
          {d.toimeenpano && (
            <p>
              <b>Toimeenpano.</b> {d.toimeenpano}
            </p>
          )}
          {d.riskinjako && (
            <p>
              <b>Riskin ja vastuun jako.</b> {d.riskinjako}
            </p>
          )}
          {d.rajat && (
            <p className="m-limit">
              <b>Tulkinnan rajat.</b> {d.rajat}
            </p>
          )}
          {d.vaikutusnaytto && (
            <p>
              <b>Toteutuneiden vaikutusten näyttö.</b> {d.vaikutusnaytto}
            </p>
          )}
          <p className="m-src">
            {d.saadostunnus && <span>Säädös {d.saadostunnus} · </span>}
            {d.lahdelinkki ? (
              <a href={d.lahdelinkki} target="_blank" rel="noreferrer">
                {d.lahde || "Lähde"}
              </a>
            ) : (
              d.lahde
            )}
          </p>
          {prep.length > 0 && (
            <ul className="m-prep">
              {prep.map((p, i) => (
                <li key={i}>
                  <a href={p.linkki ?? "#"} target="_blank" rel="noreferrer">
                    {p.he}
                  </a>{" "}
                  — {p.otsikko} <em>({p.yhteys})</em>
                </li>
              ))}
            </ul>
          )}
          {fund.length > 0 && (
            <p className="m-fund">
              <b>Budjettikytkennät (talousarvio 2024, ei vaikutusarvio):</b>{" "}
              {fund
                .slice(0, 5)
                .map((f) => `${f.momentti} ${f.nimi}`)
                .join(" · ")}
              {fund.length > 5 ? ` (+${fund.length - 5})` : ""}
            </p>
          )}
          <button className="m-explore" onClick={explore}>
            Tutki taustoja ja seurauksia →
          </button>
        </div>
      )}
    </article>
  );
}
