// Mallit 1 ja 3: juurisyypolut aikajanalla. Yksi valittu polku = viivepolku,
// useampi = rinnakkaiset linjat, joiden yhteiset päätökset näkyvät risteyskohtina.
// Vuosien välinen etäisyys on aikaväli, ei mitattu vaikutusviive.
import { PHASES } from "./murrokset-model";
import { ROOT_PATHS, stepDecisions, type RootPath } from "./juurisyyt-model";

export const LANE_TONES = ["var(--m-gold)", "var(--m-teal)", "var(--m-red)", "var(--m-green)"];
const Y0 = 1850;
const Y1 = 2030;
const W = 1000;
const PAD = 40;
const x = (y: number) => PAD + ((y - Y0) / (Y1 - Y0)) * (W - PAD * 2);

type Placed = { path: RootPath; tone: string; steps: { i: number; title: string; era: string; from: number; to: number; ids: { id: string; y: number; name: string }[] }[] };

export function placePaths(ids: string[]): Placed[] {
  return ids.map((id, k) => {
    const path = ROOT_PATHS.find((p) => p.id === id)!;
    return {
      path,
      tone: LANE_TONES[k % LANE_TONES.length]!,
      steps: path.steps.map((s, i) => {
        const ds = stepDecisions(s).map((d) => ({ id: d.id, y: Number(d.vuosi), name: d.paatos }));
        const ys = ds.map((d) => d.y);
        return { i, title: s.title, era: s.era, from: Math.min(...ys), to: Math.max(...ys), ids: ds };
      }),
    };
  });
}

export function sharedDecisions(placed: Placed[]): Set<string> {
  const count = new Map<string, number>();
  for (const p of placed) for (const id of new Set(p.steps.flatMap((s) => s.ids.map((d) => d.id))))
    count.set(id, (count.get(id) ?? 0) + 1);
  return new Set([...count].filter(([, n]) => n > 1).map(([id]) => id));
}

export function PolkuAikajana({ ids, onPick }: { ids: string[]; onPick: (decisionId: string) => void }) {
  const placed = placePaths(ids);
  const shared = sharedDecisions(placed);
  const multi = placed.length > 1;
  const LANE = multi ? 110 : 170;
  const TOP = 46;
  const H = TOP + placed.length * LANE + 30;
  const laneY = (k: number) => TOP + k * LANE + LANE / 2;
  const sharedX = [...shared].map((id) => {
    const ys = placed.flatMap((p, k) => p.steps.flatMap((s) => s.ids.filter((d) => d.id === id).map((d) => ({ x: x(d.y), y: laneY(k) }))));
    return { id, x: ys[0]!.x, ys: ys.map((v) => v.y) };
  });

  return (
    <figure className="pa">
      <div className="pa-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={multi ? "Risteävät juurisyypolut aikajanalla" : "Juurisyypolku aikajanalla"}>
          {PHASES.map((ph) => (
            <g key={ph.n}>
              <rect x={x(ph.from)} y={TOP - 18} width={x(ph.to + 1) - x(ph.from)} height={H - TOP} fill={ph.tone} opacity={0.06} />
              <text x={x(ph.from) + 4} y={TOP - 24} className="pa-phase" fill={ph.tone}>{ph.n}. {ph.from}–{ph.to}</text>
            </g>
          ))}
          {[1850, 1900, 1950, 2000].map((y) => (
            <g key={y}>
              <line x1={x(y)} x2={x(y)} y1={TOP - 18} y2={H - 20} className="pa-grid" />
              <text x={x(y)} y={H - 6} className="pa-year" textAnchor="middle">{y}</text>
            </g>
          ))}
          <line x1={x(2026)} x2={x(2026)} y1={TOP - 18} y2={H - 20} className="pa-now" />
          <text x={x(2026)} y={H - 6} className="pa-year pa-now-t" textAnchor="middle">Nyt</text>

          {sharedX.map((s) => (
            <line key={s.id} x1={s.x} x2={s.x} y1={Math.min(...s.ys)} y2={Math.max(...s.ys)} className="pa-cross" />
          ))}

          {placed.map((p, k) => {
            const cy = laneY(k);
            const pts = [x(2026), ...p.steps.map((s) => x((s.from + s.to) / 2))];
            return (
              <g key={p.path.id} style={{ color: p.tone }}>
                {multi && <text x={PAD} y={cy - LANE / 2 + 16} className="pa-lane" fill="currentColor">{p.path.title}</text>}
                <polyline points={pts.map((px) => `${px},${cy}`).join(" ")} className="pa-line" />
                <circle cx={x(2026)} cy={cy} r={7} fill="currentColor" />
                {p.steps.map((s, i) => {
                  const prev = i === 0 ? 2026 : (p.steps[i - 1]!.from + p.steps[i - 1]!.to) / 2;
                  const mid = (s.from + s.to) / 2;
                  const gap = Math.round(prev - mid);
                  const above = i % 2 === 0;
                  return (
                    <g key={s.i}>
                      <rect x={x(s.from) - 6} y={cy - 9} width={Math.max(12, x(s.to) - x(s.from) + 12)} height={18} rx={9} className="pa-span" />
                      <text x={(x(prev) + x(mid)) / 2} y={multi ? cy + (above ? 26 : -18) : cy + 28} textAnchor="middle" className="pa-gap">{gap} v</text>
                      {!multi && (
                        <text x={x(mid)} y={cy + (above ? -34 : 50)} textAnchor="middle" className="pa-step">
                          <tspan x={x(mid)}>{s.era}</tspan>
                          <tspan x={x(mid)} dy="1.15em" className="pa-step-t">{s.title.length > 34 ? s.title.slice(0, 32) + "…" : s.title}</tspan>
                        </text>
                      )}
                      {s.ids.map((d) => (
                        <circle key={d.id} cx={x(d.y)} cy={cy} r={shared.has(d.id) ? 7 : 5} className={shared.has(d.id) ? "pa-dot pa-dot-shared" : "pa-dot"} tabIndex={0} role="button" aria-label={`${d.y} ${d.name}`} onClick={() => onPick(d.id)} onKeyDown={(e) => e.key === "Enter" && onPick(d.id)}>
                          <title>{d.y} · {d.name}{shared.has(d.id) ? " · yhteinen solmukohta" : ""}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        Polku kulkee nykyhetkestä taaksepäin. Numerot askelten välissä ovat <b>aikavälejä vuosina</b>, eivät mitattuja vaikutusviiveitä.
        {multi && (shared.size ? ` Valkoiset pystyviivat yhdistävät ${shared.size} päätöstä, jotka esiintyvät useammassa polussa.` : " Valituilla poluilla ei ole yhteisiä päätöksiä.")}
        {" "}Klikkaa pistettä avataksesi päätöksen.
      </figcaption>
    </figure>
  );
}
