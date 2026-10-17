import { useEffect, useRef } from "react";
import { TIMELINE_MILESTONES, milestoneLabels } from "./timeline-milestones-model";
import "./timeline-milestones.css";

export function TimelineMilestones({
  x,
  min,
  max,
  bottom,
  onSelect,
}: {
  x: (year: number) => number;
  min: number;
  max: number;
  bottom: number;
  onSelect: (year: number) => void;
}) {
  return (
    <g aria-label="Merkittävät murroskohdat">
      {milestoneLabels(x, min, max).map((m) => (
        <g
          key={m.year}
          className="tm-marker"
          role="button"
          tabIndex={0}
          aria-label={`${m.year}: ${m.title}. Avaa murrosjakson tiedot`}
          onClick={() => onSelect(m.year)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(m.year);
            }
          }}
        >
          <line className="tm-line" data-year={m.year} x1={m.x} x2={m.x} y1={94} y2={bottom} />
          <line className="tm-hit" x1={m.x} x2={m.x} y1={38} y2={bottom} />
          <text x={m.x} y={47 + m.row * 18} textAnchor="middle">
            {m.year} · {m.short}
          </text>
          <title>
            {m.label} · {m.title}. Viiva merkitsee jakson alkua, ei osoitettua vaikutussuhdetta.
          </title>
        </g>
      ))}
    </g>
  );
}
export function MilestoneDetails({ year, onClose }: { year: number | null; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (year != null) ref.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [year]);
  const milestone = TIMELINE_MILESTONES.find((m) => m.year === year);
  if (!milestone) return null;
  return (
    <aside ref={ref} className="tm-details" aria-label="Murroskohdan tiedot" aria-live="polite">
      <button onClick={onClose}>Sulje murroskohdan tiedot</button>
      <h3>
        {milestone.label} · {milestone.title}
      </h3>
      <p>{milestone.sub}</p>
      <p>
        Katkoviiva on yhteinen ajallinen kiinnekohta jakson alussa ({milestone.year}). Sen osuminen
        ankkurin tai kortin kohdalle ei osoita vaikutussuhdetta. Lähteeseen kirjatut yhteydet
        näkyvät erikseen nuolina.
      </p>
    </aside>
  );
}
