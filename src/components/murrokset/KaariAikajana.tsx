// Malli 2: valitun päätöksen TTT-relaatiot kaarina aikajanalla.
// Yläpuolella saapuvat (taustat), alapuolella lähtevät (seuraukset). Relaation suunta säilyy lähteen mukaisena.
import { DECISIONS } from "./murrokset-model";
import {
  decisionMappings,
  edgesFor,
  linkedDecisions,
  isScenario,
  networkNode,
  otherNode,
  type Direction,
  type NetworkEdge,
} from "./decision-network-model";

import { useTimelineScroll } from "./useTimelineScroll";
const W = 1000;
const PAD = 30;
const MID = 210;

export type ArcGroup = "mahdollisti" | "paine" | "laukaisi" | "konteksti";
export const ARC_GROUPS: Record<ArcGroup, { label: string; tone: string; types: string[] }> = {
  mahdollisti: {
    label: "Mahdollisti / loi kykyä",
    tone: "var(--m-green)",
    types: [
      "enabled",
      "supported",
      "created_capacity_for",
      "created_conditions_for",
      "created_structure_for",
      "provided_capacity_for",
      "supplied_capacity_for",
      "created_policy_basis_for",
      "structural_precursor",
      "long_term_precursor",
      "created_scale_for",
    ],
  },
  paine: {
    label: "Loi muutospainetta",
    tone: "var(--m-red)",
    types: [
      "created_pressure_for",
      "created_reform_pressure",
      "constrained",
      "constrained_by",
      "created_vulnerability_for",
      "exposed_vulnerability_of",
      "weakened",
      "created_entitlement_pressure",
      "created_long_term_obligation",
      "created_counterreaction",
    ],
  },
  laukaisi: {
    label: "Laukaisi / kiihdytti",
    tone: "var(--m-gold)",
    types: ["triggered", "caused", "accelerated", "intensified", "culminated_in", "produced"],
  },
  konteksti: { label: "Muu yhteys (täydensi, kehittyi…)", tone: "var(--m-blue)", types: [] },
};
export const arcGroup = (type: string): ArcGroup =>
  (Object.keys(ARC_GROUPS) as ArcGroup[]).find((g) => ARC_GROUPS[g].types.includes(type)) ??
  "konteksti";

