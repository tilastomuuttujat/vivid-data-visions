import { useMemo, useState } from "react";
import { MeasuredEvidence, hasMeasured } from "@/components/evidence/Measured";
import { MainLinks } from "@/components/MainLinks";
import { ERAS, NOW, YEAR_MAX, YEAR_MIN } from "@/components/kaari/kaari-model";
import "@/components/kaari/kaari.css";
import { OBSERVABLES, factorsFor, sample, whyAt, type Sample } from "./erotus-model";
import { DEBATES } from "./debates";
import "./erotus.css";

const W = 1200, H = 560, PAD = { l: 20, r: 20, t: 36, b: 40 };
const x = (yr: number) => PAD.l + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b);

/** Catmull-Rom → Bézier for a smooth curve through samples. */
function smooth(pts: [number, number][]) {
  return pts.map(([px, py], i) => {
    if (i === 0) return `M${px},${py}`;
    const p0 = pts[i - 2] ?? pts[i - 1]!, p1 = pts[i - 1]!, p2 = pts[i]!, p3 = pts[i + 1] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${px},${py}`;
  }).join(" ");
}

/** Split into contiguous sign segments and build closed band polygons between curves. */
function bands(s: Sample[]) {
  const out: { pos: boolean; d: string }[] = [];
  let seg: Sample[] = [];
  const flush = () => {
    if (seg.length < 2) { seg = []; return; }
    const top = seg.map((p) => [x(p.year), y(p.value)] as [number, number]);
    const bot = seg.map((p) => [x(p.year), y(p.total)] as [number, number]).reverse();
    out.push({ pos: seg[0]!.delta >= 0, d: `${smooth(top)} L${bot[0]![0]},${bot[0]![1]} ${smooth(bot).slice(1).replace(/^[^C]*/, "")} Z` });
    seg = [];
  };
  for (let i = 0; i < s.length; i++) {
    const p = s[i]!;
    const prev = seg.at(-1);
    if (prev && (prev.delta >= 0) !== (p.delta >= 0)) {
      const t = prev.delta / (prev.delta - p.delta);
      const yr = prev.year + t * (p.year - prev.year);
      const v = prev.total + t * (p.total - prev.total);
      const cross = { year: yr, total: v, value: v, delta: 0 };
      seg.push({ ...cross, delta: prev.delta });
      flush();
      seg.push({ ...cross, delta: p.delta });
    }
    seg.push(p);
  }
  flush();
  return out;
}

/** Plain-language reading of the shadow at one year: cushion below the total, ballast above it. */
export function readShadow(label: string, delta: number): string {
  const pts = Math.abs(delta * 100).toFixed(0);
  if (Math.abs(delta) < 0.005) return `${label} ei vielä siirrä kokonaisuutta.`;
  return delta > 0
    ? `${label} kantaa kokonaisuutta +${pts} pistettä. Ilman sitä valkoinen viiva putoaisi varjon pohjalle.`
    : `${label} painaa kokonaisuutta −${pts} pistettä. Ilman sitä valkoinen viiva nousisi varjon laelle.`;
}

export function Erotus() {
  const [mode, setMode] = useState<"yksi" | "pari" | "debatti">("yksi");
  const [sel, setSel] = useState("ict");
  const [selB, setSelB] = useState("metsa");
  const [slot, setSlot] = useState<"a" | "b">("a");
  const [debate, setDebate] = useState(DEBATES[0]!.id);
  const [open, setOpen] = useState(false);
  const deb = DEBATES.find((d) => d.id === debate)!;
  const pair = mode !== "yksi";
  const idA = mode === "debatti" ? deb.a : sel, idB = mode === "debatti" ? deb.b : selB;
  const bCost = mode === "debatti" && !!deb.bAsCost;
  const obsA = OBSERVABLES.find((o) => o.id === idA)!;
  const obsBRaw = OBSERVABLES.find((o) => o.id === idB)!;
  const obsB = useMemo(() => (bCost && deb.bLabel ? { ...obsBRaw, label: deb.bLabel } : obsBRaw), [bCost, deb.bLabel, obsBRaw]);
  const sA = useMemo(() => sample(obsA, 1), [obsA]);
  const sB = useMemo(() => {
    const raw = sample(obsB, 1);
    return bCost ? raw.map((p) => { const d = -Math.abs(p.delta); return { ...p, delta: d, value: p.total - d }; }) : raw;
  }, [obsB, bCost]);
  const [hover, setHover] = useState<number | null>(null);
  const obs = obsA;
  const s = sA;
  const factors = useMemo(() => factorsFor(obs, s), [obs, s]);
  const groups = [...new Set(OBSERVABLES.map((o) => o.group))];
  const h = hover != null ? s.reduce((a, b) => (Math.abs(b.year - hover) < Math.abs(a.year - hover) ? b : a)) : null;
  const totalPath = smooth(s.map((p) => [x(p.year), y(p.total)]));
  const valuePath = smooth(s.map((p) => [x(p.year), y(p.value)]));
  const hB = h ? sB.find((p) => p.year === h.year) ?? null : null;
  // Net difference A + B (B is negative when read as a cost): band between total and total + net.
  const sNet = useMemo<Sample[]>(() => sA.map((p, i) => {
    const net = p.delta + (sB[i]?.delta ?? 0);
    return { ...p, delta: net, value: p.total + net };
  }), [sA, sB]);
  const hNet = h ? sNet.find((p) => p.year === h.year) ?? null : null;
  const pick = (id: string) => {
    if (mode === "pari") { if (slot === "a") { setSel(id); setSlot("b"); } else { setSelB(id); setSlot("a"); setOpen(false); } }
    else { setSel(id); setOpen(false); }
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.round(YEAR_MIN + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (YEAR_MAX - YEAR_MIN)));
  };

  return (
    <main className="k-page">
      <nav className="k-nav"><MainLinks /></nav>
      <header className="k-head">
        <p className="k-kicker">Kehitysversio · Erotusanalyysi</p>
        <h1>Mitä yksi tekijä tekee kokonaisuudelle?</h1>
        <p className="k-lede">Paksu valkoinen käyrä on yhteiskunnan rakenteellinen kantokyky. Ohut kultainen käyrä näyttää, missä kokonaisuus olisi ilman valittua tekijää – viivoitettu väli on tekijän vaikutus.</p>
      </header>

      <div className="e-modes" role="tablist">
        {([["yksi", "Yksittäinen tekijä"], ["pari", "Vapaa parivertailu"], ["debatti", "Debatit & myytit"]] as const).map(([m, l]) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{l}</button>
        ))}
      </div>

      {mode === "yksi" && (
        <button className="e-open" onClick={() => setOpen(true)} aria-expanded={open}>
          <span aria-hidden>☰</span> Tarkasteltava tekijä: <strong>{obs.label}</strong>
        </button>
      )}
      {mode === "pari" && (
        <div className="e-pairbar">
          <button className="e-open e-a" onClick={() => { setSlot("a"); setOpen(true); }}><span aria-hidden>☰</span> A: <strong>{obsA.label}</strong></button>
          <span className="e-vs">vs.</span>
          <button className="e-open e-b" onClick={() => { setSlot("b"); setOpen(true); }}><span aria-hidden>☰</span> B: <strong>{obsB.label}</strong></button>
        </div>
      )}
      {mode === "debatti" && (
        <div className="e-debates">
          {DEBATES.map((d) => <button key={d.id} className={d.id === debate ? "on" : ""} onClick={() => setDebate(d.id)}>{d.title}</button>)}
        </div>
      )}

      <div className={`e-scrim ${open ? "on" : ""}`} onClick={() => setOpen(false)} aria-hidden />
      <aside className={`e-drawer ${open ? "on" : ""}`} aria-label="Havainnointikäyrä" aria-hidden={!open}>
        <div className="e-drawer-head">
          <span>{mode === "pari" ? `Valitse tekijä ${slot.toUpperCase()}` : "Valitse tekijä"}</span>
          <button onClick={() => setOpen(false)} aria-label="Sulje">×</button>
        </div>
        {groups.map((g) => (
          <section key={g}>
            <h3>{g}</h3>
            {OBSERVABLES.filter((o) => o.group === g).map((o) => (
              <button key={o.id} tabIndex={open ? 0 : -1} className={o.id === (mode === "pari" && slot === "b" ? selB : sel) ? "on" : ""} onClick={() => pick(o.id)}>{o.label}</button>
            ))}
          </section>
        ))}
      </aside>

      {!pair && (
        <div className="e-guide" aria-label="Miten luet varjoa?">
          <strong>Miten luet varjoa?</strong>
          <span><i className="e-g e-g-pos" /> <b>Kannatustyyny</b> valkoisen viivan alla: tekijä kantaa kokonaisuutta. Ilman sitä kokonaisuus putoaisi varjon pohjalle (katkoviiva).</span>
          <span><i className="e-g e-g-neg" /> <b>Painolasti</b> valkoisen viivan päällä: tekijä painaa kokonaisuutta. Ilman sitä kokonaisuus nousisi varjon laelle (katkoviiva).</span>
        </div>
      )}
      <div className="k-chart">
        <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${obs.label}: vaikutus kokonaisuuteen`}>
          <defs>
            <pattern id="e-hatch-pos" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" className="e-hatch-bg-pos" />
              <line x1="0" y1="0" x2="0" y2="7" className="e-hatch-pos" />
            </pattern>
            <pattern id="e-hatch-neg" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
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
          {[1900, 1950, 2000, 2050].map((yr) => <text key={yr} x={x(yr)} y={H - 16} textAnchor="middle" className="k-axis">{yr}</text>)}
          <line x1={x(NOW)} x2={x(NOW)} y1={PAD.t} y2={H - PAD.b} className="k-now" />
          {bands(pair ? sNet : s).map((b, i) => <path key={i} d={b.d} fill={`url(#e-hatch-${b.pos ? "pos" : "neg"})`} className="e-band" />)}
          {!pair && <path d={valuePath} className="e-value" />}
          <path d={totalPath} className="e-total" />
          {!pair && factors.map((f, i) => {
            const pos = f.delta >= 0;
            const prev = factors[i - 1];
            const stack = prev && (prev.delta >= 0) === pos && f.year - prev.year < 30 ? (i % 2 ? 40 : 0) : 0;
            const fx = x(f.year), fy = y(pos ? f.total : f.value) + (pos ? -8 : 8);
            const ly = pos ? Math.max(PAD.t + 16, fy - 46 - stack) : Math.min(H - PAD.b - 22, fy + 30 + stack);
            const anchor = fx > W - 200 ? "end" : fx < 180 ? "start" : "middle";
            return (
              <g key={f.year + f.label} className={`e-factor ${pos ? "pos" : "neg"}`}>
                <line x1={fx} x2={fx} y1={fy} y2={ly + (pos ? 22 : -14)} />
                <text x={fx} y={ly} textAnchor={anchor}>
                  <tspan className="e-f-title">{pos ? "+ " : "− "}{f.label}</tspan>
                  {f.why && <tspan x={fx} dy="15" className="e-f-why">{f.why}</tspan>}
                </text>
              </g>
            );
          })}
          {h && (
            <g>
              <line x1={x(h.year)} x2={x(h.year)} y1={PAD.t} y2={H - PAD.b} className="e-cursor" />
              {!pair && <circle cx={x(h.year)} cy={y(h.value)} r={4} className="e-dot-value" />}
              <circle cx={x(h.year)} cy={y(h.total)} r={5} className="e-dot-total" />
            </g>
          )}
        </svg>
      </div>
      {pair ? (
        <div className="e-readout">
          <div><span className="e-sw e-sw-total" /> Kokonaisuus</div>
          <div>A: {obsA.label} · B: {obsB.label}</div>
          <div><i className="e-g e-g-pos" /> Viivoitus = erotus A + B: turkoosi yläpuolella, kun hyöty on suurempi; punainen alapuolella, kun rasite on suurempi.</div>
          {h && hB && hNet ? (
            <strong className={Math.abs(hNet.delta) < 0.005 ? "" : hNet.delta >= 0 ? "pos" : "neg"}>{h.year}: <span className="e-ta">A {h.delta >= 0 ? "+" : "−"}{Math.abs(h.delta * 100).toFixed(0)}</span> · <span className="e-tb">B {hB.delta >= 0 ? "+" : "−"}{Math.abs(hB.delta * 100).toFixed(0)}</span> → erotus {hNet.delta >= 0 ? "+" : "−"}{Math.abs(hNet.delta * 100).toFixed(0)} pistettä. {Math.abs(hNet.delta) < 0.005 ? "Tekijät kumoavat toisensa." : hNet.delta > 0 ? `${obsA.label} on suurempi kuin ${obsB.label.toLowerCase()}.` : `${obsB.label} ylittää: ${obsA.label.toLowerCase()}.`}</strong>
          ) : <span className="e-hint">Vie osoitin kuvaajan päälle verrataksesi vuotta.</span>}
        </div>
      ) : (
      <div className="e-readout">
        <div><span className="e-sw e-sw-total" /> Kokonaisuus</div>
        <div><span className="e-sw e-sw-value" /> Kokonaisuus ilman: {obs.label}</div>
        {h ? (
          <strong className={Math.abs(h.delta) < 0.005 ? "" : h.delta >= 0 ? "pos" : "neg"}>
            {h.year}: {readShadow(obs.label, h.delta)} {whyAt(factors, h.year, h.delta)}
          </strong>
        ) : <span className="e-hint">Vie osoitin kuvaajan päälle nähdäksesi vuoden vaikutuksen.</span>}
      </div>
      )}
      {mode === "debatti" && (
        <div className="e-debate-card">
          <div><h3>Julkinen väite</h3><p>”{deb.claim}”</p></div>
          <div><h3>Mitä rakenne näyttää</h3><p>{deb.reading}</p></div>
        </div>
      )}
      {!pair && <p className="e-note">{obs.note}</p>}
      {(hasMeasured(idA) || (pair && hasMeasured(idB))) && <MeasuredEvidence factor={hasMeasured(idA) ? idA : idB} year={h?.year} />}
      <details className="e-method">
        <summary>Miten vaikutus on laskettu?</summary>
        <p>Kokonaisuus = kolmen päävoiman keskiarvo, josta vähennetään puolet siitä osuudesta, jolla yhteisen turvan lupaukset ylittävät tuotannon ja väestön kantokyvyn. Tekijän vaikutus = sen painoarvo kokonaisuudessa × muutos tekijän lähtötasosta (päävoimat 1/3, alavirrat 0,3, väestöryhmät 0,25). Tekijä, jota ei vielä ollut, ei siirrä kokonaisuutta. Kaikki käyrät ovat toimituksellisia tulkintoja, eivät mittauksia; vaikutus kertoo suuntaa, ei todistettua syy-yhteyttä.</p>
      </details>
    </main>
  );
}
