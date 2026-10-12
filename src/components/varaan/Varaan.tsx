import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import source from '@/data/anchors.json';

interface Step { short_title: string; title: string; period: string; years: number[]; theme_ids: number[]; explanation: string; mechanism: string; benefit: string; tradeoff: string; affected: string; lag: string; alternative?: string | null }
interface Anchor { id: string; title: string; period: string; question: string; steps: Step[] }
const anchors = ([...(source as { anchors: Anchor[] }).anchors]).sort((a, b) => (a.steps[0]?.years[0] ?? 0) - (b.steps[0]?.years[0] ?? 0));

const Y0 = 1850, Y1 = 2050;
// Non-linear time: recent decades get more room, roots stay visible.
const tx = (y: number) => Math.pow((Math.min(Y1, Math.max(Y0, y)) - Y0) / (Y1 - Y0), 0.62);
const mid = (s: Step) => ((s.years[0] ?? 0) + (s.years[1] ?? s.years[0] ?? 0)) / 2;

function River({ active, onPick }: { active: Anchor; onPick: (id: string) => void }) {
  const W = 1000, H = 150;
  const ticks = [1850, 1900, 1950, 1975, 2000, 2025, 2050];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="v-river" role="img" aria-label="Kaikki 16 polkua ajan virrassa">
      <defs>
        <linearGradient id="riv" x1="0" x2="1"><stop offset="0" stopColor="var(--v-root)" /><stop offset=".55" stopColor="var(--v-glow)" /><stop offset="1" stopColor="var(--v-ember)" /></linearGradient>
      </defs>
      {ticks.map(t => <g key={t}><line x1={tx(t) * W} x2={tx(t) * W} y1={8} y2={H - 18} className="v-tick" /><text x={tx(t) * W} y={H - 4} className="v-ticklabel">{t}</text></g>)}
      {anchors.map((a, i) => {
        const y = 14 + i * ((H - 40) / (anchors.length - 1));
        const xs = a.steps.map(s => tx(mid(s)) * W), x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 6);
        const on = a.id === active.id;
        return <g key={a.id} className={`v-strand ${on ? 'on' : ''}`} onClick={() => onPick(a.id)}>
          <title>{a.title}</title>
          <rect x={0} y={y - 4} width={W} height={8} fill="transparent" />
          <path d={`M${x0} ${y} C ${(x0 + x1) / 2} ${y - (on ? 5 : 2)}, ${(x0 + x1) / 2} ${y + (on ? 5 : 2)}, ${x1} ${y}`} stroke={on ? 'url(#riv)' : 'currentColor'} />
          {xs.map((x, k) => <circle key={k} cx={x} cy={y} r={on ? 3 : 1.4} />)}
        </g>;
      })}
    </svg>
  );
}

function Chain({ a, idx, setIdx }: { a: Anchor; idx: number; setIdx: (n: number) => void }) {
  const W = 1000, H = 360, pad = 70, n = a.steps.length;
  const pts = a.steps.map((_, i) => ({ x: pad + (i * (W - pad * 2)) / Math.max(1, n - 1), y: 150 + Math.sin(i * 1.3 + a.id.length) * 46 }));
  const d = pts.reduce((acc, p, i) => { if (!i) return `M${p.x} ${p.y}`; const q = pts[i - 1]!; const cx = (q.x + p.x) / 2; return `${acc} C ${cx} ${q.y}, ${cx} ${p.y}, ${p.x} ${p.y}`; }, '');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="v-chain" key={a.id}>
      <defs>
        <linearGradient id="flow" x1="0" x2="1"><stop offset="0" stopColor="var(--v-root)" /><stop offset=".5" stopColor="var(--v-glow)" /><stop offset="1" stopColor="var(--v-ember)" /></linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="9" /></filter>
        <radialGradient id="halo"><stop offset="0" stopColor="var(--v-glow)" stopOpacity=".55" /><stop offset="1" stopColor="var(--v-glow)" stopOpacity="0" /></radialGradient>
      </defs>
      <path d={d} className="v-flow-glow" filter="url(#blur)" />
      <path d={d} className="v-flow" />
      <path d={d} className="v-flow-pulse" />
      {pts.map((p, i) => {
        const s = a.steps[i]!, on = i === idx, depth = 40 + (i / Math.max(1, n - 1)) * 110;
        return <g key={i} className={`v-node ${on ? 'on' : ''} ${i < idx ? 'past' : ''}`} onClick={() => setIdx(i)} style={{ animationDelay: `${i * 90}ms` }}>
          {/* hidden cost: a root thread sinking beneath the visible gain */}
          <path d={`M${p.x} ${p.y + 10} C ${p.x - 18} ${p.y + depth * .5}, ${p.x + 18} ${p.y + depth * .8}, ${p.x + 4} ${p.y + depth}`} className="v-rootline" />
          <circle cx={p.x + 4} cy={p.y + depth} r={on ? 5 : 3} className="v-rootdot" />
          {on && <circle cx={p.x} cy={p.y} r={58} fill="url(#halo)" />}
          <circle cx={p.x} cy={p.y} r={on ? 15 : 10} className="v-dot" />
          <circle cx={p.x} cy={p.y} r={on ? 26 : 0} className="v-ring" />
          <text x={p.x} y={p.y - 34} className="v-nodeyear">{s.period}</text>
          <text x={p.x} y={p.y - 52} className="v-nodetitle">{s.short_title}</text>
        </g>;
      })}
      <text x={pad - 40} y={H - 12} className="v-legend">↓ ohut juuri = piilohinta, joka syvenee polun edetessä</text>
    </svg>
  );
}

