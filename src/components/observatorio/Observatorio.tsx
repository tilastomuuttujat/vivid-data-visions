import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import atlas from '@/data/atlas.json';
import anchorSrc from '@/data/anchors.json';

const SPRING = [
  { year: 1966, short: 'Eristys', title: 'Jousi jännittyy: Kokoomus hallituksen ulkopuolelle', text: 'Kekkosen kaudella Kokoomus pidettiin 21 vuotta hallitusvallan ulkopuolella. Teollisuuden ja KOP-leirin modernisaatiopaine padottiin pankkisaleihin ja järjestöihin, ja suuret ratkaisut opittiin tekemään kabineteissa parlamentin ohi.' },
  { year: 1987, short: 'Laukeaminen', title: 'Jousi laukeaa: sinipuna ja sääntelyn purku', text: 'Holkerin sinipunahallitus murtaa vanhan suljetun järjestelmän yhdellä rysäyksellä. Pääoma vapautuu nopeammin kuin valvonta uudistuu: kilpailevat pankkileirit, valuuttaluotot ja kasinotalous.' },
  { year: 1992, short: 'Kabinettiopit', title: 'Kriisi hoidetaan vanhoilla opeilla', text: 'Lama hoidetaan suljetuissa neuvotteluissa ja hätätilalogiikalla: pankkituki, Arsenal ja devalvaatio. Lasku siirtyy velallisille, työttömille ja veronmaksajille – ja valtionyhtiöiden myynti vie strategisen omistajuuden.' },
];

interface TStep { year: number; stage: number; label: string; text: string }
interface Theme { id: number; name: string; group: string; thesis: string; steps: TStep[] }
interface AStep { short_title: string; years: number[]; theme_ids: number[]; mechanism: string; tradeoff: string; lag: string }
interface Anchor { id: string; title: string; steps: AStep[] }

const themes = (atlas as unknown as { themes: Theme[] }).themes;
const anchors = (anchorSrc as unknown as { anchors: Anchor[] }).anchors;
const groups = [...new Set(themes.map(t => t.group))];
const ordered = groups.flatMap(g => themes.filter(t => t.group === g));
const rowOf = new Map(ordered.map((t, i) => [t.id, i]));

const Y0 = 1850, Y1 = 2050, W = 1200, H = 640, TOP = 80, BOT = 40, LEFT = 20;
const tx = (y: number) => LEFT + Math.pow((Math.min(Y1, Math.max(Y0, y)) - Y0) / (Y1 - Y0), 0.62) * (W - LEFT * 2);
const ty = (row: number) => TOP + (row + 0.5) * ((H - TOP - BOT) / ordered.length);

/** Stage → systemic role. Brightness encodes role, not a measured value. */
const ROLE: Record<number, { key: string; name: string }> = {
  1: { key: 'base', name: 'Perusrakenne' }, 2: { key: 'node', name: 'Kantava solmu' }, 3: { key: 'node', name: 'Kantava solmu' },
  4: { key: 'shift', name: 'Olosuhteiden muutos' }, 5: { key: 'lock', name: 'Toimeenpanolukko' }, 6: { key: 'fix', name: 'Korjaava kerros' },
};

