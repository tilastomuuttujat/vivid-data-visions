import { useMemo, useState } from "react";
import { MainLinks } from "@/components/MainLinks";
import { ERAS, NOW, YEAR_MAX, YEAR_MIN } from "@/components/kaari/kaari-model";
import "@/components/kaari/kaari.css";
import { totalAt } from "@/components/erotus/erotus-model";
import "@/components/erotus/erotus.css";
import { BASELINES, factors, linkedSample, points, source, type FactorId, type LinkedSample } from "./model";

const W = 1200, H = 560, PAD = { l: 20, r: 20, t: 36, b: 40 };
const x = (yr: number) => PAD.l + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b);
const firstData = points[0]!.year, lastData = points.at(-1)!.year;

function smooth(pts: [number, number][]) {
  return pts.map(([px, py], i) => {
    if (i === 0) return `M${px},${py}`;
    const p0 = pts[i - 2] ?? pts[i - 1]!, p1 = pts[i - 1]!, p2 = pts[i]!, p3 = pts[i + 1] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${px},${py}`;
  }).join(" ");
}

/** Hatched bands per sign segment, only inside measured years. */
function bands(s: LinkedSample[]) {
  const out: { pos: boolean; d: string }[] = [];
  let seg: LinkedSample[] = [];
  const flush = () => {
    if (seg.length >= 2) {
      const top = seg.map((p) => `${x(p.year)},${y(p.value)}`);
      const bot = seg.map((p) => `${x(p.year)},${y(p.total)}`).reverse();
      out.push({ pos: seg.reduce((a, p) => a + p.delta, 0) >= 0, d: `M${top.join(" L")} L${bot.join(" L")} Z` });
    }
    seg = [];
  };
  for (const p of s) {
    if (!p.measured) { flush(); continue; }
    const prev = seg.at(-1);
    if (prev && (prev.delta >= 0) !== (p.delta >= 0)) { const c = { ...p, value: p.total, delta: 0 }; seg.push(c); flush(); seg.push(c); }
    seg.push(p);
  }
  flush();
  return out;
}

const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} %`;

export function ErotusTuotanto() {
  const [factor, setFactor] = useState<FactorId>("productivity");
  const [baseline, setBaseline] = useState<number>(BASELINES[0]);
  const [hover, setHover] = useState<number | null>(null);
  const s = useMemo(() => linkedSample(factor, baseline, totalAt, YEAR_MIN, YEAR_MAX), [factor, baseline]);
  const meta = factors.find((f) => f.id === factor)!;
  const h = hover != null ? s.find((p) => p.year === hover) ?? null : null;
  const measured = s.filter((p) => p.measured);
  const peak = measured.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a), measured[0]!);
  const end = measured.at(-1)!;
  const labels = [peak, end].filter((p, i, arr) => p && Math.abs(p.delta) > 0.002 && (i === 0 || Math.abs(p.year - arr[0]!.year) > 8));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(YEAR_MIN, Math.min(YEAR_MAX, Math.round(YEAR_MIN + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (YEAR_MAX - YEAR_MIN)))));
  };

  return (
    <main className="k-page">
      <nav className="k-nav"><MainLinks exclude="/erotus-tuotanto" /></nav>
      <header className="k-head">
        <p className="k-kicker">Erotusanalyysi · tuotannon mitatut osuudet</p>
        <h1>Mitä tuotannon osatekijä tekee kokonaisuudelle?</h1>
        <p className="k-lede">Sama pääkäyrä kuin Erotusanalyysissä koko ajalta 1850–2050. Mitattujen vuosien ({firstData}–{lastData}) kohdalla viivoitettu väli näyttää, paljonko valittu tuotannon osatekijä on siirtänyt kokonaisuutta vertailuvuodesta lähtien.</p>
      </header>

      <div className="e-modes" role="tablist" aria-label="Tuotannon osatekijä">
        {factors.map((f) => (
          <button key={f.id} role="tab" aria-selected={factor === f.id} className={factor === f.id ? "on" : ""} onClick={() => setFactor(f.id)}>{f.label}</button>
        ))}
      </div>
      <div className="e-debates" aria-label="Vertailuvuosi">
        {BASELINES.map((b) => (
          <button key={b} className={baseline === b ? "on" : ""} onClick={() => setBaseline(b)}>Vertailuvuosi {b}</button>
        ))}
      </div>

      <div className="k-chart">
        <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${meta.label}: mitattu vaikutus kokonaisuuteen`}>
          <defs>
            <pattern id="et-hatch-pos" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" className="e-hatch-bg-pos" />
              <line x1="0" y1="0" x2="0" y2="7" className="e-hatch-pos" />
            </pattern>
            <pattern id="et-hatch-neg" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="7" height="7" className="e-hatch-bg-neg" />
              <line x1="0" y1="0" x2="0" y2="7" className="e-hatch-neg" />
            </pattern>
          </defs>
          {ERAS.map((e, i) => (
            <g key={e.label}>
              <rect x={x(e.from)} width={x(e.to) - x(e.from)} y={PAD.t} height={H - PAD.t - PAD.b} className={`k-era k-era-${i}`} />
              <text x={x(e.from) + 6} y={PAD.t - 12} className="k-era-label">{e.label}</text>
            </g>
          ))}
          {[1850, 1900, 1950, 2000, 2025, 2050].map((yr) => <text key={yr} x={x(yr)} y={H - 16} textAnchor="middle" className="k-axis">{yr}</text>)}
          <line x1={x(baseline)} x2={x(baseline)} y1={PAD.t} y2={H - PAD.b} className="e-cursor" strokeDasharray="2 4" />
          <line x1={x(NOW)} x2={x(NOW)} y1={PAD.t} y2={H - PAD.b} className="k-now" />
          {bands(s).map((b, i) => <path key={i} d={b.d} fill={`url(#et-hatch-${b.pos ? "pos" : "neg"})`} className="e-band" />)}
          <path d={smooth(s.map((p) => [x(p.year), y(p.value)]))} className="e-value" />
          <path d={smooth(s.map((p) => [x(p.year), y(p.total)]))} className="e-total" />
          {labels.map((p) => {
            const pos = p.delta >= 0;
            const fx = x(p.year), fy = y(pos ? p.total : p.value) + (pos ? -8 : 8);
            const ly = pos ? Math.max(PAD.t + 16, fy - 46) : Math.min(H - PAD.b - 22, fy + 30);
            return (
              <g key={p.year} className={`e-factor ${pos ? "pos" : "neg"}`}>
                <line x1={fx} x2={fx} y1={fy} y2={ly + (pos ? 22 : -14)} />
                <text x={fx} y={ly} textAnchor={fx > W - 200 ? "end" : "middle"}>
                  <tspan className="e-f-title">{pos ? "+ " : "− "}{meta.label} {p.year}</tspan>
                  <tspan x={fx} dy="15" className="e-f-why">{pct(p.share)} BKT/asukas vs. {baseline}</tspan>
                </text>
              </g>
            );
          })}
          {h && (
            <g>
              <line x1={x(h.year)} x2={x(h.year)} y1={PAD.t} y2={H - PAD.b} className="e-cursor" />
              <circle cx={x(h.year)} cy={y(h.value)} r={4} className="e-dot-value" />
              <circle cx={x(h.year)} cy={y(h.total)} r={5} className="e-dot-total" />
            </g>
          )}
        </svg>
      </div>

      <div className="e-readout">
        <div><span className="e-sw e-sw-total" /> Kokonaisuus</div>
        <div><span className="e-sw e-sw-value" /> Kokonaisuus ilman: {meta.label}</div>
        {h ? (
          h.measured ? (
            <strong className={Math.abs(h.delta) < 0.002 ? "" : h.delta >= 0 ? "pos" : "neg"}>
              {h.year}: {h.delta >= 0 ? "+" : "−"}{Math.abs(h.delta * 100).toFixed(1)} pistettä · {meta.label} {pct(h.share)} BKT/asukas ({Math.round(h.euros).toLocaleString("fi-FI")} €) vuodesta {baseline}.
            </strong>
          ) : <strong>{h.year}: ei mitattua osuutta — pääkäyrä näkyy, vaikutusta ei piirretä.</strong>
        ) : <span className="e-hint">Vie osoitin kuvaajan päälle nähdäksesi vuoden vaikutuksen.</span>}
      </div>
      <p className="e-note">{meta.detail}.</p>
      <details className="e-method">
        <summary>Miten vaikutus on laskettu?</summary>
        <p>Pääkäyrä on Erotusanalyysin rakenteellinen kantokyky 1850–2050. BKT asukasta kohti jaetaan Shapley-menetelmällä kolmeen osaan: työn tuottavuus, työtunnit työllistä kohti ja työllisten osuus väestöstä. Osat summautuvat täsmälleen kokonaismuutokseen. Osuus (prosenttia vertailuvuoden BKT/asukkaasta) muunnetaan pääkäyrän pisteiksi ilmoitetulla esitysskaalalla: BKT/asukkaan kaksinkertaistuminen = +0,5 tuotantovoiman tasoa, ja tuotantovoiman paino kokonaisuudessa on 1/3. Suunta ja suhteet ovat mitattuja, pisteskaala on tulkinta. Vuosina ennen vertailuvuotta ja aineiston jälkeen vaikutusta ei piirretä. Jako on kirjanpitoa, ei syy-seuraussuhde.</p>
        <p>Lähde: <a href={source.url}>{source.title}</a>.</p>
      </details>
    </main>
  );
}
