/* Turso transport for the standalone editor. Credentials live only in this closure. */
(() => {
  const fields = ["title", "summary", "body_text", "tags_json", "status", "editorial_note", "review_flags_json", "change_note"];
  function createTransport(fetcher = window.fetch.bind(window)) {
    let endpoint = "", token = "";
    const argument = value => value === null ? { type: "null" } : typeof value === "number" ? { type: "integer", value: String(value) } : { type: "text", value: String(value) };
    const statement = (sql, args = []) => ({ sql, args: args.map(argument) });
    const rows = result => result.rows.map(row => Object.fromEntries(row.map((cell, i) => [result.cols[i].name, cell.type === "null" ? null : cell.type === "integer" ? Number(cell.value) : cell.value])));
    async function pipeline(statements, connection, close = true) {
      if (!token) throw new Error("Anna Turso-tunniste avataksesi tietokannan.");
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const requests = statements.map(stmt => ({ type: "execute", stmt }));
        if (close) requests.push({ type: "close" });
        const response = await fetcher(endpoint, { method: "POST", cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal,
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ baton: connection.baton, requests }) });
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Turso-tunniste ei kelpaa tai sen oikeudet eivät riitä." : "Tietokantayhteys epäonnistui.");
        const result = await response.json(); connection.baton = result.baton || null;
        if (!Array.isArray(result.results) || result.results.length !== requests.length || result.results.some(r => r.type !== "ok")) throw new Error("Tietokantapyyntöä ei hyväksytty. Tarkista tunnisteen oikeudet ja tietokannan rakenne.");
        return result.results.filter(r => r.response.type === "execute").map(r => rows(r.response.result));
      } finally { clearTimeout(timeout); }
    }
    const query = async (sql, args = []) => (await pipeline([statement(sql, args)], { baton: null }))[0];
    async function save(id, expected, changes) {
      if (!Number.isInteger(expected) || expected < 1 || !changes || Object.keys(changes).some(k => !fields.includes(k))) throw new Error("Virheelliset tallennustiedot.");
      const keys = Object.keys(changes);
      if (!keys.length || keys.some(k => typeof changes[k] !== "string")) throw new Error("Virheelliset muokattavat kentät.");
      for (const k of ["title", "body_text"]) if (k in changes && !changes[k].trim()) throw new Error("Otsikko ja teksti eivät saa olla tyhjiä.");
      const connection = { baton: null };
      try {
        await pipeline([statement("PRAGMA foreign_keys=ON"), statement("BEGIN IMMEDIATE")], connection, false);
        if (!connection.baton) throw new Error("Transaction connection missing");
        const before = (await pipeline([statement("SELECT " + fields.join(",") + " FROM editorial__articles WHERE id=?", [id])], connection, false))[0][0];
        if (!before || !connection.baton) throw new Error("Transaction read failed");
        const result = await pipeline([
          statement("UPDATE editorial__articles SET " + keys.map(k => k + "=?").join(",") + " WHERE id=? AND (SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=?)=?", [...keys.map(k => changes[k]), id, id, expected]),
          statement("SELECT changes() AS affected"),
          statement("SELECT " + fields.join(",") + ",(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=?) AS revision FROM editorial__articles WHERE id=?", [id, id])
        ], connection, false);
        if (result[1][0]?.affected !== 1) {
          const error = new Error("Artikkeli muuttui muualla. Oma tekstisi säilyy editorissa. Lataa tarvittaessa tekstisi ja avaa uusin versio."); error.conflict = true; throw error;
        }
        const after = result[2][0];
        const changed = keys.some(k => before[k] !== changes[k]);
        if (!after || after.revision !== expected + Number(changed) || keys.some(k => after[k] !== changes[k])) throw new Error("Tallennetun tekstin tai version tarkistus epäonnistui.");
        await pipeline([statement("COMMIT")], connection, true);
        return { revision: after.revision };
      } catch (error) {
        if (connection.baton) { try { await pipeline([statement("ROLLBACK")], connection, true); } catch { /* No automatic write retry. */ } }
        if (error.conflict) throw error;
        throw new Error("Tallennusta ei voitu vahvistaa. Säilytä oma tekstisi ja tarkista uusin versio ennen uutta yritystä.");
      }
    }
    return async (path, data) => {
      if (path === "/api/login") {
        const url = new URL(data.url.trim().replace(/^libsql:\/\//, "https://"));
        if (url.protocol !== "https:" || !url.hostname.endsWith(".turso.io") || url.port || url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) throw new Error("Anna Turson libsql://- tai https://-tietokantaosoite.");
        endpoint = url.origin + "/v2/pipeline"; token = data.password.trim();
        try { await query("SELECT count(*) AS count FROM editorial__articles"); } catch (error) { token = ""; endpoint = ""; throw error; }
        return { csrf: "browser-memory-session" };
      }
      if (path === "/api/session") throw new Error("Tunnistetta ei säilytetä sivun sulkemisen yli.");
      if (path === "/api/logout") { token = ""; endpoint = ""; return { ok: true }; }
      if (!token) throw new Error("Avaa ensin tietokanta.");
      if (path === "/api/articles") return { articles: await query("SELECT id,source_position,title,summary,status,revision,updated_at FROM editorial__article_catalog ORDER BY source_id,source_position") };
      const parts = path.split("/"); const id = decodeURIComponent(parts[3] || "");
      if (parts[1] !== "api" || parts[2] !== "articles" || !id) throw new Error("Tuntematon pyyntö.");
      if (data !== undefined && parts.length === 4) return save(id, data.expected_revision, data.changes);
      if (parts.length === 4) {
        const result = await query("SELECT id," + fields.join(",") + ",page_start,page_end,updated_at,(SELECT max(revision_no) FROM editorial__article_revisions WHERE article_id=editorial__articles.id) AS revision FROM editorial__articles WHERE id=?", [id]);
        if (!result.length) throw new Error("Artikkelia ei löydy."); return result[0];
      }
      if (parts[4] === "history" && parts.length === 5) return query("SELECT revision_no,title,status,change_note,saved_at FROM editorial__article_revisions WHERE article_id=? ORDER BY revision_no DESC", [id]);
      if (parts[4] === "history" && parts.length === 6) {
        const result = await query("SELECT revision_no," + fields.join(",") + ",saved_at FROM editorial__article_revisions WHERE article_id=? AND revision_no=?", [id, Number(parts[5])]);
        if (!result.length) throw new Error("Versiota ei löydy."); return result[0];
      }
      throw new Error("Tuntematon pyyntö.");
    };
  }
  window.createTursoArticleTransport = createTransport;
  window.articleEditorTransport = createTransport();
})();
