"""Build one self-contained HTML article editor. Contains code, never credentials or articles."""
import base64
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def build():
    html=(ROOT/'editor.html').read_text().replace('<script src="/editor.js" defer></script>','')
    html=html.replace('Syötä palvelimen käynnistyksen yhteydessä näytetty pääsykoodi.',
      'GitHub-yhteys käyttää Actionsiin tallennettua Turso-salaisuutta. Atlas-ylläpidon GitHub-istuntoa käytetään automaattisesti samassa välilehdessä. Pelkkä github.com-kirjautuminen ei riitä. GitHub-tunniste tarvitsee Actions: write ja Contents: read -oikeudet tähän repositorioon. Tunniste säilyy vain muistissa.')
    html=html.replace('<label>Pääsykoodi<input id="password" type="password" autocomplete="current-password" required></label>',
      '<label>Yhteystapa<select id="connection-mode"><option value="github">GitHub Actions (nykyinen Turso-salaisuus)</option><option value="turso">Suora Turso-yhteys</option></select></label><label>Tietokannan osoite (vain suora Turso-yhteys)<input id="database-url" value="libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io" autocomplete="off" spellcheck="false" required></label><label>GitHub-tunniste (tai suoran yhteyden Turso-tunniste)<input id="password" type="password" autocomplete="off" spellcheck="false" required></label>')
    html=html.replace('>Kirjaudu</button>','>Avaa tietokanta</button>').replace('>Kirjaudu ulos</button>','>Katkaise yhteys</button>')
    html=html.replace('<meta name="viewport"', '<meta name="referrer" content="no-referrer"><meta name="viewport"')
    scripts=[(ROOT/name).read_text().replace('</script','<\\/script') for name in ('turso-browser.js','github-browser.js','editor.js')]
    hashes=['\'sha256-'+base64.b64encode(hashlib.sha256(code.encode()).digest()).decode()+'\'' for code in scripts]
    policy="default-src 'none'; script-src "+' '.join(hashes)+"; style-src 'unsafe-inline'; connect-src https://*.turso.io https://api.github.com; img-src data:; base-uri 'none'; form-action 'none'"
    html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'">',1)
    return html.replace('</body>',''.join('<script>'+code+'</script>' for code in scripts)+'</body>')

if __name__=='__main__':
    output=ROOT.parents[1]/'public/article-editor/index.html'
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(build())
    print('Built credential-free standalone article editor:',output)
