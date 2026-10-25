import { useState } from "react";
import { MeasuredEvidence } from "@/components/evidence/Measured";
import { MainLinks } from "@/components/MainLinks";
import { evidence, type Metric } from "@/components/murrokset/evidence-model";
import { ERAS, LINE_TURNS, LINES, SUBLINES, NOW, TURNS, YEAR_MAX, YEAR_MIN, episodeFor, type Turn } from "./kaari-model";
import "./kaari.css";

const W = 1000;
const H = 420;
const PAD = { l: 20, r: 20, t: 40, b: 40 };
const x = (y: number) => PAD.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b);

function linePath(points: [number, number][]) {
  return points
    .map(([yr, v], i) => {
      if (i === 0) return `M${x(yr)},${y(v)}`;
      const [py, pv] = points[i - 1]!;
      const mx = (x(py) + x(yr)) / 2;
      return `C${mx},${y(pv)} ${mx},${y(v)} ${x(yr)},${y(v)}`;
    })
    .join(" ");
}

/** Exact SVG y on the drawn Bézier curve at a given year (solves the cubic for x). */
function curveY(points: [number, number][], year: number) {
  const X = x(year);
  for (let i = 1; i < points.length; i++) {
    const [py, pv] = points[i - 1]!;
    const [cyr, cv] = points[i]!;
    const x0 = x(py), x3 = x(cyr);
    if (X > x3 && i < points.length - 1) continue;
    const mx = (x0 + x3) / 2;
    let lo = 0, hi = 1, t = 0.5;
    for (let k = 0; k < 40; k++) {
      t = (lo + hi) / 2;
      const u = 1 - t;
      const bx = u * u * u * x0 + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * x3;
      if (bx < X) lo = t; else hi = t;
    }
    const u = 1 - t;
    const y0 = y(pv), y3 = y(cv);
    return u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y3 + t * t * t * y3;
  }
  return y(points.at(-1)![1]);
}

function Spark({ m }: { m: Metric }) {
  const obs = m.observations;
  if (obs.length < 2) return null;
  const vs = obs.map((o) => o.value);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs) || 1;
  const x0 = obs[0]!.year;
  const x1 = obs.at(-1)!.year;
  const sx = (yr: number) => ((yr - x0) / (x1 - x0 || 1)) * 280;
  const sy = (v: number) => 60 - ((v - lo) / (hi - lo || 1)) * 56;
  return (
    <svg viewBox="0 0 280 64" className="k-spark" aria-hidden>
      <rect x={sx(m.shock.window[0])} width={Math.max(2, sx(m.shock.window[1]) - sx(m.shock.window[0]))} y={0} height={64} className="k-spark-shock" />
      <path d={obs.map((o, i) => {
        if (i === 0) return `M${sx(o.year)},${sy(o.value)}`;
        const p = obs[i - 1]!;
        const mx = (sx(p.year) + sx(o.year)) / 2;
        return `C${mx},${sy(p.value)} ${mx},${sy(o.value)} ${sx(o.year)},${sy(o.value)}`;
      }).join(" ")} />
    </svg>
  );
}

