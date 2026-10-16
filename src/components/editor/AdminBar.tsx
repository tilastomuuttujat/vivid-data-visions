import { useEffect, useState } from "react";
import { Pencil, Upload, Download, LogOut, X, KeyRound } from "lucide-react";
import { useEditor, setEditing, login, logout, publish, download } from "@/lib/editor/store";

const DEFAULT_REPO = "tilastomuuttujat/vivid-data-visions";

/** Ylläpitopalkki: näkyy tunnistetulle ylläpitäjälle, tai kun osoitteeseen lisätään ?admin. */
export function AdminBar() {
  const s = useEditor();
  const [ask, setAsk] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ token: "", repo: DEFAULT_REPO, branch: "main" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (/[?&#]admin\b/.test(window.location.href)) setAsk(true);
  }, []);
  useEffect(() => {
    if (!s.dirty.length) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [s.dirty.length]);

  if (!s.admin && !ask) return null;

  if (!s.admin)
    return (
      <div className="ed-bar">
        {!open ? (
          <button className="ed-btn" onClick={() => setOpen(true)}>
            <KeyRound size={14} />
            Ylläpitäjän kirjautuminen
          </button>
        ) : (
          <form
            className="ed-login"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr("");
              try {
                await login(form.token.trim(), form.repo.trim(), form.branch.trim());
                setOpen(false);
              } catch (x) {
                setErr((x as Error).message);
              }
            }}
          >
            <div className="ed-row">
              <b>Ylläpitäjä</b>
              <button type="button" className="ed-icon" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <label>
              GitHub-token
              <input
                type="password"
                required
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                placeholder="github_pat_…"
              />
            </label>
            <label>
              Repositorio
              <input
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
              />
            </label>
            <label>
              Haara
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </label>
            <small>
              Token säilyy vain tässä selainistunnossa. Käytä vain tämän repositorion sisältöön
              rajattua tokenia.
            </small>
            {err && <small className="ed-err">{err}</small>}
            <button className="ed-btn primary" type="submit">
              Kirjaudu
            </button>
          </form>
        )}
      </div>
    );

  return (
    <div className="ed-bar">
      <div className="ed-panel">
        <span className="ed-who">{s.admin.login}</span>
        <button
          className={`ed-btn ${s.editing ? "on" : ""}`}
          onClick={() => setEditing(!s.editing)}
        >
          <Pencil size={14} />
          Muokkaustila {s.editing ? "päällä" : "pois"}
        </button>
        {s.dirty.length > 0 && (
          <>
            <span className="ed-count">
              {s.dirty.length} tiedosto{s.dirty.length > 1 ? "a" : ""} muuttunut
            </span>
            <button className="ed-btn primary" disabled={s.busy} onClick={publish}>
              <Upload size={14} />
              Julkaise muutokset
            </button>
            {s.dirty.map((f) => (
              <button key={f} className="ed-icon" title={`Lataa ${f}`} onClick={() => download(f)}>
                <Download size={14} />
              </button>
            ))}
          </>
        )}
        <button className="ed-icon" title="Kirjaudu ulos" onClick={logout}>
          <LogOut size={14} />
        </button>
      </div>
      {s.message && <div className="ed-msg">{s.message}</div>}
    </div>
  );
}
