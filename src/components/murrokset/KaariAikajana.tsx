// Malli 2: valitun päätöksen TTT-relaatiot kaarina aikajanalla.
// Yläpuolella saapuvat (taustat), alapuolella lähtevät (seuraukset). Relaation suunta säilyy lähteen mukaisena.
import { DECISIONS } from "./murrokset-model";
import { decisionMappings, edgesFor, linkedDecisions, networkNode, otherNode, type NetworkEdge } from "./decision-network-model";

const Y0 = 1800;
const Y1 = 2060;
const W = 1000;
const PAD = 30;
const MID = 210;
const x = (y: number) => PAD + ((Math.min(Y1, Math.max(Y0, y)) - Y0) / (Y1 - Y0)) * (W - PAD * 2);

export type ArcGroup = "mahdollisti" | "paine" | "laukaisi" | "konteksti";
export const ARC_GROUPS: Record<ArcGroup, { label: string; tone: string; types: string[] }> = {
  mahdollisti: { label: "Mahdollisti / loi kykyä", tone: "var(--m-green)", types: ["enabled", "supported", "created_capacity_for", "created_conditions_for", "created_structure_for", "provided_capacity_for", "supplied_capacity_for", "created_policy_basis_for", "structural_precursor", "long_term_precursor", "created_scale_for"] },
  paine: { label: "Loi muutospainetta", tone: "var(--m-red)", types: ["created_pressure_for", "created_reform_pressure", "constrained", "constrained_by", "created_vulnerability_for", "exposed_vulnerability_of", "weakened", "created_entitlement_pressure", "created_long_term_obligation", "created_counterreaction"] },
  laukaisi: { label: "Laukaisi / kiihdytti", tone: "var(--m-gold)", types: ["triggered", "caused", "accelerated", "intensified", "culminated_in", "produced"] },
  konteksti: { label: "Muu yhteys (täydensi, kehittyi…)", tone: "var(--m-blue)", types: [] },
};
export const arcGroup = (type: string): ArcGroup =>
  (Object.keys(ARC_GROUPS) as ArcGroup[]).find((g) => ARC_GROUPS[g].types.includes(type)) ?? "konteksti";

export function KaariAikajana({ decisionId, onDecision }: { decisionId: string; onDecision: (id: string) => void }) {
  const decision = DECISIONS.find((d) => d.id === decisionId)!;
  const mapping = decisionMappings[decisionId];
  if (!mapping)
    return (
      <figure className="ka">
        <figcaption>Päätökselle {decision.aika} · {decision.paatos} ei ole lähdeaineistossa verkostovastinetta, joten kaaria ei piirretä. Kaaria ei päätellä aiheen tai vuoden perusteella.</figcaption>
      </figure>
    );
  const focusId = mapping.nodes[0]!;
  const focus = networkNode(focusId)!;
  const fx = x(Number(decision.vuosi));
  const rows = edgesFor(focusId).map((e: NetworkEdge) => ({ e, other: otherNode(e, focusId), incoming: e.to === focusId }));
  const dated = rows.filter((r) => r.other.yearStart != null);
  const undated = rows.length - dated.length;

  return (
    <figure className="ka">
      <div className="ka-legend">
        {(Object.keys(ARC_GROUPS) as ArcGroup[]).map((g) => (
          <span key={g}><i style={{ background: ARC_GROUPS[g].tone }} />{ARC_GROUPS[g].label}</span>
        ))}
      </div>
      <div className="pa-scroll">
        <svg viewBox={`0 0 ${W} ${MID * 2}`} role="img" aria-label={`Päätöksen ${decision.paatos} taustat ja seuraukset aikajanalla`}>
          <text x={PAD} y={22} className="ka-side">↑ Taustat (saapuvat yhteydet)</text>
          <text x={PAD} y={MID * 2 - 10} className="ka-side">↓ Seuraukset (lähtevät yhteydet)</text>
          <line x1={PAD} x2={W - PAD} y1={MID} y2={MID} className="pa-grid" />
          {[1850, 1900, 1950, 2000, 2050].map((y) => (
            <g key={y}>
              <line x1={x(y)} x2={x(y)} y1={MID - 4} y2={MID + 4} className="pa-grid" />
              <text x={x(y)} y={MID + 16} textAnchor="middle" className="pa-year">{y}</text>
            </g>
          ))}
          {dated.map(({ e, other, incoming }) => {
            const ox = x(other.yearStart!);
            const span = Math.max(24, Math.abs(ox - fx));
            const h = Math.min(MID - 34, 20 + span * 0.42) * (incoming ? -1 : 1);
            const tone = ARC_GROUPS[arcGroup(e.type)].tone;
            const linked = linkedDecisions(other.id);
            return (
              <g key={e.id} className="ka-arc" style={{ color: tone }}>
                <path d={`M ${fx} ${MID} C ${fx} ${MID + h}, ${ox} ${MID + h}, ${ox} ${MID}`} />
                <circle cx={ox} cy={MID} r={linked.length ? 6 : 4} className={linked.length ? "ka-node ka-linked" : "ka-node"} onClick={() => linked[0] && onDecision(linked[0].id)}>
                  <title>{other.yearStart} · {other.title} — {e.type}{linked.length ? " · klikkaa avataksesi päätös" : ""}</title>
                </circle>
              </g>
            );
          })}
          <circle cx={fx} cy={MID} r={10} className="ka-focus" />
          <text x={fx} y={MID - 16} textAnchor="middle" className="ka-focus-t">{decision.aika}</text>
        </svg>
      </div>
      <figcaption>
        Kaaret kuvaavat lähteeseen (TTT) kirjattuja yhteyksiä kortista <b>{focus.title}</b>. Kaaren korkeus kasvaa aikavälin mukaan; se ei kuvaa vaikutuksen voimaa.
        {undated > 0 && ` ${undated} yhteyttä ilman vuosilukua ei näy kuvassa.`} Täytetyt pisteet ovat päätöksiä, joita voi klikata.
      </figcaption>
    </figure>
  );
}