interface Wave { id: string; name: string; from: number; to: number; chain: string[]; gain: string; cost: string; lesson: string }
const WAVES: Wave[] = [
  { id: 'asutus', name: 'Asuttaminen ja hajautus', from: 1860, to: 1955,
    chain: ['Nälkävuodet', 'Torpparivapautus', 'Asutustilat', 'Jälleenrakennus'],
    gain: 'Oma maa, sitkeys ja metsätulot koko maahan.', cost: 'Laaja, hajautettu infra ja palveluverkko, jonka ylläpito on nykyään raskas.',
    lesson: 'Sijoittamisen ratkaisu muuttuu ylläpidon velaksi, kun väestö liikkuu.' },
  { id: 'nousu', name: 'Teollinen nousu ja tasapäistäminen', from: 1950, to: 1990,
    chain: ['Maaltamuutto', 'Peruskoulu', 'Päivähoito ja naisten työ', 'Ruotsiin muutto'],
    gain: 'Tuottavuushyppy, keskiluokka ja hyvinvointivaltion selkäranka.', cost: 'Tuottavuuden optimoinnin kääntöpuoli: käyttämätön työpotentiaali muuttuu tulonsiirroiksi, autioitumiseksi ja menetetyksi osaamiseksi.',
    lesson: 'Tuottavuusparadoksi: tehostuksen hyöty on nettoa vasta, kun vapautunut työpotentiaali löytää uuden käytön.' },
  { id: 'keskitys', name: 'Globalisaatio ja keskittyminen', from: 1985, to: 2012,
    chain: ['1990-luvun lama', 'EU-jäsenyys', 'Nokian nousu', 'Kasvukeskukset'],
    gain: 'Nopea uudistuminen tietoyhteiskunnaksi.', cost: 'Kapea kasvupohja, alueellinen eriytyminen ja pitkä työttömyys.',
    lesson: 'Shokista selviämisen tapa määrää seuraavan vuosikymmenen haavoittuvuuden.' },
  { id: 'jannite', name: 'Kestävyysvaje ja uudet lukot', from: 2010, to: 2050,
    chain: ['Väestön ikääntyminen', 'Hyvinvointialueet', 'Energiakriisi', 'Maahanmuutto'],
    gain: 'Rakenteita sopeutetaan pidempiin elinkaariin ja huoltovarmuuteen.', cost: 'Aiemmat kantavat solmut toimivat nyt lukkoina: liikkumavara on kapea.',
    lesson: 'Vuonna 2026 tehty ratkaisu näkyy täysimääräisenä 2045–2055.' },
];

const STARS = [
  { name: 'Demografia', text: 'Syntyvyys, ikärakenne ja huoltosuhde: 30 vuoden päähän lähes ennustettavia.' },
  { name: 'Aineellinen perusta', text: 'Metsä, vesi, energia, mineraalit ja logistinen saari Itämeren laidalla.' },
  { name: 'Perussopimus', text: 'Luottamus, oikeusvaltio, veronkantokyky ja sopimusjärjestelmä. Vuonna 1918 se ankkuroi tilattoman työn maahan; 2020-luvulla testataan, saako tulijan osaaminen yhtä vakaan ankkurin.' },
];

const MIRROR = [
  { year: 1918, label: 'Torpparilaki', text: 'Työkykyä ja viljelytaitoa oli, mutta toimeentulo riippui vuokrasuhteen ehdoista. Ratkaisu: hallinnan oikeudet, ei lisää väkeä.' },
  { year: 2026, label: 'Osaajakysymys', text: 'Osaamista on, mutta kieli, tutkintojen tunnustaminen ja verkostot katkaisevat yhteyden työhön (OECD 2025). Ratkaisu löytyy toiminnan ehdoista, ei määristä.' },
];

