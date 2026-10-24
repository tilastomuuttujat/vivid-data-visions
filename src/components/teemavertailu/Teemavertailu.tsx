import { useMemo, useState, type DragEvent } from "react";
import { MainLinks } from "@/components/MainLinks";
import { MAX_THEMES, PALETTE, PRESETS, THEMES, addTheme, themeArc, type Step, type Theme } from "./teema-model";
import "../kaari/kaari.css";
import "./teema.css";

const W = 1000;
const H = 420;
const PAD = { l: 20, r: 20, t: 30, b: 40 };
const Y0 = 1850;
const Y1 = 2050;
const NOW = 2026;
const x = (yr: number) => PAD.l + ((yr - Y0) / (Y1 - Y0)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b);

function curve(pts: [number, number][]) {
  return pts
    .map(([yr, v], i) => {
      if (i === 0) return `M${x(yr)},${y(v)}`;
      const [py, pv] = pts[i - 1]!;
      const mx = (x(py) + x(yr)) / 2;
      return `C${mx},${y(pv)} ${mx},${y(v)} ${x(yr)},${y(v)}`;
    })
    .join(" ");
}

const DND = "text/x-theme-id";

export function Teemavertailu() {
  const [ids, setIds] = useState<number[]>(PRESETS[0]!.ids);
  const [search, setSearch] = useState("");
  const [over, setOver] = useState<"chart" | "list" | null>(null);
  const [sel, setSel] = useState<{ theme: Theme; step: Step } | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const chosen = useMemo(() => ids.map((id) => THEMES.find((t) => t.id === id)).filter((t): t is Theme => !!t), [ids]);
  const q = search.toLocaleLowerCase("fi");
  const available = THEMES.filter((t) => !ids.includes(t.id) && t.name.toLocaleLowerCase("fi").includes(q));
  const groups = [...new Set(available.map((t) => t.group ?? "Muut"))];

  const add = (id: number) => setIds((c) => addTheme(c, id));
  const remove = (id: number) => { setIds((c) => c.filter((x) => x !== id)); if (sel?.theme.id === id) setSel(null); };
  const drag = (id: number) => (e: DragEvent) => { e.dataTransfer.setData(DND, String(id)); e.dataTransfer.effectAllowed = "move"; };
  const dropOn = (where: "chart" | "list") => (e: DragEvent) => {
    e.preventDefault(); setOver(null);
    const id = Number(e.dataTransfer.getData(DND));
    if (!id) return;
    if (where === "chart") add(id); else remove(id);
  };
  const allow = (where: "chart" | "list") => (e: DragEvent) => { e.preventDefault(); setOver(where); };
  const full = ids.length >= MAX_THEMES;

  return (
    <div className="k-page">
      <nav className="k-nav"><MainLinks exclude="/teemavertailu" /></nav>
      <header className="k-head">
        <p className="k-kicker">Teemakaari · 32 teemaa</p>
        <h1>Vedä teemat samalle aikajanalle</h1>
        <p className="k-lede">Jokainen teema kulkee kuuden vaiheen kaaren: ongelma, ratkaisu, vakiintuminen, olosuhteiden muutos, uusi ristiriita ja mahdollinen korjausliike. Käyrän korkeus kuvaa vaihetta – ei mitattua arvoa. Vertaa, missä teemojen kaaret nousevat ja taittuvat samaan aikaan.</p>
      </header>

      <div className="tk-presets">
        <span className="k-subs-label">Valmiit vertailut</span>
        {PRESETS.map((p) => <button key={p.label} onClick={() => { setIds(p.ids); setSel(null); }}>{p.label}</button>)}
        <button onClick={() => { setIds([]); setSel(null); }}>Tyhjennä</button>
      </div>

      <div className="tk-layout">
        <aside className={`tk-list ${over === "list" ? "over" : ""}`} onDragOver={allow("list")} onDragLeave={() => setOver(null)} onDrop={dropOn("list")} aria-label="Teemaluettelo">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hae teemaa…" aria-label="Hae teemaa" />
          <p className="tk-tip">{full ? `Kuvaajassa on jo ${MAX_THEMES} teemaa – poista ensin jokin.` : "Vedä teema kuvaajaan tai klikkaa +. Vedä takaisin tähän poistaaksesi."}</p>
          {groups.map((g) => (
            <div key={g}>
              <h3>{g}</h3>
              {available.filter((t) => (t.group ?? "Muut") === g).map((t) => (
                <button key={t.id} draggable={!full} onDragStart={drag(t.id)} onClick={() => add(t.id)} disabled={full} className="tk-item" title={t.thesis}>
                  <span>+</span>{t.name}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className={`tk-chart k-chart ${over === "chart" ? "over" : ""}`} onDragOver={allow("chart")} onDragLeave={() => setOver(null)} onDrop={dropOn("chart")} aria-label="Teemakuvaaja">
          <div className="tk-chips">
            {chosen.map((t, i) => (
              <span key={t.id} draggable onDragStart={drag(t.id)} className="tk-chip" style={{ ["--c" as string]: PALETTE[i] }}
                onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)}>
                <i />{t.name}<button onClick={() => remove(t.id)} aria-label={`Poista ${t.name}`}>×</button>
              </span>
            ))}
            {chosen.length === 0 && <span className="tk-empty">Pudota teemoja tähän</span>}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Valittujen teemojen vaihekaaret 1850–2050">
            {[[0.82, "Vakiintunut ratkaisu"], [0.52, "Muutospaine"], [0.2, "Ongelma / ristiriita"]].map(([v, l]) => (
              <g key={l as string}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(v as number)} y2={y(v as number)} className="tk-grid" />
                <text x={PAD.l + 4} y={y(v as number) - 5} className="k-era-label">{l}</text>
              </g>
            ))}
            <rect x={x(NOW)} y={PAD.t} width={x(Y1) - x(NOW)} height={H - PAD.t - PAD.b} className="k-era-3" />
            {[1850, 1900, 1950, 2000, 2050].map((yr) => <text key={yr} x={x(yr)} y={H - 14} textAnchor="middle" className="k-axis">{yr}</text>)}
            <line x1={x(NOW)} x2={x(NOW)} y1={PAD.t} y2={H - PAD.b} className="k-now" />
            <text x={x(NOW) + 4} y={PAD.t + 12} className="k-now-label">Nyt</text>
            {chosen.map((t, i) => {
              const arc = themeArc(t);
              const dim = hover !== null && hover !== t.id;
              return (
                <g key={t.id} className={`tk-arc ${dim ? "dim" : ""}`} style={{ ["--c" as string]: PALETTE[i] }}>
                  <path d={curve(arc.map((p) => [p.x, p.level]))} className="k-line" stroke={PALETTE[i]} />
                  {arc.map((p) => {
                    const on = sel?.theme.id === t.id && sel.step.stage === p.step.stage;
                    return (
                      <circle key={p.step.stage} cx={x(p.x)} cy={y(p.level)} r={on ? 8 : 5.5} className={`tk-dot ${on ? "on" : ""}`}
                        tabIndex={0} role="button" aria-label={`${t.name}: ${p.step.label}`}
                        onClick={() => setSel({ theme: t, step: p.step })}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel({ theme: t, step: p.step })} />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </section>
      </div>

      {sel ? (
        <section className="k-card" aria-live="polite">
          <p className="k-kicker">{sel.theme.name} · vaihe {sel.step.stage}/6</p>
          <h2>{sel.step.label}</h2>
          <p>{sel.step.text}</p>
          {sel.theme.thesis && <p className="k-muted">Teeman ydinväite: {sel.theme.thesis}</p>}
        </section>
      ) : (
        <p className="k-hint">Klikkaa käyrän pistettä lukeaksesi vaiheen selityksen. Vie hiiri teeman nimen päälle korostaaksesi sen käyrän.</p>
      )}
    </div>
  );
}
