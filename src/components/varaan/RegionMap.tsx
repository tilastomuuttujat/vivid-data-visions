import { useEffect, useState } from 'react';
import geo from '@/data/maakunnat.json';

interface RPoint { year: number; population: number; domestic_net_migration: number; population_index: number }
export interface RegionalStat { id: string; title: string; source_title: string; source_url: string; definition: string; limits: string; selection_reason?: string; regions: { id: string; title: string; color: string; points: RPoint[] }[] }

const G = geo as { width: number; height: number; regions: { id: string; name: string; path: string }[] };

/** Compact province map + index chart; the year sweeps automatically so the divergence unfolds. */
export function RegionMap({ stat }: { stat: RegionalStat }) {
  const years = stat.regions[0]!.points.map(p => p.year);
  const [yi, setYi] = useState(years.length - 1);
  const [run, setRun] = useState(true);
  useEffect(() => { setYi(0); setRun(true); }, [stat.id]);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setYi(i => { if (i >= years.length - 1) { setRun(false); return i; } return i + 1; }), 160);
    return () => clearInterval(t);
  }, [run, years.length]);
  const year = years[yi]!;
  const all = stat.regions.flatMap(r => r.points.map(p => p.population_index));
  const lo = Math.min(...all), hi = Math.max(...all);
  const W = 220, H = 120, X = (i: number) => 6 + (i / (years.length - 1)) * (W - 12), Y = (v: number) => H - 16 - ((v - lo) / (hi - lo)) * (H - 30);
  const byId = new Map(stat.regions.map(r => [r.id, r]));
  return (
    <div className="v-region">
      <b className="v-ev-head">Missä se näkyy · {stat.regions.map(r => r.title).join(' ja ')}</b>
      <div className="v-region-body">
        <svg viewBox={`-4 -4 ${G.width + 8} ${G.height + 8}`} className="v-region-map" role="img" aria-label="Suomen maakunnat">
          {G.regions.map(r => {
            const s = byId.get(r.id); const idx = s?.points[yi]?.population_index ?? 100;
            return <path key={r.id} d={r.path} className={s ? 'on' : ''} style={s ? { fill: s.color, fillOpacity: 0.35 + Math.min(0.6, Math.abs(idx - 100) / 40) } : undefined}><title>{r.name}{s ? ` · indeksi ${idx.toFixed(1)} (${year})` : ''}</title></path>;
          })}
        </svg>
        <div className="v-region-side">
          <svg viewBox={`0 0 ${W} ${H}`} className="v-spark" role="img" aria-label="Väestöindeksi 1990=100" onClick={() => { setYi(0); setRun(true); }}>
            <line x1={6} x2={W - 6} y1={Y(100)} y2={Y(100)} className="v-region-base" />
            {stat.regions.map(r => <g key={r.id}>
              <path d={r.points.slice(0, yi + 1).map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.population_index).toFixed(1)}`).join(' ')} fill="none" stroke={r.color} strokeWidth={2.2} strokeLinecap="round" />
              <circle cx={X(yi)} cy={Y(r.points[yi]!.population_index)} r={3} fill={r.color} />
            </g>)}
            <text x={6} y={H - 2} className="v-spark-lbl">{years[0]}</text>
            <text x={W - 6} y={H - 2} className="v-spark-lbl" textAnchor="end">{years[years.length - 1]}</text>
            <text x={W / 2} y={12} className="v-region-year" textAnchor="middle">{year}</text>
          </svg>
          <ul className="v-region-leg">
            {stat.regions.map(r => { const p = r.points[yi]!; return <li key={r.id}><i style={{ background: r.color }} />{r.title} <b>{p.population_index.toFixed(0)}</b><span>nettomuutto {p.domestic_net_migration > 0 ? '+' : ''}{p.domestic_net_migration.toLocaleString('fi-FI')}</span></li>; })}
          </ul>
        </div>
      </div>
      <p className="v-ev-limit" title={stat.definition}>Väestöindeksi, 1990 = 100. {stat.limits}</p>
      <a href={stat.source_url} target="_blank" rel="noreferrer">{stat.source_title} ↗</a>
    </div>
  );
}
