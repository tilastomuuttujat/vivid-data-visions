// Seitsemän systeemisen ankkurin tila: ankkurit aikajanalla, väliset lähdekaaret yläpuolella,
// valittujen ankkurien yhteydet muihin kortteihin alapuolella.
import { useMemo, useState } from "react";
import { ANCHORS, anchorLinks, anchorSatellites } from "./ankkurit-model";
import { ARC_GROUPS, arcGroup } from "./KaariAikajana";
import { isScenario } from "./decision-network-model";

const W = 1000;
const PAD = 40;
const MID = 250;
const Y0 = 1800;
const Y1 = 2060;
const x = (y: number) => PAD + ((y - Y0) / (Y1 - Y0)) * (W - PAD * 2);
const ax = (id: string) => {
  const a = ANCHORS.find((v) => v.id === id)!;
  return x((a.from + a.to) / 2);
};

export function Ankkurit() {
  const [selected, setSelected] = useState<string[]>(["a4"]);
  const links = useMemo(() => anchorLinks(), []);
  const sats = useMemo(
    () => selected.flatMap((id) => anchorSatellites(id).map((s) => ({ ...s, anchor: id }))),
    [selected],
  );
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));
  const active = (id: string) => selected.length === 0 || selected.includes(id);

  return (
    <section className="ank" aria-label="Seitsemän systeemistä ankkuria">
      <p className="ank-lead">
        Seitsemän keskuspistettä, joiden kautta valtaosa 1850–2025 murroksista kytkeytyy nykytilaan.
        Valitse yksi tai useampi ankkuri: yläpuolella näkyvät ankkurien väliset lähdeyhteydet,
        alapuolella valittujen ankkurien yhteydet muihin murroksiin.
      </p>
      <div className="ank-chips" role="group" aria-label="Valitse ankkurit">
        {ANCHORS.map((a) => (
          <button
            key={a.id}
            aria-pressed={selected.includes(a.id)}
            className={selected.includes(a.id) ? "on" : ""}
            style={{ ["--tone" as string]: a.tone }}
            onClick={() => toggle(a.id)}
          >
            <b>{a.n}</b> {a.from}–{a.to}
          </button>
        ))}
        <button onClick={() => setSelected(ANCHORS.map((a) => a.id))}>Kaikki</button>
        <button onClick={() => setSelected([])}>Tyhjennä</button>
      </div>
      <div className="ka-legend">
        {(Object.keys(ARC_GROUPS) as (keyof typeof ARC_GROUPS)[]).map((g) => (
          <span key={g}>
            <i style={{ background: ARC_GROUPS[g].tone }} />
            {ARC_GROUPS[g].label}
          </span>
        ))}
      </div>
      <div className="pa-scroll">
        <svg viewBox={`0 0 ${W} ${MID * 2}`} role="group" aria-label="Ankkurit aikajanalla">
          <text x={PAD} y={20} className="ka-side">↑ Ankkurien väliset yhteydet</text>
          <text x={PAD} y={MID * 2 - 8} className="ka-side">↓ Valittujen ankkurien muut taustat ja seuraukset</text>
          <line x1={PAD} x2={W - PAD} y1={MID} y2={MID} className="pa-grid" />
          {Array.from({ length: 6 }, (_, i) => Y0 + i * 50).map((y) => (
            <text key={y} x={x(y)} y={MID + 34} textAnchor="middle" className="pa-year">{y}</text>
          ))}
          <line x1={x(2026)} x2={x(2026)} y1={MID - 30} y2={MID + 30} className="pa-now" />
          {sats.map(({ e, other, anchor, incoming }) => {
            const fx = ax(anchor);
            const ox = x(other.yearStart!);
            const h = Math.min(MID - 40, 24 + Math.abs(ox - fx) * 0.35);
            return (
              <path
                key={`${anchor}-${e.id}`}
                className="ank-sat"
                style={{ color: ARC_GROUPS[arcGroup(e.type)].tone }}
                d={`M ${fx} ${MID} C ${fx} ${MID + h}, ${ox} ${MID + h}, ${ox} ${MID}`}
                markerEnd={undefined}
              >
                <title>
                  {incoming ? `${other.yearStart} ${other.title} → ankkuri` : `ankkuri → ${other.yearStart} ${other.title}`}
                  {isScenario(other) ? " · skenaario" : ""} — {e.type} · lähteen varmuus: {e.confidence}
                </title>
              </path>
            );
          })}
          {links.map((l) => {
            const fx = ax(l.from);
            const tx = ax(l.to);
            const h = Math.min(MID - 40, 30 + Math.abs(tx - fx) * 0.45);
            const on = active(l.from) || active(l.to);
            const group = arcGroup(l.edges[0]?.type ?? "");
            return (
              <path
                key={`${l.from}>${l.to}`}
                className={on ? "ank-link" : "ank-link off"}
                style={{ color: ARC_GROUPS[group].tone, strokeWidth: 1.5 + l.edges.length * 1.2 }}
                d={`M ${fx} ${MID} C ${fx} ${MID - h}, ${tx} ${MID - h}, ${tx} ${MID}`}
              >
                <title>
                  Ankkuri {l.from.slice(1)} → {l.to.slice(1)} · {l.edges.length} lähdeyhteyttä:{" "}
                  {l.edges.map((e) => `${e.from} ${e.type} ${e.to}`).join("; ")}
                </title>
              </path>
            );
          })}
          {sats.map(({ e, other }) => (
            <circle key={`n-${e.id}`} cx={x(other.yearStart!)} cy={MID} r={3.5} className="ka-node">
              <title>{other.yearStart} · {other.title}</title>
            </circle>
          ))}
          {ANCHORS.map((a) => (
            <g
              key={a.id}
              className={active(a.id) ? "ank-node" : "ank-node off"}
              style={{ color: a.tone }}
              role="button"
              tabIndex={0}
              aria-pressed={selected.includes(a.id)}
              aria-label={`Ankkuri ${a.n}: ${a.title}`}
              onClick={() => toggle(a.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  toggle(a.id);
                }
              }}
            >
              <circle cx={ax(a.id)} cy={MID} r={selected.includes(a.id) ? 15 : 12} />
              <text x={ax(a.id)} y={MID + 4} textAnchor="middle">{a.n}</text>
            </g>
          ))}
        </svg>
      </div>
      <ol className="ank-cards">
        {ANCHORS.filter((a) => active(a.id)).map((a) => {
          const into = links.filter((l) => l.to === a.id).reduce((s, l) => s + l.edges.length, 0);
          const out = links.filter((l) => l.from === a.id).reduce((s, l) => s + l.edges.length, 0);
          return (
            <li key={a.id} style={{ ["--tone" as string]: a.tone }}>
              <span className="ank-n">{a.n}</span>
              <div>
                <small>{a.from}–{a.to}</small>
                <h3>{a.title}</h3>
                <p><b>Mekanismi:</b> {a.mechanism}</p>
                <p><b>Nykytilassa:</b> {a.now}</p>
                <small>Lähdeyhteyksiä muihin ankkureihin: {into} saapuvaa · {out} lähtevää</small>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="ank-note">
        Ankkurien rajaus ja nykytilan tulkinnat ovat toimituksellisia. Kaaret piirretään vain TTT-lähteeseen
        kirjatuista relaatioista lähteen suunnassa; kaaren paksuus kertoo relaatioiden määrän, ei
        vaikutuksen voimaa, eikä vaikutusnäyttöä ole erikseen varmennettu.
      </p>
    </section>
  );
}
