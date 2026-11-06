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
async function disconnect(forget = false) {
  if (busy || !canLeave()) return;
  try {
    await api("/api/logout", forget ? { forget: true } : {}); csrf = ""; catalog = []; article = null; revision = null; dirty = false;
    $("article-form").reset(); $("article-list").replaceChildren(); $("history-list").replaceChildren();
    $("reading").textContent = ""; $("revision-preview").textContent = ""; $("revision-title").textContent = "";
    $("workspace").hidden = true; $("logout").hidden = true; $("login").hidden = false; $("login-error").textContent = forget ? "Laite unohdettu. Kirjaudu seuraavalla kerralla uudelleen." : "Yhteys katkaistu.";
  } catch (error) { notice(error.message, true); }
};
$("logout").onclick = () => disconnect();
if ($("forget-device")) $("forget-device").onclick = () => disconnect(true);
window.addEventListener("beforeunload", event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
(async () => { const button = $("login-form").querySelector("button"); button.disabled = true; try { csrf = (await api("/api/session")).csrf; await enter(); } catch (error) { if ($("login-error").textContent) $("login-error").textContent = error.message; } finally { button.disabled = false; } })();

$("load-analysis").onclick = async () => {
 const button=$("load-analysis"); button.disabled=true;
 const target=$("analysis-view");target.replaceChildren();
 const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 const text=v=>typeof v==='string'?v:JSON.stringify(v,null,2);
 try {
  const data=await api('/api/analysis'), rows=articleAnalysisModel.project(catalog,data);
  $("analysis-state").textContent='Lukumäärät: A = artikkelin aikakausimerkintöjä, L = ajallisesti osuvia lähdetarkistettuja tulkintoja. L ei osoita vuosittaista tilastokattavuutta eikä vahvista koko väitettä. 0 = ei merkintää tässä kerroksessa; ei todiste ilmiön puuttumisesta.'+(data.missing?.length?' Osa analyysitauluista puuttuu.':'');
  const table=document.createElement('table'),head=document.createElement('tr');head.append(node('th','Artikkeli'));
  for(const p of articleAnalysisModel.periods)head.append(node('th',p.join('–')));head.append(node('th','Ajoittamatta'));const thead=document.createElement('thead');thead.append(head);table.append(thead);const tbody=document.createElement('tbody');
  for(const row of rows){const tr=document.createElement('tr');tr.append(node('th',row.article.title));for(const c of row.cells)tr.append(node('td',`A ${c.mentions} · L ${c.supplements}`));tr.append(node('td',String(row.undated)));tbody.append(tr);}table.append(tbody);target.append(table);
  target.append(node('h3','Väiterekisterin ensimmäinen kerros'));
  target.append(node('p','Rekisteri näyttää tallennettujen täydennysten väiteankkurit, ei vielä kaikkia artikkelien väitteitä. Luokka: mekanismihypoteesi / lähdetarkistettu tulkinta. Mekanismien yhteinen luokitus ja väitteiden hyväksyntä odottavat toimituksellista tarkistusta.'));
  for(const row of rows){const group=document.createElement('details');group.append(node('summary',`${row.article.title} · ${row.claims.length} täydennystä`));if(!row.claims.length)group.append(node('p','Ei täydennyksiä tässä kerroksessa.'));
   for(const c of row.claims){const card=document.createElement('section');card.append(node('h4',c.id),node('p',`${c.current?'Nykyinen revisio':'VANHENTUNUT revisio – ei matriisissa'} · ${c.period?.join('–')||'Ajoittamatta'} · ${c.key}`),node('blockquote',c.article_passage));
    for(const [label,value] of [['Tulkinta',c.addition_text],['Muutospaine',c.pressure],['Valinta ja toteutus',c.choice_and_implementation],['Näyttö',c.evidence],['Rajoitukset',c.limits],['Vaihtoehtoinen selitys',c.alternative_explanation],['Tutkimusaukko',c.research_gap]])card.append(node('h5',label),node('p',text(value)));
    for(const source of c.sources||[]){const u=new URL(source.url);if(u.protocol!=='https:')continue;const a=node('a',source.title);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a,node('p',`${source.publisher} · ${source.locator} · tarkistettu ${source.checked_on}`));}group.append(card);
   }target.append(group);
  }
 }catch(error){$("analysis-state").textContent=error.message;}finally{button.disabled=false;}
};
