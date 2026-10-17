import { useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { ARC_GROUPS, type ArcGroup } from "./KaariAikajana";
import { anchorPanelScale } from "./anchor-panels-model";
import { type ExplorerFilters } from "./anchor-explorer-model";

export function AnchorExplorerControls({
  filters,
  onChange,
  onReset,
  onClose,
  panelId,
  nodeTitle,
  onClearNode,
}: {
  filters: ExplorerFilters;
  onChange: (filters: ExplorerFilters) => void;
  onReset: () => void;
  onClose: () => void;
  panelId: string;
  nodeTitle: string | null;
  onClearNode: () => void;
}) {
  const [error, setError] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const extent = anchorPanelScale();
  const update = (value: Partial<ExplorerFilters>) => onChange({ ...filters, ...value });
  const toggleAnchor = (id: string) =>
    update({
      anchors: filters.anchors.includes(id)
        ? filters.anchors.filter((a) => a !== id)
        : [...filters.anchors, id],
    });
  return (
    <aside
      id={panelId}
      className="ae-controls"
      aria-label="Kuvaajan ohjauspaneeli"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="ae-panel-head">
        <h3>Ohjaa kuvaajaa</h3>
        <button onClick={onClose}>Sulje ohjauspaneeli</button>
      </div>
      {nodeTitle ? (
        <p>
          Valittu kortti: <b>{nodeTitle}</b>
          <button onClick={onClearNode}>Poista reittivalinta</button>
        </p>
      ) : (
        <p>Valitse kuvaajan pieni piste avataksesi kortin ja sen reittikorostuksen.</p>
      )}
      <fieldset>
        <legend>Toimintatapa</legend>
        <label>
          <input
            type="radio"
            name={`${panelId}-mode`}
            checked={filters.mode === "highlight"}
            onChange={() => update({ mode: "highlight" })}
          />{" "}
          Korosta · säilytä kokonaiskuva
        </label>
        <label>
          <input
            type="radio"
            name={`${panelId}-mode`}
            checked={filters.mode === "filter"}
            onChange={() => update({ mode: "filter" })}
          />{" "}
          Rajaa · piilota muut
        </label>
      </fieldset>
      <fieldset>
        <legend>Korosta tai vertaa ankkureita</legend>
        {ANCHORS.map((a) => (
          <label key={a.id}>
            <input
              type="checkbox"
              aria-label={`Ankkuri ${a.n}: ${a.title}`}
              checked={filters.anchors.includes(a.id)}
              onChange={() => toggleAnchor(a.id)}
            />
            {a.n}. {a.title}
          </label>
        ))}
        <button onClick={() => update({ anchors: [] })}>Ei ankkurirajausta</button>
        <p>
          Valitse esimerkiksi kaksi ankkuria vertailuun. Tyhjä valinta tarkoittaa kaikkia
          ankkureita.
        </p>
      </fieldset>
      <label>
        Yhteyksien suunta
        <select
          aria-label="Ohjauspaneelin suunta"
          value={filters.direction}
          onChange={(e) => update({ direction: e.target.value as ExplorerFilters["direction"] })}
        >
          <option value="all">Taustat ja seuraukset</option>
          <option value="incoming">Taustat</option>
          <option value="outgoing">Seuraukset</option>
        </select>
      </label>
      <label>
        Valitun kortin reitti
        <select
          aria-label="Valitun kortin reitin pituus"
          value={filters.depth}
          onChange={(e) => update({ depth: Number(e.target.value) as 1 | 2 })}
        >
          <option value={1}>Suorat yhteydet</option>
          <option value={2}>Enintään kaksi askelta</option>
        </select>
      </label>
      <fieldset>
        <legend>Relaatiotyypit</legend>
        {Object.entries(ARC_GROUPS).map(([key, g]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={filters.groups.includes(key as ArcGroup)}
              onChange={() =>
                update({
                  groups: filters.groups.includes(key as ArcGroup)
                    ? filters.groups.filter((id) => id !== key)
                    : [...filters.groups, key as ArcGroup],
                })
              }
            />
            {g.label}
          </label>
        ))}
      </fieldset>
      <form
        key={formVersion}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const from = Number(data.get("from")),
            to = Number(data.get("to"));
          if (
            !Number.isFinite(from) ||
            !Number.isFinite(to) ||
            from < extent.min ||
            to > extent.max ||
            from >= to
          ) {
            setError(`Valitse alkuvuosi ennen loppuvuotta väliltä ${extent.min}–${extent.max}.`);
            return;
          }
          setError("");
          update({ years: [from, to] });
        }}
      >
        <fieldset>
          <legend>Aikaväli</legend>
          <label>
            Alkuvuosi
            <input
              key={`from-${filters.years[0]}`}
              name="from"
              type="number"
              required
              min={extent.min}
              max={extent.max - 1}
              defaultValue={filters.years[0]}
            />
          </label>
          <label>
            Loppuvuosi
            <input
              key={`to-${filters.years[1]}`}
              name="to"
              type="number"
              required
              min={extent.min + 1}
              max={extent.max}
              defaultValue={filters.years[1]}
            />
          </label>
          <button type="submit">Aseta aikaväli</button>
          {error && <p role="alert">{error}</p>}
          <p>Mukaan tulevat yhteydet, joiden vuosiväli leikkaa valintaa.</p>
        </fieldset>
      </form>
      <label>
        <input
          type="checkbox"
          checked={filters.zoom}
          onChange={(e) => update({ zoom: e.target.checked })}
        />{" "}
        Lähennä valittuun aikaväliin
      </label>
      <p className="ae-caution">
        Reitti seuraa näkyvän aineiston alkuperäisiä relaatiotunnisteita. Ankkuriryhmän eri korttien
        välille ei päätellä oikopolkua.
      </p>
      <button
        onClick={() => {
          setError("");
          setFormVersion((v) => v + 1);
          onReset();
        }}
      >
        Palauta kokonaiskuva
      </button>
    </aside>
  );
}
