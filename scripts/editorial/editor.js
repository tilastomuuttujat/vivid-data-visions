"use strict";
const $ = id => document.getElementById(id);
const labels = { draft: "Luonnos", review: "Tarkistettavana", published: "Julkaistu", archived: "Arkistoitu" };
let csrf = "", catalog = [], article = null, dirty = false, busy = false, revision = null, sequence = 0;
function notice(message, error = false) { $("notice").hidden = false; $("notice").textContent = message; $("notice").classList.toggle("error", error); }
function mark(value) { dirty = value; $("save").disabled = !value || busy; $("dirty").textContent = value ? "Tallentamattomia muutoksia" : "Tallennettu"; }
function canLeave() { return !dirty || confirm("Tekstissä on tallentamattomia muutoksia. Haluatko hylätä ne? Voit peruuttaa ja ladata ensin oman tekstisi."); }
async function api(path, data) {
  if (window.articleEditorTransport) return window.articleEditorTransport(path, data);
  const options = { credentials: "same-origin", headers: {} };
  if (data !== undefined) { options.method = "POST"; options.headers = { "Content-Type": "application/json", "X-Editor-CSRF": csrf }; options.body = JSON.stringify(data); }
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Pyyntö epäonnistui.");
  return result;
}
function renderCatalog() {
  const query = $("search").value.toLocaleLowerCase("fi-FI");
  const filtered = catalog.filter(a => `${a.title} ${a.status} ${labels[a.status]}`.toLocaleLowerCase("fi-FI").includes(query));
  $("count").textContent = `${filtered.length} / ${catalog.length} artikkelia`;
  $("article-list").replaceChildren(...filtered.map(a => {
    const button = document.createElement("button"); button.type = "button"; button.disabled = busy;
    button.setAttribute("aria-pressed", String(article?.id === a.id));
    const title = document.createElement("strong"); title.textContent = a.title;
    const meta = document.createElement("small"); meta.textContent = `${a.source_position}. · ${labels[a.status]} · versio ${a.revision}`;
    button.append(title, meta); button.onclick = () => { if (canLeave()) openArticle(a.id); }; return button;
  }));
}
async function refreshCatalog() { catalog = (await api("/api/articles")).articles; renderCatalog(); }
function setBusy(value) { busy = value; for (const element of $("article-form").elements) element.disabled = value; $("logout").disabled = value; $("restore").disabled = value; $("save").disabled = value || !dirty; renderCatalog(); }
function populate(data) {
  $("title").value = data.title; $("summary").value = data.summary; $("body").value = data.body_text;
  $("status").value = data.status; $("tags").value = JSON.parse(data.tags_json).join(", ");
  $("editorial-note").value = data.editorial_note; $("change-note").value = "";
  $("reading").hidden = true; $("body").hidden = false; $("preview").textContent = "Lukunäkymä";
}
async function openArticle(id) {
  if (busy) return;
  const own = ++sequence; setBusy(true);
  try {
    const data = await api(`/api/articles/${encodeURIComponent(id)}`);
    if (own !== sequence) return;
    article = data; populate(data); mark(false);
    $("meta").textContent = `Versio ${data.revision} · lähdesivut ${data.page_start}–${data.page_end}`;
    $("empty").hidden = true; $("editor").hidden = false; $("revision").hidden = true;
    $("notice").hidden = true; renderCatalog(); await loadHistory(id, own);
  } catch (error) { if (own === sequence) notice(error.message, true); }
  finally { if (own === sequence) setBusy(false); }
}
async function loadHistory(id, own = sequence) {
  const history = await api(`/api/articles/${encodeURIComponent(id)}/history`);
  if (own !== sequence || article?.id !== id) return;
  $("history-list").replaceChildren(...history.map(r => {
    const button = document.createElement("button"); button.type = "button";
    button.textContent = `Versio ${r.revision_no} · ${r.saved_at} · ${labels[r.status]}${r.change_note ? ` · ${r.change_note}` : ""}`;
    button.onclick = async () => {
      try {
        const selected = await api(`/api/articles/${encodeURIComponent(id)}/history/${r.revision_no}`);
        if (own !== sequence || article?.id !== id) return;
        revision = selected; $("revision-title").textContent = `Versio ${r.revision_no}: ${selected.title}`;
        $("revision-preview").textContent = selected.body_text; $("revision").hidden = false;
      } catch (error) { notice(error.message, true); }
    }; return button;
  }));
}
$("login-form").onsubmit = async event => {
  event.preventDefault(); $("login-error").textContent = "";
  const submit = $("login-form").querySelector("button"); submit.disabled = true;
  try { csrf = (await api("/api/login", { password: $("password").value, url: $("database-url")?.value })).csrf; $("password").value = ""; await enter(); }
  catch (error) { $("login-error").textContent = error.message; }
  finally { submit.disabled = false; }
};
async function enter() { await refreshCatalog(); $("login").hidden = true; $("workspace").hidden = false; $("logout").hidden = false; }
$("search").oninput = renderCatalog;
$("article-form").oninput = () => mark(true);
$("article-form").onsubmit = async event => {
  event.preventDefault(); if (!article || busy) return;
  const id = article.id, expected = article.revision;
  const changes = { title: $("title").value, summary: $("summary").value, body_text: $("body").value,
    tags_json: JSON.stringify($("tags").value.split(",").map(t => t.trim()).filter(Boolean)), status: $("status").value,
    editorial_note: $("editorial-note").value, change_note: $("change-note").value };
  setBusy(true); notice("Tallennetaan ja tarkistetaan uutta versiota…");
  try {
    const result = await api(`/api/articles/${encodeURIComponent(id)}`, { expected_revision: expected, changes });
    article = { ...article, ...changes, revision: result.revision }; mark(false);
    $("meta").textContent = `Versio ${result.revision} · lähdesivut ${article.page_start}–${article.page_end}`;
    notice(`Tallennettu. Nykyinen versio on ${result.revision}.`);
    try { await refreshCatalog(); await loadHistory(id); } catch { notice(`Versio ${result.revision} tallennettiin, mutta luetteloa ei saatu päivitettyä.`, true); }
  } catch (error) { notice(error.message, true); mark(true); }
  finally { setBusy(false); }
};
$("preview").onclick = () => {
  const show = $("reading").hidden; $("reading").textContent = $("body").value;
  $("reading").hidden = !show; $("body").hidden = show; $("preview").textContent = show ? "Takaisin muokkaukseen" : "Lukunäkymä";
};
$("reload").onclick = () => { if (article && canLeave()) openArticle(article.id); };
$("restore").onclick = () => {
  if (busy || !revision || !canLeave()) return;
  populate(revision); $("change-note").value = `Palautettu versio ${revision.revision_no}`; mark(true);
  notice(`Version ${revision.revision_no} teksti tuotiin editoriin. Tallenna se uudeksi versioksi.`);
};
$("download").onclick = () => {
  const blob = new Blob([$("title").value + "\n\n" + $("body").value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `artikkeli-${article.id}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("logout").onclick = async () => {
  if (busy || !canLeave()) return;
  try { await api("/api/logout", {}); location.reload(); } catch (error) { notice(error.message, true); }
};
window.addEventListener("beforeunload", event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
(async () => { const button = $("login-form").querySelector("button"); button.disabled = true; try { csrf = (await api("/api/session")).csrf; await enter(); } catch (error) { if ($("login-error").textContent) $("login-error").textContent = error.message; } finally { button.disabled = false; } })();
