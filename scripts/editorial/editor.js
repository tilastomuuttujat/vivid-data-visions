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
    const meta = document.createElement("small"); meta.textContent = `${a.publication_number ?? a.source_position}. · ${labels[a.status]} · versio ${a.revision}`;
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
    $("analysis-view").replaceChildren(); $("analysis-state").textContent = ""; $("analysis").open = false;
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
 const fieldNames={historical_scope:'Tutkimuksen historiallinen kohdejakso',fieldwork_start:'Haastattelut alkoivat',fieldwork_end:'Haastattelut päättyivät',reported_participants:'Raportoitu osallistujamäärä',sampling:'Osallistujien valinta',annual_series:'Vuosittainen havaintosarja',population_prevalence_estimate:'Väestötason yleisyysarvio',migrated_value:'Siirretty arvo',verified_source_value:'Alkuperäislähteestä tarkistettu arvo',source_period:'Lähteen havaintojakso',year:'Vuosiavain',series_key:'Sarjatunniste',group_key:'Ryhmäavain',group_label:'Ryhmä',rows:'Tallennettuja rivejä',non_null_values:'Ei-NULL-arvoja',first_year:'Ensimmäinen tallennettu vuosi',last_year:'Viimeinen tallennettu vuosi',distinct_years:'Erillisiä vuosia',stored_years:'Tallennetut vuodet',years_without_any_row_inside_span:'Vuosia ilman riviä aikavälin sisällä',rows_without_source_url:'Rivejä ilman omaa lähdeosoitetta',value_kind:'Arvotyyppi',validation_status:'Tallennettu validointimerkintä',source_url:'Lähdeosoite',source_version:'Lähdeversio',kind:'Tyyppi',description:'Kuvaus',actor:'Toimijat',event:'Valinta tai toimi',implementation_status:'Toteutuksen rajaus',scope:'Kohderyhmä ja kattavuus',source_id:'Lähdetunniste',finding:'Havainto',supports:'Mitä tukee',does_not_establish:'Mitä ei osoita'};
 const valueLabels={retrospective_qualitative:'Laadullinen muistitietotutkimus',source_checked:'Lähdetarkistettu',method_and_scope_verification:'Menetelmän ja rajauksen tarkistus',voluntary_self_recruited:'Vapaaehtoisesti ilmoittautuneet'};
 const renderValue=value=>{
  if(Array.isArray(value)){const list=document.createElement('ul');for(const v of value){const li=document.createElement('li');li.append(renderValue(v));list.append(li);}return list;}
  if(value&&typeof value==='object'){const dl=document.createElement('dl');for(const [k,v] of Object.entries(value)){dl.append(node('dt',fieldNames[k]||k));const dd=document.createElement('dd');dd.append(renderValue(v));dl.append(dd);}return dl;}
  return node('p',value==null?'Ei kirjattu':typeof value==='boolean'?(value?'Kyllä':'Ei'):(valueLabels[value]||String(value)));
 };
 try {
  const data=await api('/api/analysis'), rows=articleAnalysisModel.project(catalog,data);
  $("analysis-state").textContent='Lukumäärät: A = artikkelin aikakausimerkintöjä, L = ajallisesti osuvia lähdetarkistettuja tulkintoja. L ei osoita vuosittaista tilastokattavuutta eikä vahvista koko väitettä. 0 = ei merkintää tässä kerroksessa; ei todiste ilmiön puuttumisesta.'+(data.missing?.length?' Osa analyysitauluista puuttuu.':'');
  const table=document.createElement('table'),head=document.createElement('tr');head.append(node('th','Artikkeli'));
  for(const p of articleAnalysisModel.periods)head.append(node('th',p.join('–')));head.append(node('th','Ajoittamatta'));const thead=document.createElement('thead');thead.append(head);table.append(thead);const tbody=document.createElement('tbody');
  for(const row of rows){const tr=document.createElement('tr');tr.append(node('th',row.article.title));for(const c of row.cells)tr.append(node('td',`A ${c.mentions} · L ${c.supplements}`));tr.append(node('td',String(row.undated)));tbody.append(tr);}table.append(tbody);target.append(table);
  const explanations=articleAnalysisModel.explanationComparison(rows);
  if(explanations.length){const panel=document.createElement('section');panel.setAttribute('aria-label','Selitysten vertailu');panel.append(node('h3','Selitysten vertailu'),node('p','Voimavarojen määrä, niiden jakautuminen, menettelyt ja muuttuneet tarpeet voivat vaikuttaa yhdessä. Vertailu ei aseta niitä kausaaliseen tärkeysjärjestykseen eikä laske samoja lähteitä riippumattomiksi vahvistuksiksi.'));
   const labels={resources:'Voimavarojen määrä',distribution:'Jakautuminen',procedures:'Menettelyt',needs:'Muuttuneet tarpeet'};
   for(const g of explanations){const d=document.createElement('details');d.append(node('summary',g.label+' · '+(g.status==='current'?'kytkennät ajantasaiset':'kytkennät tarkistettava')),node('p',g.outcome));if(g.status!=='current')d.append(node('p','Artikkeli tai taustalla oleva lähdekytkentä on muuttunut tai puuttuu. Synteesi on tarkistettava ennen käyttöä.'));
    const t=document.createElement('table'),h=document.createElement('tr');for(const l of ['Selitys','Nykyinen näyttö','Rajaus','Erottava tarkistus'])h.append(node('th',l));const th=document.createElement('thead');th.append(h);t.append(th);const tb=document.createElement('tbody');for(const c of g.cells){const tr=document.createElement('tr');tr.append(node('th',labels[c.id]||c.id),node('td',c.observed),node('td',c.limits),node('td',c.discriminating_test));tb.append(tr);}t.append(tb);d.append(t);
    for(const c of g.cells){const box=document.createElement('details');box.append(node('summary',(labels[c.id]||c.id)+' · oletus ja odotettu havainto'),node('p',c.hypothesis),node('p','Jos selitys pitää: '+c.prediction));d.append(box);}
    d.append(node('h4','Historiallinen vertailuraja'),node('p',g.historical_check),node('h4','Vastanäyttö ja onnistumiset'),node('p',g.counterevidence),node('h4','Johtopäätös'),node('p',g.conclusion),node('h4','Taustalla olevat lähdekortit'));
    for(const q of g.inputs){const b=node('button',(q.sources?.[0]?.title||'Lähdekortti')+' · '+(q.current?'nykyinen':'tarkistettava'));b.type='button';b.disabled=!q.claim_key;b.onclick=()=>{const el=document.getElementById('claim-'+q.claim_key);if(!el)return;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true});};d.append(b);}panel.append(d);
   }
   const b=node('button','Lataa selitysten vertailu JSON');b.type='button';b.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:'explanation-comparison-2026-11-07-v1',groups:explanations},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='selitysten-vertailu.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};panel.append(b);target.append(panel);
  }
  const synthesis=articleAnalysisModel.populationSynthesis(rows);
  const comparison=document.createElement('section');comparison.setAttribute('aria-label','Väestöaineiston vertailusynteesi');comparison.append(node('h3','Väestöaineiston vertailusynteesi'),node('p',`${synthesis.ready}/${synthesis.total} ryhmässä on molemmat ajantasaiset kytkennät. Tämä ei ole aineiston valmiusaste tai riippumattomien tutkimusten lukumäärä. ${synthesis.scope} Lähteet tukevat rajattuja havaintoja; ne eivät vahvista koko artikkelin selitystä tai kausaalivaikutusta.`));
  for(const g of synthesis.groups){
   const box=document.createElement('details');box.append(node('summary',`${g.label} · ${g.current}/${g.expected} ajantasaista kytkentää`),node('h4','Mitä aineisto tukee'),node('p',g.support),node('h4','Mitä siitä ei voi päätellä'),node('p',g.boundary),node('h4','Seuraava ratkaiseva näyttö'),node('p',g.next));
   for(const basis of g.basis){
    box.append(node('h4',basis.title));
    if(basis.status!=='current'){box.append(node('p',basis.status==='stale'?'Artikkelirevisio on muuttunut – kytkentä tarkistettava.':basis.status==='needs_review'?'Lähdeversio tai luokitus on tarkistettava.':'Lähdekytkentä puuttuu tästä otoksesta.'));continue;}
    const c=basis.claim;box.append(node('blockquote',c.article_passage),node('p','Havaintojen rajaus: '+(c.classification.observation_note||c.observationPeriods?.map(p=>p.join('–')).join(', ')||'Tarkistamatta')),renderValue(c.evidence));
    const jump=node('button','Avaa koko lähdekortti');jump.type='button';jump.onclick=()=>{const card=document.getElementById('claim-'+c.key);if(card){card.closest('details').open=true;card.scrollIntoView({block:'start'});card.focus({preventScroll:true});}};box.append(jump);
   }
   comparison.append(box);
  }
  comparison.append(node('h4','Yhteinen seuraava työ'));
  const nextWork=document.createElement('ol');
  for(const text of (synthesis.ready===6?['Varmenna väestöryhmien yhteensopivat nimittäjät ennen saamis- ja osallistumisosuuksia.','Yhdistä väestömäärään palvelujen saavutettavuus, toimintakyky ja tarve; erottele käyttö ja riittävyys.','Kytke menojen hinta- ja volyymimuutokset, etuustasot ja tulot ennen demografisia kustannus- tai tulevaisuuslaskelmia.']:['Tarkista puuttuvat tai vanhentuneet kytkennät ennen yhteisen tulkinnan käyttöä.']))nextWork.append(node('li',text));comparison.append(nextWork);
  const exportComparison=node('button','Lataa vertailusynteesi JSON');exportComparison.type='button';exportComparison.onclick=()=>{const blob=new Blob([JSON.stringify(articleAnalysisModel.populationExport(synthesis),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vaesto-vertailusynteesi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};comparison.append(exportComparison);target.append(comparison);
  target.append(node('h3','Tietokannasta kerätyt aineistoehdokkaat'),node('p','Aihehaku ja tallennettujen vuosien kartoitus. Lähteen oikeellisuutta tai tukea artikkelin väitteelle ei ole vielä hyväksytty.'));
  if(!data.discoveries?.length)target.append(node('p','Ei keruuraportteja tässä kirjaston otoksessa.'));
  for(const raw of data.discoveries||[]){const report=JSON.parse(raw.payload_json),current=catalog.find(a=>a.id===report.article_id),details=document.createElement('details');details.append(node('summary',`${report.title} · ${report.series.length} sarjaehdokasta · ${report.events.length} tapahtumaa`));details.append(node('p',current?.revision===report.article_revision?'Keruu vastaa nykyistä artikkelirevisiota.':'Vanha artikkelirevisio – kytkennät tarkistettava uudelleen.'));
   for(const candidate of report.series){const s=candidate.series,box=document.createElement('details');box.append(node('summary',`${s.title} · ${s.unit||'Yksikkö puuttuu'} · ${s.geography||'Alue puuttuu'}`),node('p','Sarjatunniste: '+s.series_key),node('p',s.description||'Määritelmä puuttuu'),renderValue(candidate.groups),renderValue(candidate.value_kinds_and_validation),renderValue(candidate.observation_sources));details.append(box);}
   if(report.events.length)details.append(node('h4','Historialliset tapahtuma- ja lähde-ehdokkaat'),renderValue(report.events));details.append(node('p','Ennen väitekäyttöä: tarkista alkuperäislähde, mittarin merkitys, havaintojaksot, ryhmät ja yhteismitallisuus.'));target.append(details);
  }
  if(data.merges?.length){target.append(node('h3','Yhdistettyjen artikkelien alkuperäiset versiot'),node('p','Kirjastossa on yksi aktiivinen artikkeli kustakin yhdistetystä parista. Alkuperäiset tunnisteet, tekstit ja kytkennät säilyvät arkistossa. Eri tekstiin kohdistuva täydennys vaatii katkelman tarkistuksen.'));
   for(const m of data.merges){const saved=JSON.parse(m.payload_json),d=document.createElement('details');d.append(node('summary',saved.original_article.title+' · arkistoitu rinnakkaisversio'),node('p','Säilytettävä artikkeli: '+m.canonical_article_id),node('p',saved.same_text?'Alkuperäiset artikkelitekstit olivat täsmälleen samat.':'Tekstit eroavat; alla säilytetty alkuperäinen rinnakkaisteksti.'),node('pre',saved.original_article.body_text));const b=node('button','Lataa alkuperäinen versio ja kaikki kytkennät JSON');b.type='button';b.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='artikkelin-yhdistamisarkisto-'+m.alias_article_id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};d.append(b);target.append(d);}
  }
  const gaps=articleAnalysisModel.audit(rows);
  target.append(node('h3','Priorisoitu puutelista'),node('p','P1: historiallisen tai tulevaisuusväitteen lähdekytkentä tai revision tarkistus. P2: luokitus, havaintovuodet tai kohderyhmä. P3: kirjattu jatkotutkimus. Prioriteetti on toimituksellinen työjärjestys, ei väitteen totuusarvio. Ajallinen osuma ei poista väitekohtaisen tarkistuksen tarvetta.'));
  const controls=document.createElement('div'),filter=document.createElement('select');filter.setAttribute('aria-label','Puutelistan prioriteetti');
  for(const [v,l] of [['all','Kaikki puutteet'],['P1','P1 – ensin'],['P2','P2 – rajaukset'],['P3','P3 – jatkotutkimus']]){const o=node('option',l);o.value=v;filter.append(o);}
  const gapList=document.createElement('div'),download=node('button','Lataa puutelista JSON');download.type='button';
  download.onclick=()=>{const blob=new Blob([JSON.stringify({method:'claim-audit-v1',generated_at:new Date().toISOString(),scope:'Tallennetut väiteankkurit ja nykyiset aikakausianalyysit, ei kaikkien väitteiden inventaario',gaps},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='atlas-artikkelien-puutelista.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const showGaps=()=>{gapList.replaceChildren();const selected=gaps.filter(g=>filter.value==='all'||g.priority===filter.value);gapList.append(node('p',`${selected.length} työkohtaa · ${new Set(selected.map(g=>g.article_id)).size} artikkelia`));for(const g of selected){const d=document.createElement('details');d.append(node('summary',`${g.priority} · ${g.title} · ${g.period?.join('–')||'Ajoittamatta'}`));if(g.claim)d.append(node('blockquote',g.claim));d.append(node('p',g.missing),node('p','Seuraava työ: '+g.action));gapList.append(d);}};
  filter.onchange=showGaps;controls.append(filter,download);target.append(controls,gapList);showGaps();
  const totals={};for(const c of rows.flatMap(r=>r.claims).filter(c=>c.current))totals[c.type]=(totals[c.type]||0)+1;
  target.append(node('h3','Väitteiden toimituksellinen luokitus'),node('p',Object.entries(totals).map(([t,n])=>`${articleAnalysisModel.typeLabels[t]||t}: ${n}`).join(' · ')));
  target.append(node('h3','Väiterekisterin ensimmäinen kerros'));
  target.append(node('p','Rekisteri näyttää tallennettujen täydennysten väiteankkurit, ei vielä kaikkia artikkelien väitteitä. Luokitukset ovat katkelmakohtaisia toimituksellisia ehdotuksia. Ne eivät hyväksy kausaalista vaikutusta tai koko artikkelin kaikkia väitteitä. Yhteiset mekanismitunnisteet odottavat erillistä tarkistusta.'));
  for(const row of rows){const group=document.createElement('details');group.append(node('summary',`${row.article.title} · ${row.claims.length} täydennystä`));if(!row.claims.length)group.append(node('p','Ei täydennyksiä tässä kerroksessa.'));
   for(const c of row.claims){const card=document.createElement('section');card.id='claim-'+c.key;card.tabIndex=-1;card.append(node('h4',c.id),node('p',`${c.current?'Nykyinen revisio':'VANHENTUNUT revisio – ei matriisissa'} · ${c.period?.join('–')||'Ajoittamatta'} · ${c.key}`),node('blockquote',c.article_passage));
    card.append(node('p',`Väitelaji: ${articleAnalysisModel.typeLabels[c.type]||c.type} · toimituksellinen ehdotus`),node('p',c.classification?.rationale||'Luokitus tarkistamatta'),node('p',c.classification?.observation_note||'Lähteen havaintovuodet tarkistamatta.'),node('p','Kohderyhmä ja alue: '+(c.scope||'Tarkistamatta')));
    for(const [label,value] of [['Tulkinta',c.addition_text],['Muutospaine',c.pressure],['Valinta ja toteutus',c.choice_and_implementation],['Näyttö',c.evidence],['Rajoitukset',c.limits],['Vaihtoehtoinen selitys',c.alternative_explanation],['Tutkimusaukko',c.research_gap]])card.append(node('h5',label),renderValue(value));
    if(c.explanation_comparison)card.append(node('h5','Selitysten vertailu: oletukset, näyttö ja rajat'),renderValue(c.explanation_comparison));
    if(c.evidence_design)card.append(node('h5','Tutkimusasetelma ja aikarajaukset'),renderValue(c.evidence_design));
    if(c.source_discrepancies?.length)card.append(node('h5','Alkuperäislähteestä poikkeavat siirtorivit'),renderValue(c.source_discrepancies));
    if(c.origin_article_id!==c.article_id)card.append(node('p','Täydennyksen alkuperäinen artikkelitunniste: '+c.origin_article_id));
    if(c.merged_origins?.length)card.append(node('h5','Sama täydennys myös yhdistetyssä artikkelissa'),renderValue(c.merged_origins));
    if(c.data_links)card.append(node('h5','Varmennetut aineistokytkennät'),renderValue(c.data_links));
    for(const source of c.sources||[]){const u=new URL(source.url);if(u.protocol!=='https:')continue;const a=node('a',source.title);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a,node('p',`${source.publisher} · ${source.locator} · tarkistettu ${source.checked_on}`));}group.append(card);
   }target.append(group);
  }
 }catch(error){$("analysis-state").textContent=error.message;}finally{button.disabled=false;}
};
