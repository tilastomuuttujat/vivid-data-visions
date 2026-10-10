import { useMemo } from 'react';
import { groupIndex, groups, stages, type AtlasData, type Theme } from '@/lib/atlas-data';

export const eras = [
  { from: 1850, to: 1900, name: 'Juurisyyt', note: 'Paineet syntyvät' },
  { from: 1900, to: 1960, name: 'Ratkaisujen aika', note: 'Instituutiot rakennetaan' },
  { from: 1960, to: 1990, name: 'Vakiintuminen', note: 'Ratkaisusta tulee normi' },
  { from: 1990, to: 2025, name: 'Olosuhteet muuttuvat', note: 'Normi alkaa hiertää' },
  { from: 2025, to: 2050, name: 'Ristiriidat ja korjaus', note: 'Mitä nyt tehdään?' },
];

export interface ReadingStep { title: string; stage: number | null; lead: string; insight: string }

/** Data-driven reading path: each step highlights one stage across all themes. */
export function readingPath(data: AtlasData): ReadingStep[] {
  const n = data.themes.length;
  const yearOf = (t: Theme, s: number) => t.steps.find(x => x.stage === s)?.year;
  const median = (arr: number[]) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(a.length / 2)] ?? 0; };
  const y1 = data.themes.map(t => yearOf(t, 1)).filter((v): v is number => v !== undefined);
  const y2 = data.themes.map(t => yearOf(t, 2)).filter((v): v is number => v !== undefined);
  const y4 = data.themes.map(t => yearOf(t, 4)).filter((v): v is number => v !== undefined);
  const settledBefore1990 = data.themes.filter(t => (yearOf(t, 3) ?? 9999) <= 1990).length;
  const decades = new Map<number, number>();
  y4.forEach(y => decades.set(Math.floor((y - 1) / 10) * 10, (decades.get(Math.floor((y - 1) / 10) * 10) ?? 0) + 1));
  const peak = [...decades.entries()].sort((a, b) => b[1] - a[1])[0];
  const lag = median(data.themes.map(t => (yearOf(t, 4) ?? 0) - (yearOf(t, 2) ?? 0)).filter(v => v > 0));
  return [
    { title: 'Koko kaari', stage: null, lead: 'Jokainen rivi on yksi teema. Viiva kulkee ongelman synnystä mahdolliseen korjausliikkeeseen.', insight: `${n} teemaa, sama rakenne: eilisen ratkaisu on usein tämän päivän ongelman juurisyy.` },
    { title: '1 · Juurisyyt', stage: 1, lead: 'Mistä paineet alun perin syntyivät?', insight: `${y1.filter(y => y <= 1900).length}/${n} teeman alkuperäinen ongelma paikantuu jo ennen vuotta 1900 — mediaani ${median(y1)}.` },
    { title: '2 · Ratkaisut', stage: 2, lead: 'Millä keinoin ongelma ratkaistiin — ja milloin?', insight: `Ratkaisut ajoittuvat tiiviisti 1900-luvun alku- ja keskivaiheille (mediaani ${median(y2)}). Ne rakensivat sen Suomen, jonka tunnemme.` },
    { title: '3 · Vakiintuminen', stage: 3, lead: 'Ratkaisusta tulee itsestäänselvyys, jonka varaan muu rakennetaan.', insight: `${settledBefore1990}/${n} ratkaisua oli vakiintunut viimeistään 1990 — ennen globalisaatiota, digitalisaatiota ja väestön ikääntymistä.` },
    { title: '4 · Olosuhteet muuttuvat', stage: 4, lead: 'Ympäristö muuttuu, mutta ratkaisu pysyy ennallaan.', insight: `Murros kasautuu: ${peak ? `${peak[1]} teeman olosuhdemuutos osuu vuosikymmenelle ${peak[0]}–${peak[0] + 10}` : 'ei dataa'}. Ratkaisun ja murroksen välissä on tyypillisesti ~${lag} vuotta.` },
    { title: '5 · Ristiriita', stage: 5, lead: 'Toimiva ratkaisu alkaa tuottaa uutta ongelmaa.', insight: `Lähes kaikki ristiriidat ovat auki juuri nyt (2020-luvulla). Ne eivät ole uusia ongelmia, vaan vanhojen ratkaisujen sivuvaikutuksia.` },
    { title: '6 · Korjausliike', stage: 6, lead: 'Mitä seuraavaksi? Avoin kysymys jokaiselle teemalle.', insight: `Päätelmä: korjausliikkeen on purettava ratkaisun oletukset, ei vain oireita. Valitse teema ja lue sen kaari alusta.` },
  ];
}