function DeepPanel({ turn, onClose }: { turn: Turn; onClose: () => void }) {
  const ep = episodeFor(turn);
  if (!ep) return null;
  const impl = ep.implementation_ids
    .map((id) => evidence.implementationRecords.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  return (
    <aside className="k-deep" role="dialog" aria-label={`Näyttö: ${turn.title}`}>
      <button className="k-close" onClick={onClose} aria-label="Sulje näyttö">×</button>
      <p className="k-kicker">Syvätaso · tilastot ja säädökset</p>
      <h2>{ep.title}</h2>
      <p className="k-muted">{ep.selection}</p>

      <h3>Mitä tilastot näyttävät</h3>
      <p className="k-muted">Korostettu kaista on kriisijakso. Kuvaajat ovat havaintoja, eivät todisteita syy-yhteydestä.</p>
      <div className="k-metrics">
        {ep.metrics.slice(0, 6).map((m) => (
          <figure key={m.series_key + m.group_key}>
            <figcaption>{m.title}<span>{m.group_label} · {m.unit}</span></figcaption>
            <Spark m={m} />
            {typeof m.shock_vs_baseline.relative_percent_change === "number" && (
              <p className="k-delta">Kriisin aikana {m.shock_vs_baseline.relative_percent_change > 0 ? "+" : ""}{m.shock_vs_baseline.relative_percent_change.toFixed(1)} % ({m.shock_vs_baseline.baseline_year}→{m.shock_vs_baseline.endpoint_year})</p>
            )}
          </figure>
        ))}
      </div>
      {ep.metrics.length > 6 && <p className="k-muted">+ {ep.metrics.length - 6} muuta mittaria Murrokset → Näyttö -välilehdellä.</p>}

      {ep.decision_context.length > 0 && (
        <>
          <h3>Säädökset ja niiden ajoitus</h3>
          <ul className="k-list">
            {ep.decision_context.map((c) => (
              <li key={c.event_key}><b>{c.statute_id}</b> · {c.event_date}<br /><span className="k-muted">{c.interpretation}</span></li>
            ))}
          </ul>
        </>
      )}

      {impl.length > 0 && (
        <>
          <h3>Miten toimeenpano onnistui</h3>
          <ul className="k-list">
            {impl.map((r) => (
              <li key={r.id}><b>{r.title}</b><br />{r.summary}
                {r.sources[0] && <><br /><a href={r.sources[0].url} target="_blank" rel="noreferrer">{r.sources[0].publisher}</a></>}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Rajoitukset</h3>
      <ul className="k-list k-muted">{ep.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
    </aside>
  );
}

export function Kehityskaari() {
  const [sel, setSel] = useState<Turn | null>(null);
  const [deep, setDeep] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [subs, setSubs] = useState<string[]>([]);
  const toggleSub = (id: string) => setSubs((c) => (c.includes(id) ? c.filter((s) => s !== id) : [...c, id]));

  const pick = (t: Turn) => { setSel(t); setDeep(false); };
  const turns = focus ? LINE_TURNS[focus] ?? TURNS : TURNS;
  const toggleFocus = (id: string) => { setFocus(focus === id ? null : id); setSel(null); setDeep(false); setSubs([]); };

  return (
    <div className="k-page">
      <nav className="k-nav"><MainLinks exclude="/kehityskaari" /></nav>
      <header className="k-head">
        <p className="k-kicker">Kehityskaari 1860–2050</p>
        <h1>Kolme voimaa, seitsemän käännettä</h1>
        <p className="k-lede">Suomen kehitys tiivistettynä kolmeksi voimalinjaksi. Linjan korkeus on tulkinta suunnasta – ei mittaus. Klikkaa käännettä nähdäksesi mekanismin, ja avaa halutessasi tilastot ja säädökset.</p>
      </header>

      <div className="k-legend">
        {LINES.map((l) => (
          <button key={l.id} className={focus === l.id ? "on" : ""} style={{ ["--c" as string]: l.tone }} onClick={() => toggleFocus(l.id)}>
            <i /> <span><b>{l.label}</b>{l.question}</span>
          </button>
        ))}
      </div>

      {focus ? (
        <div className="k-subs" aria-label="Alavirrat">
          <span className="k-subs-label">Alavirrat</span>
          {LINES.filter((l) => l.id === focus).map((l) => (
            <div key={l.id} className="k-subs-group" style={{ ["--c" as string]: l.tone }}>
              {SUBLINES.filter((s) => s.parent === l.id).map((s) => (
                <button key={s.id} aria-pressed={subs.includes(s.id)} className={subs.includes(s.id) ? "on" : ""} onClick={() => toggleSub(s.id)} title={s.note}>
                  {subs.includes(s.id) ? "−" : "+"} {s.label}
                </button>
              ))}
            </div>
          ))}
          {subs.length > 0 && <button className="k-subs-clear" onClick={() => setSubs([])}>Tyhjennä</button>}
        </div>
      ) : (
        <p className="k-subs-hint">Valitse voima yltä nähdäksesi sen alavirrat.</p>
      )}

      <div className="k-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kolme voimalinjaa ja seitsemän käännekohtaa">
          {ERAS.map((e, i) => (
            <g key={e.label}>
              <rect x={x(e.from)} y={PAD.t - 24} width={x(e.to) - x(e.from)} height={H - PAD.t - PAD.b + 24} className={`k-era k-era-${i}`} />
              <text x={x(e.from) + 8} y={PAD.t - 8} className="k-era-label">{e.label}</text>
            </g>
          ))}
          {[1900, 1950, 2000, 2050].map((yr) => (
            <text key={yr} x={x(yr)} y={H - 14} className="k-axis" textAnchor="middle">{yr}</text>
          ))}
          <line x1={x(NOW)} x2={x(NOW)} y1={PAD.t - 24} y2={H - PAD.b} className="k-now" />
          <text x={x(NOW) + 4} y={H - PAD.b - 6} className="k-now-label">Nyt</text>
          {LINES.map((l) => (
            <path key={l.id} d={linePath(l.points)} stroke={l.tone} className={`k-line ${focus && focus !== l.id ? "dim" : ""}`} />
          ))}
          {SUBLINES.filter((s) => subs.includes(s.id)).map((s) => {
            const tone = LINES.find((l) => l.id === s.parent)!.tone;
            const end = s.points.at(-1)!;
            return (
              <g key={s.id} className="k-sub">
                <path d={linePath(s.points)} stroke={tone} />
                <text x={x(end[0]) - 4} y={y(end[1]) - 8} textAnchor="end" fill={tone}>{s.label}</text>
              </g>
            );
          })}
          {turns.map((t) => {
            const cy = focus
              ? curveY(LINES.find((l) => l.id === focus)!.points, t.year)
              : [...LINES.map((l) => curveY(l.points, t.year))].sort((a, b) => a - b)[1]!;
            const active = sel?.id === t.id;
            return (
              <g key={t.id} className={`k-turn ${active ? "on" : ""}`} tabIndex={0} role="button" aria-label={`${t.year} ${t.title}`}
                onClick={() => pick(t)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick(t)}>
                <line x1={x(t.year)} x2={x(t.year)} y1={cy} y2={H - PAD.b} className="k-turn-stem" />
                <circle cx={x(t.year)} cy={cy} r={active ? 8 : 6} />
                <text x={x(t.year)} y={cy - 14} textAnchor="middle">{t.year}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {subs.length > 0 && (
        <ul className="k-sub-notes">
          {SUBLINES.filter((s) => subs.includes(s.id)).map((s) => (
            <li key={s.id} style={{ ["--c" as string]: LINES.find((l) => l.id === s.parent)!.tone }}><b>{s.label}</b> {s.note}</li>
          ))}
        </ul>
      )}

      {sel ? (
        <section className="k-card" aria-live="polite">
          <p className="k-kicker">{sel.year} · {focus ? `${LINES.find((l) => l.id === focus)!.label} – oma käänne` : "Yhteinen käänne · mekanismi"}</p>
          <h2>{sel.title}</h2>
          <div className="k-steps">
            <div><h4>Mitä tapahtui</h4><p>{sel.happened}</p></div>
            <div><h4>Mikä muuttui</h4><p>{sel.mechanism}</p></div>
            <div><h4>Mitä seurasi viiveellä</h4><p>{sel.later}</p></div>
          </div>
          {episodeFor(sel) && <button className="k-open" onClick={() => setDeep(true)}>Avaa tilastot ja säädökset →</button>}
          <MeasuredEvidence year={sel.year} factor={focus ?? undefined} />
        </section>
      ) : (
        <p className="k-hint">{focus ? "Näet nyt valitun voiman omat käännekohdat. Klikkaa voimaa uudelleen palataksesi seitsemään yhteiseen käänteeseen." : "Seitsemän yhteistä käännettä. Valitse voima yläpuolelta nähdäksesi sen omat käännekohdat."}</p>
      )}

      {sel && deep && <DeepPanel turn={sel} onClose={() => setDeep(false)} />}
    </div>
  );
}