export function Observatorio() {
  const [year, setYear] = useState(2026);
  const [wave, setWave] = useState<string>('nousu');
  const spring = [...SPRING].reverse().find(p => year >= p.year && year <= p.year + (p.year === 1966 ? 20 : p.year === 1987 ? 4 : 13)) ?? null;
  const [hover, setHover] = useState<{ t: Theme; s: TStep } | null>(null);
  const w = WAVES.find(x => x.id === wave)!;

  const reading = useMemo(() => {
    const lagging = ordered.flatMap(t => t.steps.filter(s => (s.stage === 2 || s.stage === 3) && year - s.year >= 20 && year - s.year <= 60).map(s => ({ t, s })));
    const locks = ordered.flatMap(t => t.steps.filter(s => s.stage === 5 && s.year <= year).map(s => ({ t, s })));
    const live = anchors.filter(a => { const ys = a.steps.flatMap(s => s.years); return Math.min(...ys) <= year && Math.max(...ys) + 25 >= year; });
    const waves = WAVES.filter(x => x.from <= year && x.to + 30 >= year);
    return { lagging, locks, live, waves };
  }, [year]);

  return (
    <div className="varaan obs">
      <div className="v-aurora" aria-hidden />
      <header className="obs-top">
        <Link to="/minka-varaan" className="v-back"><ArrowLeft size={15} />Minkä varaan?</Link>
        <div>
          <p className="v-kicker">Observatorio · 1850–2050</p>
          <h1 className="obs-h1">Mennyt <em>ohjausjärjestelmänä</em></h1>
        </div>
        <Link to="/" className="v-back">Atlas<ArrowRight size={15} /></Link>
      </header>

      <section className="obs-stars" aria-label="Kiintotähdet">
        {STARS.map(s => <div key={s.name} className="obs-star"><span className="obs-star-dot" aria-hidden />{<b>{s.name}</b>}<p>{s.text}</p></div>)}
      </section>

      <div className="obs-skywrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="obs-sky" role="img" aria-label="Kaikki teemat ja polut tähtitaivaana ajan yli">
          <defs>
            <radialGradient id="obs-halo"><stop offset="0" stopColor="var(--v-glow)" stopOpacity=".9" /><stop offset="1" stopColor="var(--v-glow)" stopOpacity="0" /></radialGradient>
            <radialGradient id="obs-ember"><stop offset="0" stopColor="var(--v-ember)" stopOpacity=".9" /><stop offset="1" stopColor="var(--v-ember)" stopOpacity="0" /></radialGradient>
            <filter id="obs-soft"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>
          {/* background dust */}
          {Array.from({ length: 140 }, (_, i) => <circle key={i} cx={(i * 977) % W} cy={(i * 613) % H} r={(i % 5) * 0.18 + 0.2} className="obs-dust" />)}
          {/* waves as nebulae */}
          {WAVES.map((x, i) => {
            const on = x.id === wave;
            return <g key={x.id} className={`obs-wave ${on ? 'on' : ''}`} onClick={() => setWave(x.id)}>
              <rect x={tx(x.from)} y={TOP - 6} width={tx(x.to) - tx(x.from)} height={H - TOP - BOT + 12} rx={40} filter="url(#obs-soft)" className={`obs-neb n${i}`} />
              <rect x={tx(x.from)} y={TOP - 6} width={tx(x.to) - tx(x.from)} height={H - TOP - BOT + 12} fill="transparent" />
              <text x={tx(x.from) + 8} y={TOP - 34 + (i % 3) * 13} className="obs-wavelabel">{x.name}</text>
            </g>;
          })}
          {/* group separators */}
          {groups.map(g => { const r = ordered.findIndex(t => t.group === g); return <text key={g} x={LEFT + 4} y={ty(r) - 6} className="obs-group">{g}</text>; })}
          {[1850, 1900, 1950, 1975, 2000, 2025, 2050].map(t => <g key={t}><line x1={tx(t)} x2={tx(t)} y1={TOP} y2={H - BOT} className="v-tick" /><text x={tx(t)} y={H - 16} className="v-ticklabel">{t}</text></g>)}
          {/* constellations: anchor paths across themes */}
          {anchors.map(a => {
            const pts = a.steps.map(s => ({ x: tx(((s.years[0] ?? 0) + (s.years[1] ?? s.years[0] ?? 0)) / 2), y: ty(rowOf.get(s.theme_ids[0] ?? 1) ?? 0) }));
            const live = reading.live.includes(a);
            return <g key={a.id} className={`obs-const ${live ? 'live' : ''}`}><title>{a.title}</title>
              <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} />
              {pts.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r={1.6} />)}
            </g>;
          })}
          {/* theme stars */}
          {ordered.map((t, r) => t.steps.map((s, k) => {
            const role = ROLE[s.stage]?.key ?? "base", past = s.year <= year, jx = ((r * 37 + k * 11) % 9) - 4;
            const size = role === 'node' ? 4 : role === 'lock' ? 4.2 : role === 'fix' ? 2.6 : 2.2;
            return <g key={`${t.id}-${k}`} className={`obs-s ${role} ${past ? '' : 'future'}`} onMouseEnter={() => setHover({ t, s })} onMouseLeave={() => setHover(null)}>
              {(role === 'node' || role === 'lock') && past && <circle cx={tx(s.year) + jx} cy={ty(r)} r={size * 3.4} fill={role === 'lock' ? 'url(#obs-ember)' : 'url(#obs-halo)'} opacity={.35} />}
              <circle cx={tx(s.year) + jx} cy={ty(r)} r={size} />
            </g>;
          }))}
          {/* sextant */}
          <line x1={tx(year)} x2={tx(year)} y1={TOP - 4} y2={H - BOT} className="obs-sextant" />
          <line x1={tx(year - 20)} x2={tx(year - 20)} y1={TOP} y2={H - BOT} className="obs-lag" />
          <line x1={tx(year - 60)} x2={tx(year - 60)} y1={TOP} y2={H - BOT} className="obs-lag" />
          <rect x={tx(year - 60)} y={TOP} width={Math.max(0, tx(year - 20) - tx(year - 60))} height={H - TOP - BOT} className="obs-lagband" />
          <text x={tx(year) + 6} y={TOP + 12} className="obs-year">{year}</text>
          {/* Paineastia arc 1966 → 1987 → 1992 */}
          {year >= 1966 && <g className="obs-spring" opacity={year >= 1985 && year <= 2005 ? 1 : .45}>
            <path d={`M${tx(1966)},${H - BOT - 8} Q${tx(1977)},${TOP + 30} ${tx(1987)},${H - BOT - 8} Q${tx(1990)},${TOP + 80} ${tx(1992)},${H - BOT - 8}`} fill="none" stroke="var(--v-ember)" strokeWidth={1.4} strokeDasharray="4 4" />
            {SPRING.map(p => <g key={p.year}><circle cx={tx(p.year)} cy={H - BOT - 8} r={4} fill="var(--v-ember)" /><text x={tx(p.year)} y={H - BOT - 16} textAnchor="middle" className="obs-group" fill="var(--v-ember)">{p.year}</text></g>)}
          </g>}
        </svg>
        {hover && <div className="obs-tip"><span>{ROLE[hover.s.stage]?.name} · {hover.s.year}</span><b>{hover.t.name}</b><p>{hover.s.text}</p></div>}
        <div className="obs-legend">
          <span><i className="node" />Kantava solmu</span><span><i className="lock" />Toimeenpanolukko</span><span><i className="fix" />Korjaava kerros</span><span><i className="base" />Perusrakenne</span><span><i className="band" />Viive-ikkuna 20–60 v</span>
        </div>
      </div>

      <div className="obs-sextantctl">
        <label htmlFor="obs-year">Sekstantti</label>
        <input id="obs-year" type="range" min={1860} max={2050} value={year} onChange={e => setYear(+e.target.value)} />
        <div className="obs-quick">{[1918, 1950, 1966, 1987, 1992, 2026, 2045].map(y => <button key={y} className={y === year ? 'on' : ''} onClick={() => setYear(y)}>{y}</button>)}</div>
      </div>

      <section className="obs-grid">
        <article className="obs-card obs-wavecard">
          <p className="v-kicker">Iso aalto · {w.from}–{w.to}</p>
          <h2>{w.name}</h2>
          <div className="obs-chain">{w.chain.map((c, i) => <span key={c}>{c}{i < w.chain.length - 1 && <ArrowRight size={12} />}</span>)}</div>
          <div className="obs-coin">
            <div><span>Näkyvä hyöty</span><p>{w.gain}</p></div>
            <div className="cost"><span>Kolikon kääntöpuoli</span><p>{w.cost}</p></div>
          </div>
          <p className="obs-lesson">{w.lesson}</p>
          <div className="obs-wavetabs">{WAVES.map(x => <button key={x.id} className={x.id === wave ? 'on' : ''} onClick={() => setWave(x.id)}>{x.name}</button>)}</div>
        </article>

        {spring && <article className="obs-card obs-springcard" style={{ gridColumn: '1 / -1', borderColor: 'var(--v-ember)' }}>
          <p className="v-kicker">Paineastia 1966–1987 · taitekohta {spring.year}</p>
          <h2>{spring.title}</h2>
          <p>{spring.text}</p>
          <div className="obs-chain">{SPRING.map((p, i) => <span key={p.year}><button className={p.year === spring.year ? 'on' : ''} onClick={() => setYear(p.year)} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontWeight: p.year === spring.year ? 700 : 400 }}>{p.year} {p.short}</button>{i < SPRING.length - 1 && <ArrowRight size={12} />}</span>)}</div>
          <p className="obs-lesson">Tulkinta: 20 vuoden poikkeustila ei päättynyt Kekkosen eroon, vaan jännitti jousen, joka laukesi hallitsemattomasti. <Link to="/minka-varaan">Avaa Arsenalin jäävuoripolku →</Link></p>
        </article>}
        {((year >= 1915 && year <= 1925) || (year >= 2015 && year <= 2035)) && <article className="obs-card obs-springcard" style={{ gridColumn: '1 / -1', borderColor: 'var(--v-glow)' }}>
          <p className="v-kicker">Perussopimuksen peili · 1918 ↔ 2026</p>
          <h2>Rakennetaanko paikka työvoimana – vai edellytykset elämälle?</h2>
          <div className="obs-gaincost">{MIRROR.map(m => <div key={m.year}><span><button onClick={() => setYear(m.year)} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontWeight: m.year === year ? 700 : 400, padding: 0 }}>{m.year} · {m.label}</button></span><p>{m.text}</p></div>)}</div>
          <p className="obs-lesson">Rinnastus koskee mekanismia, ei ihmisryhmiä: käyttämätön työpotentiaali on tuottavuusparadoksin kääntöpuoli. <Link to="/minka-varaan">Avaa polku Torpparista osaajaksi →</Link></p>
        </article>}
        <article className="obs-card">
          <p className="v-kicker">Asemanmääritys vuonna {year}</p>
          <div className="obs-stats">
            <div><b>{reading.lagging.length}</b><span>ratkaisua 20–60 v takaa vaikuttaa nyt viiveellä</span></div>
            <div className="lock"><b>{reading.locks.length}</b><span>toimeenpanolukkoa syntynyt</span></div>
            <div><b>{reading.live.length}</b><span>polkua yhä liikkeessä</span></div>
          </div>
          {reading.lagging.length > 0 && <><h3>Viiveellä vaikuttavat kantavat solmut</h3>
            <ul className="obs-list">{reading.lagging.slice(0, 5).map(({ t, s }) => <li key={t.id + s.label}><b>{t.name}</b> <em>{s.year}</em><span>{s.text}</span></li>)}</ul></>}
          {reading.live.length > 0 && <><h3>Avoimet polut</h3>
            <div className="obs-pills">{reading.live.slice(0, 8).map(a => <Link key={a.id} to="/minka-varaan" className="obs-pill">{a.title.split(' – ')[0]}</Link>)}</div></>}
        </article>
      </section>
      <p className="obs-note">Tähtien kirkkaus kuvaa systeemiroolia, ei mitattua suuruutta. Aaltojen rajaukset ja opetukset ovat tulkintoja, joita voi tarkentaa.</p>
    </div>
  );
}