export function KaariAikajana({
  decisionId,
  onDecision,
  focusId: selectedFocus,
  direction = "all",
}: {
  decisionId: string;
  onDecision: (id: string) => void;
  focusId?: string;
  direction?: Direction;
}) {
  const decision = DECISIONS.find((d) => d.id === decisionId)!;
  const mapping = decisionMappings[decisionId];
  const focusId = selectedFocus || mapping?.nodes[0] || "";
  const focus = networkNode(focusId);
  const rows = edgesFor(focusId, direction).map((e: NetworkEdge) => ({
    e,
    other: otherNode(e, focusId),
    incoming: e.to === focusId,
  }));
  const dated = rows.filter((r) => r.other.yearStart != null);
  const years = [focus?.yearStart, ...dated.map((r) => r.other.yearStart)].filter(
    (y): y is number => y != null,
  );
  const Y0 = Math.min(1800, ...years);
  const Y1 = Math.max(2060, ...years);
  const x = (y: number) => PAD + ((y - Y0) / (Y1 - Y0)) * (W - PAD * 2);
  const fx = x(focus?.yearStart ?? Number(decision.vuosi));
  const scrollRef = useTimelineScroll(fx / W);
  if (!mapping || !focus)
    return (
      <figure className="ka">
        <figcaption>
          Päätökselle {decision.aika} · {decision.paatos} ei ole lähdeaineistossa
          verkostovastinetta, joten kaaria ei piirretä. Kaaria ei päätellä aiheen tai vuoden
          perusteella.
        </figcaption>
      </figure>
    );
  if (focus.yearStart == null)
    return (
      <figure className="ka">
        <figcaption>
          Solmulla {focus.title} ei ole vuosilukua, joten sitä ei sijoiteta aikajanalle. Yhteydet
          voi tutkia alla olevista korteista.
        </figcaption>
      </figure>
    );
  const undated = rows.length - dated.length;

  return (
    <figure className="ka">
      <div className="ka-legend">
        {(Object.keys(ARC_GROUPS) as ArcGroup[]).map((g) => (
          <span key={g}>
            <i style={{ background: ARC_GROUPS[g].tone }} />
            {ARC_GROUPS[g].label}
          </span>
        ))}
      </div>
      <div className="pa-scroll" ref={scrollRef}>
        <svg
          viewBox={`0 0 ${W} ${MID * 2}`}
          role="group"
          aria-label={`Päätöksen ${focus.title} taustat ja seuraukset aikajanalla`}
        >
          <text x={PAD} y={22} className="ka-side">
            ↑ Taustat (saapuvat yhteydet)
          </text>
          <text x={PAD} y={MID * 2 - 10} className="ka-side">
            ↓ Seuraukset (lähtevät yhteydet)
          </text>
          <line x1={PAD} x2={W - PAD} y1={MID} y2={MID} className="pa-grid" />
          {Array.from({ length: Math.floor((Y1 - Y0) / 50) + 1 }, (_, i) => Y0 + i * 50).map(
            (y) => (
              <g key={y}>
                <line x1={x(y)} x2={x(y)} y1={MID - 4} y2={MID + 4} className="pa-grid" />
                <text x={x(y)} y={MID + 16} textAnchor="middle" className="pa-year">
                  {y}
                </text>
              </g>
            ),
          )}
          {dated.map(({ e, other, incoming }) => {
            const ox = x(other.yearStart!);
            const span = Math.max(24, Math.abs(ox - fx));
            const h = Math.min(MID - 34, 20 + span * 0.42) * (incoming ? -1 : 1);
            const tone = ARC_GROUPS[arcGroup(e.type)].tone;
            const linked = linkedDecisions(other.id);
            return (
              <g key={e.id} className="ka-arc" style={{ color: tone }}>
                <path d={`M ${fx} ${MID} C ${fx} ${MID + h}, ${ox} ${MID + h}, ${ox} ${MID}`} />
                <circle
                  cx={ox}
                  cy={MID}
                  r={linked.length ? 6 : 4}
                  className={linked.length ? "ka-node ka-linked" : "ka-node"}
                  role={linked.length ? "button" : undefined}
                  tabIndex={linked.length ? 0 : undefined}
                  aria-label={linked.length ? `${other.yearStart} ${other.title}` : undefined}
                  onClick={() => linked[0] && onDecision(linked[0].id)}
                  onKeyDown={(event) => {
                    if (linked[0] && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onDecision(linked[0].id);
                    }
                  }}
                >
                  <title>
                    {other.yearStart} · {other.title}
                    {isScenario(other) ? " · Skenaario / tulevaisuustarkastelu" : ""} — {e.type} ·
                    Lähteen varmuusarvio: {e.confidence} · {e.rationale}
                    {linked.length ? " · klikkaa avataksesi päätös" : ""}
                  </title>
                </circle>
              </g>
            );
          })}
          <circle cx={fx} cy={MID} r={10} className="ka-focus" />
          <text x={fx} y={MID - 16} textAnchor="middle" className="ka-focus-t">
            {focus.yearStart ?? "Ajankohta avoin"}
          </text>
        </svg>
      </div>
      <figcaption>
        Kaaret kuvaavat lähteeseen (TTT) kirjattuja yhteyksiä kortista <b>{focus.title}</b>
        {isScenario(focus) ? " (skenaario / tulevaisuustarkastelu)" : ""}. Kaaren korkeus kasvaa
        aikavälin mukaan; se ei kuvaa vaikutuksen voimaa.
        {undated > 0 && ` ${undated} yhteyttä ilman vuosilukua ei näy kuvassa.`} Täytetyt pisteet
        avaavat päätöksen myös Enter- tai välilyöntinäppäimellä. Yhteyksien vaikutusnäyttöä ei ole
        erikseen varmennettu.
      </figcaption>
    </figure>
  );
}