const X0 = 230, X1 = 1000, Y0 = 92, ROW = 16;
const x = (year: number) => X0 + ((Math.min(2050, Math.max(1850, year)) - 1850) / 200) * (X1 - X0);

interface Props { data: AtlasData; selected: number; visible: Set<number>; onSelect: (id: number, step?: number) => void; focus: number | null }
export function AtlasTimeline({ data, selected, visible, onSelect, focus }: Props) {
  const rows = useMemo(() => [...data.themes].filter(t => visible.has(t.id)).sort((a, b) => groupIndex(a.group) - groupIndex(b.group) || (a.steps[3]?.year ?? 0) - (b.steps[3]?.year ?? 0)), [data, visible]);
  const height = Y0 + rows.length * ROW + 30;
  return <svg className="atlas-timeline" viewBox={`0 0 1020 ${Math.max(height, 300)}`} role="img" aria-label="Rakennemuutosten aikajana 1850–2050">
    {eras.map((e, i) => <g key={e.name} className={`era ${i % 2 ? 'odd' : ''}`}>
      <rect x={x(e.from)} y={20} width={x(e.to) - x(e.from)} height={height - 20} />
      <text x={x(e.from) + 6} y={36} className="era-name">{e.name}</text>
      <text x={x(e.from) + 6} y={50} className="era-note">{e.note}</text>
    </g>)}
    {[1850, 1900, 1950, 2000, 2050].map(y => <text key={y} x={x(y)} y={74} textAnchor="middle" className="tl-year">{y}</text>)}
    <line x1={x(2026)} x2={x(2026)} y1={60} y2={height} className="tl-now" />
    <text x={x(2026)} y={height - 8} textAnchor="middle" className="tl-now-label">NYT</text>
    {rows.map((t, r) => {
      const y = Y0 + r * ROW + 8, gi = groupIndex(t.group), active = t.id === selected;
      const pts = t.steps.map((s, i) => ({ ...s, i, cx: x(Math.max(s.year, t.steps[i - 1]?.year ?? 0)) }));
      const first = pts[0], last = pts[pts.length - 1];
      const newGroup = r === 0 || rows[r - 1]?.group !== t.group;
      return <g key={t.id} className={`tl-row theme-color-${gi} ${active ? 'selected' : ''}`}>
        {newGroup && <text x={8} y={y - 9} className="tl-group">{groups[gi]?.toUpperCase()}</text>}
        {active && <rect x={0} y={y - 8} width={1020} height={ROW} className="tl-row-bg" />}
        <text x={X0 - 10} y={y + 3} textAnchor="end" className="tl-label" onClick={() => onSelect(t.id)}>{t.name.length > 30 ? t.name.slice(0, 28) + '…' : t.name}</text>
        {first && last && <line x1={first.cx} x2={last.cx} y1={y} y2={y} className="tl-arc" />}
        {pts.map(p => {
          const hit = focus === null || focus === p.stage;
          return <circle key={p.i} cx={p.cx} cy={y} r={hit && focus !== null ? 5 : active ? 4.5 : 3.2} className={`tl-dot stage-${p.stage} ${hit ? '' : 'dim'}`} onClick={() => onSelect(t.id, p.i)}><title>{`${t.name} · ${stages[p.stage - 1]} · ${p.year}\n${p.text}`}</title></circle>;
        })}
      </g>;
    })}
  </svg>;
}
