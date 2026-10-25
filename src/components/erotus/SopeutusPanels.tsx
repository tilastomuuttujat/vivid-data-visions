import { YEAR_MAX, YEAR_MIN, NOW } from "@/components/kaari/kaari-model";
import { cumulativeNet } from "./debates";
import data from "./sopeutus-measured.json";

type S = { year: number; delta: number };
const fmt = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(0)}`;

/** Stock view: cumulative areas of the net shadow, overall and per period. */
export function CumulativeMeter({ net, year }: { net: S[]; year?: number }) {
  const upTo = year ?? NOW;
  const all = cumulativeNet(net, upTo);
  const max = Math.max(all.gain, all.cost, 1);
  const periods: [string, number, number][] = [["1860–1949", 1860, 1949], ["1950–1989", 1950, 1989], ["1990–2007", 1990, 2007], ["2008–" + upTo, 2008, upTo]];
  return (
    <section className="e-cum" aria-label="Kumulatiivinen mittari">
      <h3>Kertynyt tase vuoteen {upTo} <small>(varjon pinta-ala, pistevuotta)</small></h3>
      <div className="e-cum-bars">
        <div><span>Kertynyt hyöty</span><i className="pos" style={{ width: `${(all.gain / max) * 100}%` }} /><b>{fmt(all.gain)}</b></div>
        <div><span>Kertynyt kustannus</span><i className="neg" style={{ width: `${(all.cost / max) * 100}%` }} /><b>{fmt(-all.cost)}</b></div>
      </div>
      <p className={`e-cum-net ${all.net >= 0 ? "pos" : "neg"}`}>
        Nettotase {fmt(all.net)} pistevuotta – {all.net >= 0 ? "aiemmin kertynyt hyöty on yhä suurempi kuin kertynyt kustannus (varanto plussalla), vaikka vuotuinen virta voi olla miinuksella." : "kertynyt kustannus on ylittänyt kertyneen hyödyn."}
      </p>
      <div className="e-cum-periods">
        {periods.filter(([, a]) => a <= upTo).map(([l, a, b]) => {
          const seg = net.filter((p) => p.year >= a && p.year <= b);
          const r = cumulativeNet(seg);
          return <div key={l} className={r.net >= 0 ? "pos" : "neg"}><span>{l}</span><b>{fmt(r.net)}</b></div>;
        })}
      </div>
      <p className="e-cum-note">Mittari laskee kuvaajan tulkinnallisen nettovarjon pinta-alan. Se kuvaa suuntaa ja mittasuhdetta, ei euroja.</p>
    </section>
  );
}

const W = 1200, H = 150, L = 20, R = 20;
const x = (yr: number) => L + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - L - R);
const pts = data.points;
/** 5-year average annual productivity growth, %. */
export const prodGrowth = pts.map((p, i) => {
  const q = pts[i - 5];
  return { year: p.year, v: q ? (Math.pow(p.productivity_index / q.productivity_index, 1 / 5) - 1) * 100 : null };
});

function line(vals: { year: number; v: number | null }[], lo: number, hi: number, top: number, h: number) {
  return vals.filter((p) => p.v != null).map((p, i) => `${i ? "L" : "M"}${x(p.year)},${top + h - ((p.v! - lo) / (hi - lo)) * h}`).join(" ");
}

/** Measured background on the fixed 1850–2050 axis. */
export function MeasuredSopeutus({ year }: { year?: number }) {
  const row = year ? pts.find((p) => p.year === year) : undefined;
  const g = year ? prodGrowth.find((p) => p.year === year)?.v : undefined;
  return (
    <section className="e-meas" aria-label="Mitatut tilastot">
      <h3>Mitattu tausta 1975–2025 <small>Tilastokeskus</small></h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tuottavuuden kasvu, sosiaalietuudet ja julkinen alijäämä">
        <rect x={x(1975)} width={x(2025) - x(1975)} y={4} height={H - 24} className="e-meas-span" />
        <line x1={x(NOW)} x2={x(NOW)} y1={4} y2={H - 20} className="k-now" />
        {[1900, 1950, 2000, 2050].map((yr) => <text key={yr} x={x(yr)} y={H - 4} textAnchor="middle" className="k-axis">{yr}</text>)}
        <path d={line(prodGrowth, -1, 5, 8, 120)} className="e-meas-prod" />
        <path d={line(pts.map((p) => ({ year: p.year, v: p.benefits_pct_gdp })), 5, 25, 8, 120)} className="e-meas-ben" />
        <path d={line(pts.map((p) => ({ year: p.year, v: p.net_lending_pct_gdp })), -10, 10, 8, 120)} className="e-meas-b9" />
        {year && year >= 1975 && year <= 2025 && <line x1={x(year)} x2={x(year)} y1={4} y2={H - 20} className="e-cursor" />}
      </svg>
      <div className="e-meas-legend">
        <span><i className="e-meas-prod" /> Työn tuottavuuden kasvu (5 v. ka., %/v)</span>
        <span><i className="e-meas-ben" /> Sosiaalietuudet rahana, % BKT</span>
        <span><i className="e-meas-b9" /> Julkisen talouden yli-/alijäämä, % BKT</span>
      </div>
      {row ? (
        <strong>{row.year}: tuottavuuden kasvu {g != null ? `${g.toFixed(1)} %/v` : "–"} · etuudet {row.benefits_pct_gdp.toFixed(1)} % BKT · julkinen talous {row.net_lending_pct_gdp != null ? `${row.net_lending_pct_gdp > 0 ? "+" : ""}${row.net_lending_pct_gdp} %` : "–"}</strong>
      ) : <span className="e-hint">Vie osoitin pääkuvaajan päälle vuosille 1975–2025.</span>}
      <p className="e-cum-note">Tuottavuuden kasvu hidastui noin 3 %:sta (1975–2007) alle 1 %:iin vuoden 2008 jälkeen, kun etuudet nousivat 14 %:sta lähes 20 %:iin BKT:sta ja julkinen talous kääntyi pysyvästi alijäämäiseksi. Luvut ovat kirjanpitoa, eivät todista syy-yhteyttä; mitattu aineisto ei muuta tulkinnallista käyrää.</p>
    </section>
  );
}
