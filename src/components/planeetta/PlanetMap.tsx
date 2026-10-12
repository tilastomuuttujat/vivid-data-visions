import { useEffect, useRef, useState } from 'react';
import { H, PLATES, TENSIONS, W, pathPoints, type Sel } from './planet-model';

const MIN = 0.8, MAX = 26;
const lvl = (k: number) => (k < 1.7 ? 0 : k < 4 ? 1 : k < 9 ? 2 : 3);
const fade = (k: number, from: number, to: number) => Math.max(0, Math.min(1, (k - from) / (to - from)));

function blob(cx: number, cy: number, r: number, seed: number) {
  const pts: number[][] = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const rr = r * (0.82 + 0.18 * Math.sin(a * 3 + seed) * Math.cos(a * 2 - seed));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8];
  });
  const P = pts as [number, number][];
  let d = `M${(P[0]![0] + P[13]![0]) / 2},${(P[0]![1] + P[13]![1]) / 2}`;
  P.forEach((p, i) => { const n = P[(i + 1) % 14]!; d += ` Q${p[0]},${p[1]} ${(p[0] + n[0]) / 2},${(p[1] + n[1]) / 2}`; });
  return d + 'Z';
}

export function PlanetMap({ sel, onSel, onLevel }: { sel: Sel; onSel: (s: Sel) => void; onLevel: (l: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState({ k: 1, x: 0, y: 0 });
  const vr = useRef(v); vr.current = v;
  const anim = useRef(0);

  useEffect(() => { onLevel(lvl(v.k)); }, [v.k, onLevel]);

  const toScreen = () => { const r = ref.current!.getBoundingClientRect(); return { r, s: r.width / W }; };

  const flyTo = (wx: number, wy: number, k: number) => {
    const { r, s } = toScreen();
    const target = { k, x: r.width / 2 / s - wx * k, y: r.height / 2 / s - wy * k };
    const start = { ...vr.current }; const t0 = performance.now();
    cancelAnimationFrame(anim.current);
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      const kk = start.k * Math.pow(target.k / start.k, e);
      setV({ k: kk, x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e });
      if (p < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); cancelAnimationFrame(anim.current);
      const { r, s } = toScreen();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const c = vr.current; const nk = Math.min(MAX, Math.max(MIN, c.k * Math.exp(-dy * 0.0012)));
      const px = (e.clientX - r.left) / s, py = (e.clientY - r.top) / s, f = nk / c.k;
      setV({ k: nk, x: px - (px - c.x) * f, y: py - (py - c.y) * f });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const k = v.k;
  const fs = (px: number) => px / k; // constant on-screen font size

  const plateO = 1 - fade(k, 3, 6) * 0.6;
  const clusterO = fade(k, 1.4, 2.2);
  const pathO = fade(k, 3.2, 4.5);
  const stepLblO = fade(k, 8, 10);

  return (
    <div ref={ref} className="pl-map" style={{ touchAction: 'none' }}
      onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
      onPointerMove={e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true; if (!d.moved) return; cancelAnimationFrame(anim.current); const { s } = toScreen(); d.x = e.clientX; d.y = e.clientY; setV(c => ({ ...c, x: c.x + dx / s, y: c.y + dy / s })); }}
      onPointerUp={() => { setTimeout(() => (drag.current = null), 0); }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {PLATES.map(p => <radialGradient key={p.id} id={`g-${p.id}`}><stop offset="0%" stopColor={p.color} stopOpacity=".55" /><stop offset="70%" stopColor={p.color} stopOpacity=".12" /><stop offset="100%" stopColor={p.color} stopOpacity="0" /></radialGradient>)}
          <filter id="pl-glow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <g transform={`translate(${v.x} ${v.y}) scale(${k})`}>
          {/* graticule */}
          {Array.from({ length: 21 }, (_, i) => <line key={'v' + i} x1={i * 50} y1={0} x2={i * 50} y2={H} className="pl-grid" strokeWidth={1 / k} />)}
          {Array.from({ length: 15 }, (_, i) => <line key={'h' + i} x1={0} y1={i * 50} x2={W} y2={i * 50} className="pl-grid" strokeWidth={1 / k} />)}

          {PLATES.map((p, i) => (
            <g key={p.id} opacity={plateO} className="pl-hit" onClick={() => { if (drag.current?.moved) return; onSel({ kind: 'plate', plate: p }); flyTo(p.x, p.y, 2.4); }}>
              <ellipse cx={p.x} cy={p.y} rx={p.r * 1.25} ry={p.r} fill={`url(#g-${p.id})`} />
              <path d={blob(p.x, p.y, p.r, i * 1.7)} fill="none" stroke={p.color} strokeOpacity={sel?.kind === 'plate' && sel.plate.id === p.id ? 0.9 : 0.35} strokeWidth={1.5 / k} strokeDasharray={`${6 / k} ${5 / k}`} />
              <text x={p.x} y={p.y - p.r * 0.86} className="pl-plate" fontSize={fs(k < 1.7 ? 22 : 15)} opacity={1 - clusterO * 0.5}>{p.name}</text>
            </g>
          ))}

          {TENSIONS.map(t => {
            const a = PLATES.find(p => p.id === t.a)!, b = PLATES.find(p => p.id === t.b)!;
            const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), cx = (a.x + b.x) / 2 - dy / L * 90, cy = (a.y + b.y) / 2 + dx / L * 90; const mx = (a.x + b.x) / 4 + cx / 2, my = (a.y + b.y) / 4 + cy / 2; const on = sel?.kind === 'tension' && sel.t.id === t.id;
            return (
              <g key={t.id} className="pl-hit" opacity={1 - clusterO * 0.75} onClick={() => { if (drag.current?.moved) return; onSel({ kind: 'tension', t }); }}>
                <path d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`} className="pl-fault" strokeWidth={(on ? 3 : 1.6) / k} strokeDasharray={`${2 / k} ${7 / k}`} fill="none" />
                <circle cx={mx} cy={my} r={(on ? 14 : 9) / k} className="pl-quake" filter="url(#pl-glow)" />
                <circle cx={mx} cy={my} r={3.5 / k} className="pl-quake-core" />
                <text x={mx} y={my + 22 / k} className="pl-tension" fontSize={fs(12)}>{t.name}</text>
              </g>
            );
          })}

          {clusterO > 0 && PLATES.flatMap(p => p.clusters.map(c => (
            <g key={c.id} opacity={clusterO}>
              <circle cx={c.x} cy={c.y} r={62} fill={p.color} fillOpacity={0.07} stroke={p.color} strokeOpacity={0.3} strokeWidth={1 / k} className="pl-hit"
                onClick={() => { if (drag.current?.moved) return; onSel({ kind: 'cluster', c }); flyTo(c.x, c.y, 6); }} />
              <text x={c.x} y={c.y - 66} className="pl-cluster" fontSize={fs(k < 4 ? 15 : 12)} opacity={1 - stepLblO * 0.6}>{c.name}</text>
              {k < 4 && <text x={c.x} y={c.y + 4 / k} className="pl-count" fontSize={fs(11)}>{c.anchors.length} polkua</text>}
              {pathO > 0 && c.anchors.map((a, ai) => {
                const pts = pathPoints(c, ai); const on = (sel?.kind === 'path' || sel?.kind === 'step') && sel.a.id === a.id;
                const d = pts.map((q, i) => (i ? 'L' : 'M') + q.x + ',' + q.y).join(' ');
                return (
                  <g key={a.id} opacity={pathO * (sel && (sel.kind === 'path' || sel.kind === 'step') && !on ? 0.35 : 1)}>
                    <path d={d} fill="none" stroke={p.color} strokeWidth={(on ? 3 : 1.6) / k} strokeLinecap="round" className="pl-hit" onClick={() => { if (drag.current?.moved) return; onSel({ kind: 'path', c, a }); flyTo(pts[Math.floor(pts.length / 2)].x, pts[Math.floor(pts.length / 2)].y, 11); }} />
                    {pts.map((q, si) => {
                      const s = a.steps[si]; const sOn = sel?.kind === 'step' && sel.s === s;
                      return (
                        <g key={si} className="pl-hit" onClick={() => { if (drag.current?.moved) return; onSel({ kind: 'step', c, a, s }); flyTo(q.x, q.y, 18); }}>
                          <circle cx={q.x} cy={q.y} r={(sOn ? 6 : 3.4) / k} fill={si === pts.length - 1 ? 'var(--v-ember)' : p.color} stroke="var(--v-ink)" strokeWidth={1 / k} />
                          {stepLblO > 0 && <text x={q.x + 6 / k} y={q.y + 3 / k} className="pl-step" fontSize={fs(10.5)} opacity={stepLblO}>{s.years?.[0]} · {s.short_title}</text>}
                        </g>
                      );
                    })}
                    {k >= 4.5 && stepLblO < 1 && <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y + 11 / k} className="pl-path" fontSize={fs(10.5)} opacity={1 - stepLblO}>{a.title.split(' – ')[0].split(':').slice(-1)[0].trim()}</text>}
                  </g>
                );
              })}
            </g>
          )))}
        </g>
      </svg>
      <div className="pl-zoom">
        <button onClick={() => { const { r, s } = toScreen(); const cx = r.width / 2 / s, cy = r.height / 2 / s; flyTo((cx - v.x) / k, (cy - v.y) / k, Math.min(MAX, k * 2)); }} aria-label="Lähemmäs">+</button>
        <button onClick={() => { const { r, s } = toScreen(); const cx = r.width / 2 / s, cy = r.height / 2 / s; flyTo((cx - v.x) / k, (cy - v.y) / k, Math.max(MIN, k / 2)); }} aria-label="Kauemmas">−</button>
        <button onClick={() => { onSel(null); flyTo(W / 2, H / 2, 1); }} aria-label="Kiertoradalle">◎</button>
      </div>
    </div>
  );
}
