interface Point { year: number; value: number }
export interface Stat { id: string; title: string; unit: string; source_title: string; source_url: string; definition: string; limits: string; comparability?: string; points: Point[] }
export interface Source { id: string; title: string; url: string }

const fmt = (v: number) => v >= 1000 ? `${Math.round(v / 1000)} t.` : String(v);

function Spark({ stat, years }: { stat: Stat; years: number[] }) {
  const W = 300, H = 92, p = 4;
  const pts = stat.points;
  const x0 = pts[0]!.year, x1 = pts[pts.length - 1]!.year;
  const vmin = Math.min(...pts.map(q => q.value)), vmax = Math.max(...pts.map(q => q.value));
  const X = (y: number) => p + ((y - x0) / Math.max(1, x1 - x0)) * (W - p * 2);
  const Y = (v: number) => H - 14 - ((v - vmin) / Math.max(1, vmax - vmin)) * (H - 28);
  const segs: Point[][] = [[]];
  pts.forEach(q => { if (q.year === 1994) segs.push([]); segs[segs.length - 1]!.push(q); });
  const line = (s: Point[]) => s.map((q, i) => `${i ? 'L' : 'M'}${X(q.year).toFixed(1)} ${Y(q.value).toFixed(1)}`).join(' ');
  const a = Math.max(x0, years[0] ?? x0), b = Math.min(x1, years[1] ?? years[0] ?? x1);
  const peak = pts.reduce((m, q) => q.value > m.value ? q : m, pts[0]!);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="v-spark" role="img" aria-label={stat.title}>
      <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--v-glow)" stopOpacity=".35" /><stop offset="1" stopColor="var(--v-glow)" stopOpacity="0" /></linearGradient></defs>
      {a <= b && <rect x={X(a)} y={2} width={Math.max(3, X(b) - X(a))} height={H - 16} className="v-spark-win" />}
      {segs.filter(s => s.length).map((s, i) => <g key={i}>
        <path d={`${line(s)} L${X(s[s.length - 1]!.year)} ${H - 14} L${X(s[0]!.year)} ${H - 14}Z`} fill="url(#spk)" />
        <path d={line(s)} className="v-spark-line" />
      </g>)}
      <circle cx={X(peak.year)} cy={Y(peak.value)} r={2.6} className="v-spark-peak" />
      <text x={X(peak.year)} y={Y(peak.value) - 5} className="v-spark-lbl" textAnchor="middle">{fmt(peak.value)} · {peak.year}</text>
      <text x={p} y={H - 2} className="v-spark-lbl">{x0}</text>
      <text x={W - p} y={H - 2} className="v-spark-lbl" textAnchor="end">{x1}</text>
    </svg>
  );
}

export function Evidence({ stat, note, sources, years }: { stat?: Stat | undefined; note?: string | null; sources: Source[]; years: number[] }) {
  if (!stat && !note && !sources.length) return null;
  return (
    <div className="v-evidence">
      <b className="v-ev-head">Evidenssi</b>
      {stat ? <>
        <p className="v-ev-title">{stat.title} <span>({stat.unit})</span></p>
        <Spark stat={stat} years={years} />
        <p className="v-ev-limit" title={stat.definition}>{stat.limits}</p>
        <a href={stat.source_url} target="_blank" rel="noreferrer">{stat.source_title} ↗</a>
      </> : <p className="v-ev-none">Tälle vaiheelle ei ole vielä kytketty tilastosarjaa.</p>}
      {note && <p className="v-ev-note">{note}</p>}
      {!stat && sources.length > 0 && <ul className="v-ev-src">{sources.map(s => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></li>)}</ul>}
    </div>
  );
}
