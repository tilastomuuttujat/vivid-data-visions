import { useMemo, useState } from "react";
import { MainLinks } from "@/components/MainLinks";
import { BASELINES, decompose, factorIndex, factors, points, retrieved, source, type FactorId } from "./model";
import "./dekompositio.css";

const W = 1000,
  H = 420,
  PAD = { l: 64, r: 24, t: 24, b: 40 };
const AXIS_MIN = 1850,
  AXIS_MAX = 2050,
  NOW = 2025;
const eur = (v: number) => Math.round(v).toLocaleString("fi-FI") + " €";
const signed = (v: number) => (v >= 0 ? "+" : "−") + eur(Math.abs(v));

function curve(pts: { x: number; y: number }[]) {
  return pts
    .map((p, i) => {
      if (!i) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1]!;
      const mid = (p.x + prev.x) / 2;
      return `C ${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
}

export function Dekompositio() {
  const [baseline, setBaseline] = useState<number>(1975);
  const [factor, setFactor] = useState<FactorId>("productivity");
  const [hover, setHover] = useState<number | null>(null);
  const series = useMemo(() => decompose(points, baseline), [baseline]);
  const fi = factorIndex(factor);
  const rows = series.map((s) => ({ ...s, comparison: s.actual - s.parts[fi] }));
  const all = rows.flatMap((r) => [r.actual, r.comparison]);
  const lo = Math.floor(Math.min(...all) / 5000) * 5000,
    hi = Math.ceil(Math.max(...all) / 5000) * 5000;
  const x0 = AXIS_MIN,
    x1 = AXIS_MAX;
  const d0 = rows[0]!.year;
  const x = (y: number) => PAD.l + ((y - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const actual = rows.map((r) => ({ x: x(r.year), y: y(r.actual) }));
  const comp = rows.map((r) => ({ x: x(r.year), y: y(r.comparison) }));
  const band = curve(actual) + " " + curve([...comp].reverse()).replace(/^M/, "L") + " Z";
  const last = rows[rows.length - 1]!;
  const sel = rows.find((r) => r.year === hover) ?? last;
  const ticks = Array.from({ length: (hi - lo) / 5000 + 1 }, (_, i) => lo + i * 5000);

  return (
    <main className="dk-page">
      <nav>
        <MainLinks exclude="/dekompositio" />
      </nav>
      <div className="dk-kicker">LASKENTAKERROS · TILASTOKESKUS 15AI</div>
      <h1>Mistä tuotannon kasvu on syntynyt?</h1>
      <p>
        Kokonaisuus on <b>bruttokansantuote asukasta kohti</b> (vuoden 2015 hinnoin). Se jakautuu tarkasti kolmeen
        tekijään: tuottavuuteen, työtunteihin ja työllisten osuuteen väestöstä. Valitse tekijä, niin näet, millainen
        kokonaisuus olisi laskennallisesti ilman sen muutosta vertailuvuodesta.
      </p>

      <div className="dk-controls">
        <div role="group" aria-label="Tekijä">
          {factors.map((f, i) => (
            <button key={f.id} aria-pressed={f.id === factor} onClick={() => setFactor(f.id)}>
              <span>{f.label}</span>
              <small>{signed(last.parts[i]!)}</small>
            </button>
          ))}
        </div>
        <div role="group" aria-label="Vertailuvuosi" className="dk-base">
          Vertailuvuosi
          {BASELINES.map((b) => (
            <button key={b} aria-pressed={b === baseline} onClick={() => setBaseline(b)}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="dk-chart" onMouseLeave={() => setHover(null)}>
        <defs>
          <pattern id="dk-up" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" className="dk-hatch-up" />
          </pattern>
          <pattern id="dk-down" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" className="dk-hatch-down" />
          </pattern>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="dk-grid" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="dk-axis">
              {(t / 1000).toLocaleString("fi-FI")} t€
            </text>
          </g>
        ))}
        <rect x={x(AXIS_MIN)} width={x(d0) - x(AXIS_MIN)} y={PAD.t} height={H - PAD.t - PAD.b} className="dk-nodata" />
        <rect x={x(NOW)} width={x(AXIS_MAX) - x(NOW)} y={PAD.t} height={H - PAD.t - PAD.b} className="dk-future" />
        <text x={(x(AXIS_MIN) + x(d0)) / 2} y={PAD.t + 22} textAnchor="middle" className="dk-zone">
          Ei vertailukelpoista lähdeaineistoa {AXIS_MIN}–{d0 - 1}
        </text>
        <text x={(x(NOW) + x(AXIS_MAX)) / 2} y={PAD.t + 22} textAnchor="middle" className="dk-zone">
          Tulevaisuus – ei ennustetta
        </text>
        <line x1={x(NOW)} x2={x(NOW)} y1={PAD.t} y2={H - PAD.b} className="dk-now" />
        <line x1={x(baseline)} x2={x(baseline)} y1={PAD.t} y2={H - PAD.b} className="dk-base-line" />
        <text x={x(baseline) + 5} y={H - PAD.b - 8} className="dk-axis">vertailuvuosi {baseline}</text>
        {[1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025, 2050].map((yr) => (
          <text key={yr} x={x(yr)} y={H - 14} textAnchor="middle" className={yr === NOW ? "dk-axis dk-axis-now" : "dk-axis"}>
            {yr}
          </text>
        ))}
        <path d={band} fill={last.parts[fi]! >= 0 ? "url(#dk-up)" : "url(#dk-down)"} />
        <path d={curve(comp)} className="dk-comp" />
        <path d={curve(actual)} className="dk-actual" />
        <line x1={x(sel.year)} x2={x(sel.year)} y1={PAD.t} y2={H - PAD.b} className="dk-cursor" />
        <circle cx={x(sel.year)} cy={y(sel.actual)} r={5} className="dk-dot" />
        {rows.map((r) => (
          <rect
            key={r.year}
            x={x(r.year - 0.5)}
            width={x(1) - x(0)}
            y={PAD.t}
            height={H - PAD.t - PAD.b}
            fill="transparent"
            onMouseEnter={() => setHover(r.year)}
          />
        ))}
      </svg>
      <div className="dk-legend">
        <span className="dk-l-actual">Toteutunut BKT/asukas</span>
        <span className="dk-l-comp">Ilman tekijän osuutta (Shapley-jako)</span>
      </div>

      <section className="dk-readout" aria-live="polite">
        <h2>Vuosi {sel.year}</h2>
        <p>
          BKT asukasta kohti <b>{eur(sel.actual)}</b>, muutos vuodesta {baseline}: <b>{signed(sel.actual - sel.baseTotal)}</b>
        </p>
        <ul>
          {factors.map((f, i) => (
            <li key={f.id} className={i === fi ? "on" : ""}>
              <span>{f.label}</span>
              <b>{signed(sel.parts[i]!)}</b>
              <small>{f.detail}</small>
            </li>
          ))}
        </ul>
        <p className="dk-check">
          Tarkistus: osuuksien summa {signed(sel.parts[0] + sel.parts[1] + sel.parts[2])} = kokonaismuutos.
        </p>
      </section>

      <section className="dk-notes">
        <h2>Miten luku syntyy</h2>
        <p>
          BKT/asukas = (BKT / työtunti) × (työtunnit / työllinen) × (työlliset / väestö). Kolmen tekijän Shapley-jako
          keskiarvoistaa kaikki kuusi muutosjärjestystä, joten yhteisvaikutukset jaetaan symmetrisesti ja osuudet
          summautuvat täsmälleen kokonaismuutokseen.
        </p>
        <p>
          Vertailukäyrä on <b>kirjanpidollinen jako, ei ennuste</b> maailmasta ilman tekijää. Osuudet eivät ole
          politiikan tai päätösten syyvaikutuksia. Työlliset ovat kansantalouden tilinpidon kotimaan työllisiä, eivätkä
          ne ole yhteismitallisia Kokonaiskuvan työssäkäyntitilaston kanssa. 2024–2025 luvut ovat ennakollisia.
        </p>
        <p className="dk-source">
          Lähde: <a href="https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__ntp/15ai.px/">{source.title}</a>, haettu{" "}
          {retrieved}. Malli: Murrosmatriisin laskentakerros, production_components v1.
        </p>
      </section>
    </main>
  );
}
