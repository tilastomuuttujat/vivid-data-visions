// Bootstrap: loads the JSON files that sit next to the HTML, then starts the app.
const FILES = ['atlas.json', 'anchors.json', 'maakunnat.json'] as const;
const store: Record<string, unknown> = {};
(window as unknown as { __ATLAS_DATA__: typeof store }).__ATLAS_DATA__ = store;

const msg = () => document.getElementById('boot-msg')!;

async function viaFetch() {
  for (const f of FILES) {
    const r = await fetch(`./data/${f}`);
    if (!r.ok) throw new Error(f);
    store[f] = await r.json();
  }
}

function viaPicker(): Promise<void> {
  return new Promise((resolve) => {
    msg().innerHTML =
      'Selain ei salli tiedostojen automaattista lukemista suoraan levyltä.<br/>' +
      '<label>Valitse data-kansion JSON-tiedostot<input type="file" accept=".json" multiple /></label>' +
      `<small>Valitse kerralla: ${FILES.join(', ')}. Vaihtoehtoisesti avaa kansio paikallisella palvelimella (ks. LUEMINUT.txt).</small>`;
    const input = msg().querySelector('input')!;
    input.onchange = async () => {
      for (const file of Array.from(input.files ?? [])) {
        if ((FILES as readonly string[]).includes(file.name)) store[file.name] = JSON.parse(await file.text());
      }
      const missing = FILES.filter((f) => !store[f]);
      if (missing.length) { msg().insertAdjacentHTML('beforeend', `<small>Puuttuu: ${missing.join(', ')}</small>`); return; }
      resolve();
    };
  });
}

(async () => {
  try { await viaFetch(); } catch { await viaPicker(); }
  document.getElementById('boot')!.remove();
  await import('./app');
})();