export function Varaan() {
  const [id, setId] = useState(anchors.find(a => a.id === 'maaltamuutto')?.id ?? anchors[0]!.id);
  const [idx, setIdx] = useState(0);
  const a = useMemo(() => anchors.find(x => x.id === id) ?? anchors[0]!, [id]);
  const s = a.steps[Math.min(idx, a.steps.length - 1)]!;
  const pick = (next: string) => { setId(next); setIdx(0); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') setIdx(i => Math.min(a.steps.length - 1, i + 1)); if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1)); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [a]);
  const ai = anchors.indexOf(a);

  return (
    <div className="varaan">
      <div className="v-aurora" aria-hidden />
      <header className="v-top">
        <Link to="/" className="v-back"><ArrowLeft size={15} />Atlas</Link>
        <div className="v-brand">Suomen rakennemuutosten atlas</div>
      </header>

      <section className="v-hero">
        <p className="v-kicker">Havaintomalli · 16 murrospolkua · 1866–2045</p>
        <h1>Minkä varaan <em>Suomi rakentuu?</em></h1>
        <p className="v-lede">Ei syyllisiä, vaan perustuksia. Jokainen polku näyttää, minkä oletuksen varaan ratkaisu rakennettiin, mitä se tuotti — ja mikä hinta jäi kytemään pinnan alle, kunnes olosuhteet muuttuivat.</p>
      </section>

      <section className="v-stage">
        <River active={a} onPick={pick} />
        <div className="v-pathhead">
          <button className="v-arrow" aria-label="Edellinen polku" onClick={() => pick(anchors[(ai - 1 + anchors.length) % anchors.length]!.id)}><ChevronLeft /></button>
          <div>
            <span className="v-period">{a.period}</span>
            <h2>{a.title}</h2>
            <p className="v-question">{a.question}</p>
          </div>
          <button className="v-arrow" aria-label="Seuraava polku" onClick={() => pick(anchors[(ai + 1) % anchors.length]!.id)}><ChevronRight /></button>
        </div>
        <Chain a={a} idx={idx} setIdx={setIdx} />
      </section>

      <section className="v-reading" key={`${a.id}-${idx}`}>
        <div className="v-step-title">
          <span>Vaihe {idx + 1} / {a.steps.length} · {s.period}</span>
          <h3>{s.title}</h3>
          <p>{s.explanation}</p>
        </div>
        <ol className="v-mech">
          <li className="m-base"><b>Minkä varaan</b><p>{s.mechanism}</p></li>
          <li className="m-gain"><b>Mitä se tuotti</b><p>{s.benefit}</p></li>
          <li className="m-cost"><b>Piilohinta</b><p>{s.tradeoff}</p></li>
          <li className="m-lag"><b>Viive</b><p>{s.lag}</p></li>
          <li className="m-where"><b>Missä vaikutus näkyy</b><p>{s.affected}</p></li>
        </ol>
        {s.alternative && <p className="v-alt"><b>Toinen selitys</b> {s.alternative}</p>}
        <div className="v-nav">
          <button disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ArrowLeft size={16} />Edellinen vaihe</button>
          {idx < a.steps.length - 1
            ? <button className="primary" onClick={() => setIdx(idx + 1)}>Seuraava vaihe<ArrowRight size={16} /></button>
            : <button className="primary" onClick={() => pick(anchors[(ai + 1) % anchors.length]!.id)}>Seuraava polku<ArrowRight size={16} /></button>}
        </div>
      </section>

      <section className="v-index">
        <h4>Kaikki polut ajassa</h4>
        <div className="v-cards">
          {anchors.map(x => <button key={x.id} className={x.id === a.id ? 'on' : ''} onClick={() => { pick(x.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span>{x.period}</span>{x.title.split(' – ')[0]}
          </button>)}
        </div>
      </section>
    </div>
  );
}
