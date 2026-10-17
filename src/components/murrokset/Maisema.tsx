import { useMemo, useState } from "react";
import { DECISIONS, type Decision } from "./murrokset-model";
import {
  CRISES,
  LENSES,
  lensOf,
  lensSeries,
  project,
  scoreOf,
  type LensId,
  type Point,
  type Scenario,
} from "./maisema-model";
import "./maisema.css";

const W = 1400, H = 720, L = 40, R = 1380, TOP = 70, BOT = 690, MID = (TOP + BOT) / 2;
const x = (y: number) => L + ((y - 1850) / 200) * (R - L);
const yv = (v: number) => MID - v * (MID - TOP - 40);

function pathOf(pts: Point[], off = 0) {
  const p = pts.map((q) => [x(q.year), yv(q.v + off)] as const);
  let d = `M${p[0]![0]},${p[0]![1]}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1]!, [x1, y1] = p[i]!;
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}
function bandOf(pts: Point[]) {
  const up = pts.map((q) => ({ ...q, v: q.v + q.spread }));
  const dn = [...pts].reverse().map((q) => ({ ...q, v: q.v - q.spread }));
  return `${pathOf(up)} L${pathOf(dn).slice(1)} Z`;
}

export function Maisema({ onExplore }: { onExplore: (id: string) => void }) {
  const [lenses, setLenses] = useState<Set<LensId>>(new Set(["toimeentulo", "osaaminen", "terveys"]));
  const [scenario, setScenario] = useState<Scenario>("nykyinen");
  const [core, setCore] = useState(false);
  const [pick, setPick] = useState<Decision | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const toggle = (id: LensId) =>
    setLenses((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const series = useMemo(
    () =>
      LENSES.filter((l) => lenses.has(l.id)).map((l) => {
        const pts = lensSeries(l.id);
        return { ...l, pts, fut: project(pts[pts.length - 1]!.v, scenario) };
      }),
    [lenses, scenario],
  );
  const all = useMemo(() => {
    const pts = lensSeries("all");
    return { pts, fut: project(pts[pts.length - 1]!.v, scenario) };
  }, [scenario]);

  const nodes = useMemo(() => {
    const list = DECISIONS.filter((d) => lenses.has(lensOf(d.teema))).filter(
      (d) => !core || d.arvioLuokka !== "vahvistava",
    );
    // Stagger same-era nodes vertically so labels never sit on each other.
    const lanes: number[][] = [];
    return list
      .sort((a, b) => a.vuosi - b.vuosi)
      .map((d) => {
        const base = yv(scoreOf(d) * 0.82);
        const px = x(d.vuosi);
        let k = 0;
        for (;;) {
          const yy = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 17;
          const used = (lanes[Math.round(yy)] ??= []);
          if (!used.some((ux) => Math.abs(ux - px) < 150) || k > 14) {
            used.push(px);
            return { d, px, py: yy, tone: LENSES.find((l) => l.id === lensOf(d.teema))!.tone };
          }
          k++;
        }
      });
  }, [lenses, core]);
  const showLabels = nodes.length <= 70;

  return (
    <section className="ms" aria-label="Murrosmaisema">
      <div className="ms-panel">
        <div className="ms-row">
          <span className="ms-kicker">Valitse murrosmaisemaa selittävät linssit</span>
          <div className="ms-quick">
            <button className={core ? "on" : ""} onClick={() => setCore((c) => !c)}>Ydinketjut</button>
            <button onClick={() => setLenses(new Set(LENSES.map((l) => l.id)))}>Kaikki</button>
            <button onClick={() => setLenses(new Set())}>Tyhjennä</button>
          </div>
        </div>
        <div className="ms-lenses">
          {LENSES.map((l) => (
            <button
              key={l.id}
              aria-pressed={lenses.has(l.id)}
              className={lenses.has(l.id) ? "on" : ""}
              style={{ "--lt": l.tone } as React.CSSProperties}
              onClick={() => toggle(l.id)}
              title={l.label}
            >
              <i aria-hidden>{l.icon}</i>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
        <div className="ms-row ms-scen">
          <span className="ms-kicker">Kehityssuunta 2025–2050</span>
          <div className="ms-seg" role="group" aria-label="Skenaario">
            {(["heikkenee", "nykyinen", "vahvistuu"] as Scenario[]).map((s) => (
              <button key={s} className={scenario === s ? "on" : ""} onClick={() => setScenario(s)}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ms-stage">
        <header className="ms-stage-head">
          <h2>Valittujen linssien murrosmaisema</h2>
          <span>Vaaka = aika · pysty = lähteen arvio vaikutuksen suunnasta · nauha = murrosten painopiste</span>
        </header>
        <div className="ms-scroll">
          <svg viewBox={`0 0 ${W} ${H}`} className="ms-svg" role="img" aria-label="Murrokset aikajanalla vaikutuksen suunnan mukaan">
            <rect x={x(2025)} y={TOP - 30} width={R - x(2025)} height={BOT - TOP + 30} className="ms-future" />
            {[1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025, 2050].map((yr) => (
              <g key={yr}>
                <line x1={x(yr)} x2={x(yr)} y1={TOP - 20} y2={BOT} className="ms-grid" />
                <text x={x(yr)} y={TOP - 34} className="ms-year" textAnchor="middle">{yr}</text>
              </g>
            ))}
            <line x1={x(2025)} x2={x(2025)} y1={TOP - 24} y2={BOT} className="ms-now" />
            <text x={x(2025) + 8} y={TOP - 10} className="ms-axis-l ms-fut-l">Mahdolliset tulevaisuudet</text>
            <line x1={L} x2={R} y1={MID} y2={MID} className="ms-mid" />
            <text x={L + 8} y={TOP - 4} className="ms-axis-l">Enemmän parempaan</text>
            <text x={L + 8} y={MID - 8} className="ms-axis-l">Neutraali keskiviiva</text>
            <text x={L + 8} y={BOT - 8} className="ms-axis-l">Enemmän heikompaan</text>

            {CRISES.map((c) => (
              <g key={c.label} className="ms-crisis">
                <rect x={x(c.from) - 3} y={TOP} width={Math.max(6, x(c.to) - x(c.from) + 6)} height={BOT - TOP} />
                <text x={x((c.from + c.to) / 2)} y={BOT - 28} textAnchor="middle">{c.title.split(" ja ")[0]}</text>
              </g>
            ))}

            {series.map((s) => (
              <g key={s.id} style={{ "--lt": s.tone } as React.CSSProperties}>
                <path d={bandOf(s.pts)} className="ms-band" />
                <path d={pathOf(s.pts)} className="ms-line" />
                <path d={bandOf(s.fut)} className="ms-band ms-band-f" />
                <path d={pathOf(s.fut)} className="ms-line ms-dash" />
              </g>
            ))}
            <path d={pathOf(all.pts)} className="ms-all" />
            <path d={pathOf(all.fut)} className="ms-all ms-dash" />

            {nodes.map(({ d, px, py, tone }) => {
              const on = pick?.id === d.id || hover === d.id;
              return (
                <g
                  key={d.id}
                  className={`ms-node${on ? " on" : ""}`}
                  style={{ "--lt": tone } as React.CSSProperties}
                  transform={`translate(${px},${py})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.vuosi}: ${d.tavoite}`}
                  onClick={() => setPick(d)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPick(d)}
                  onMouseEnter={() => setHover(d.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle r={on ? 8 : 5.5} />
                  {(showLabels || on) && (
                    <text x={9} y={4}>
                      {d.tavoite.length > 30 && !on ? d.tavoite.slice(0, 29) + "…" : d.tavoite}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <ul className="ms-legend">
          <li><i className="ms-lg-all" /> Kaikkien päätösten painopiste</li>
          <li><i className="ms-lg-dash" /> Tulkinnallinen jatko 2025–2050</li>
          <li><i className="ms-lg-crisis" /> Kriisi</li>
          <li>{nodes.length} päätöstä näkyvissä</li>
        </ul>
      </div>

      {pick && (
        <aside className="ms-card" aria-live="polite">
          <button className="ms-close" onClick={() => setPick(null)} aria-label="Sulje">×</button>
          <span className="ms-kicker">{pick.aika} · {pick.teema} · {pick.arvio}</span>
          <h3>{pick.tavoite}</h3>
          <p>{pick.paatos}</p>
          <p><b>Metatarina:</b> {pick.metatarina}</p>
          <p><b>Kuka kantoi riskin:</b> {pick.riskinjako}</p>
          <p className="ms-src">
            {pick.lahdelinkki ? <a href={pick.lahdelinkki} target="_blank" rel="noreferrer">{pick.lahde}</a> : pick.lahde}
          </p>
          <button className="m-explore" onClick={() => onExplore(pick.id)}>Näytä taustat ja seuraukset →</button>
        </aside>
      )}
      <p className="ms-note">
        Pystysijainti perustuu lähdeaineiston omaan arvioluokkaan (vahvistava, korjaava, ristiriitainen, heikentävä), ei mitattuun vaikutukseen. Tulevaisuusjakso on havainnollistava skenaario.
      </p>
    </section>
  );
}
