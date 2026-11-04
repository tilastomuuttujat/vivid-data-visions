import { useEffect, useState } from "react";
import { MainLinks } from "@/components/MainLinks";
import "./aineisto.css";

type Series = { series_key: string; title: string; description: string | null; source: string | null; source_url: string | null; unit: string | null; geography: string | null; frequency: string | null; data_class: string | null; observations: number; first_year?: number; last_year?: number; file?: string };
type Image = { id: number; title: string; purpose: string | null; file: string; original_path: string; archive_path: string };
type Catalog = { version: number; source: string; observations: number; series: Series[]; images: Image[] };
type Row = [number, string, string | null, string | null, string | number | null, string | null, string | null];
type Values = { series_key: string; columns: string[]; rows: Row[] };
const base = "data/turso/";
const number = (n: number) => n.toLocaleString("fi-FI");
function sourceUrl(value: string | null) {
  if (!value) return undefined;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
async function read<T>(file: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(base + file, { signal });
  if (!response.ok) throw new Error("Aineistoa ei saatu ladattua.");
  return response.json() as Promise<T>;
}

export function Aineisto() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<"series" | "images">("series");
  const [query, setQuery] = useState("");
  const [key, setKey] = useState("");
  const [values, setValues] = useState<Values | null>(null);
  const [valueError, setValueError] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(24);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    read<Catalog>("catalog.json", controller.signal).then(data => {
      if (data.version !== 1 || !Array.isArray(data.series) || !Array.isArray(data.images)) throw new Error();
      setCatalog(data);
    }).catch(() => { if (!controller.signal.aborted) setError("Julkaistua aineistoa ei saatu ladattua. Tarkista yhteys ja yritä uudelleen. Paikallinen latauspaketti tarvitsee HTTP-palvelimen."); });
    return () => controller.abort();
  }, [retry]);
  const selected = catalog?.series.find(s => s.series_key === key);
  useEffect(() => {
    const controller = new AbortController();
    setValues(null); setValueError(""); setPage(0); setGroup("");
    if (selected?.file) read<Values>(selected.file, controller.signal).then(data => {
      if (data.series_key !== selected.series_key || !Array.isArray(data.rows)) throw new Error();
      setValues(data); setGroup(data.rows[0]?.[1] ?? "");
    }).catch(() => { if (!controller.signal.aborted) setValueError("Sarjan havaintoja ei saatu ladattua. Valitse sarja uudelleen tai päivitä sivu."); });
    return () => controller.abort();
  }, [selected]);
  const search = query.toLocaleLowerCase("fi-FI");
  const series = catalog?.series.filter(s => [s.title, s.series_key, s.source, s.geography].some(v => v?.toLocaleLowerCase("fi-FI").includes(search))) ?? [];
  const images = catalog?.images.filter(i => [i.title, i.purpose, i.archive_path].some(v => v?.toLocaleLowerCase("fi-FI").includes(search))) ?? [];
  const groups = [...new Map(values?.rows.map(r => [r[1], r[2] || r[1] || "Kaikki"]) ?? []).entries()];
  const rows = values?.rows.filter(r => r[1] === group) ?? [];
  const source = sourceUrl(selected?.source_url ?? null);
  return <main className="aineisto">
    <header><p className="a-eyebrow">SUOMEN RAKENNEMUUTOSTEN ATLAS</p><h1>Aineisto</h1>
      <p>Julkaistut indikaattorit ja infografiikat Turson aineistosta. Havainnot säilyttävät omat vuotensa ja ryhmänsä.</p>
      <nav aria-label="Sivut"><MainLinks exclude="/aineisto" /></nav>
    </header>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(n => n+1)}>Yritä uudelleen</button></div> : !catalog ? <p role="status">Ladataan aineistoluetteloa…</p> : <>
      <div className="a-counts"><span><strong>{number(catalog.series.length)}</strong> julkaistua sarjaa</span><span><strong>{number(catalog.observations)}</strong> havaintoa</span><span><strong>{number(catalog.images.length)}</strong> infografiikkaa</span></div>
      <div className="a-tools"><div aria-label="Aineistolaji"><button aria-pressed={tab === "series"} onClick={() => { setTab("series"); setLimit(24); }}>Indikaattorit</button><button aria-pressed={tab === "images"} onClick={() => { setTab("images"); setLimit(24); }}>Kuvat</button></div><label>Hae aineistosta<input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(24); }} placeholder="Nimi, lähde tai tunniste" /></label></div>
      {tab === "series" ? <div className="a-layout"><section aria-label="Indikaattorisarjat"><h2>{number(series.length)} sarjaa</h2><div className="a-series-list">{series.slice(0, limit).map(s => <button key={s.series_key} aria-pressed={key === s.series_key} onClick={() => setKey(s.series_key)}><strong>{s.title}</strong><small>{s.source || "Lähdettä ei ilmoitettu"} · {number(s.observations)} havaintoa{s.first_year !== undefined ? ` · ${s.first_year}–${s.last_year}` : ""}</small></button>)}</div>{series.length > limit && <button onClick={() => setLimit(n => n+24)}>Näytä lisää sarjoja</button>}{!series.length && <p>Ei hakutuloksia.</p>}</section>
      <section className="a-detail" aria-label="Valittu sarja">{!selected ? <p>Valitse sarja nähdäksesi sen havainnot ja lähdetiedot.</p> : <><p className="a-eyebrow">{selected.series_key}</p><h2>{selected.title}</h2><p>{selected.description}</p><dl><dt>Yksikkö</dt><dd>{selected.unit || "Ei ilmoitettu"}</dd><dt>Alue</dt><dd>{selected.geography || "Ei ilmoitettu"}</dd><dt>Aineistoluokka</dt><dd>{selected.data_class || "Ei ilmoitettu"}</dd><dt>Lähde</dt><dd>{source ? <a href={source} target="_blank" rel="noreferrer">{selected.source || "Avaa lähde"}</a> : selected.source || "Ei ilmoitettu"}</dd></dl>
      <p className="a-note">Puuttuvia vuosia ei ole täytetty. Arvot näytetään lähteen tarkkuudella; havaintolaji erottaa esimerkiksi arviot mitatuista arvoista. Julkaistu-merkintä ei yksin tarkoita validoitua mittausta.</p>
      {valueError ? <p role="alert">{valueError}</p> : !selected.file ? <p>Sarjalla ei ole julkaistuja havaintoja.</p> : !values ? <p role="status">Ladataan havaintoja…</p> : <><label>Havaintoryhmä<select value={group} onChange={e => { setGroup(e.target.value); setPage(0); }}>{groups.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><p>{number(rows.length)} havaintoa tässä ryhmässä.</p><div className="a-table"><table><thead><tr><th>Vuosi / jakso</th><th>Arvo</th><th>Havaintolaji</th></tr></thead><tbody>{rows.slice(page*50, (page+1)*50).map((r, index) => <tr key={`${r[0]}-${index}`}><td>{r[3] || r[0]}</td><td>{r[4] ?? r[5] ?? "Puuttuva"}</td><td>{r[6] || "Ei ilmoitettu"}</td></tr>)}</tbody></table></div><div className="a-pagination"><button disabled={page === 0} onClick={() => setPage(n => n-1)}>Edelliset</button><span>Sivu {page+1} / {Math.max(1, Math.ceil(rows.length/50))}</span><button disabled={(page+1)*50 >= rows.length} onClick={() => setPage(n => n+1)}>Seuraavat</button></div><a href={base+selected.file} download>Lataa sarjan JSON</a></>}
      </>}</section></div> : <section><h2>{number(images.length)} kuvaa</h2><p className="a-note">Avaa kuva alkuperäisessä koossa napauttamalla. Kuvissa säilyvät niiden alkuperäiset tunnisteet.</p><div className="a-gallery">{images.slice(0, limit).map(image => <figure key={image.id}><a href={base+image.file} target="_blank" rel="noreferrer"><img src={base+image.file} alt={image.title} loading="lazy" decoding="async" /></a><figcaption><strong>{image.title}</strong><small>{image.purpose}</small></figcaption></figure>)}</div>{images.length > limit && <button onClick={() => setLimit(n => n+24)}>Näytä lisää kuvia</button>}{!images.length && <p>Ei hakutuloksia.</p>}</section>}
    </>}
  </main>;
}
