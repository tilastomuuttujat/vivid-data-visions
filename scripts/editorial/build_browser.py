"""Build one self-contained HTML article editor. Contains code, never credentials or articles."""
import base64
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def build():
    html=(ROOT/'editor.html').read_text().replace('<script src="/editor.js" defer></script>','')
    html=html.replace('Syötä palvelimen käynnistyksen yhteydessä näytetty pääsykoodi.',
      'GitHub-yhteys käyttää Actionsiin tallennettua Turso-salaisuutta. Atlas-ylläpidon GitHub-istuntoa käytetään automaattisesti samassa välilehdessä. Pelkkä github.com-kirjautuminen ei riitä. GitHub-tunniste tarvitsee Actions: write ja Contents: read -oikeudet tähän repositorioon. Voit muistaa GitHub-tunnisteen tämän selaimen localStoragessa. Valitse muistaminen vain omalla laitteellasi.')
    html=html.replace('<label>Pääsykoodi<input id="password" type="password" autocomplete="current-password" required></label>',
      '<label>Yhteystapa<select id="connection-mode"><option value="github">GitHub Actions (nykyinen Turso-salaisuus)</option><option value="turso">Suora Turso-yhteys</option></select></label><label id="database-label" hidden>Tietokannan osoite<input id="database-url" value="libsql://murrosmatriisi-tilastomuuttujat.aws-eu-north-1.turso.io" autocomplete="off" spellcheck="false"></label><label><span id="credential-label">GitHub-tunniste</span><input id="password" type="password" autocomplete="off" spellcheck="false" required></label><label id="remember-label"><input id="remember-device" type="checkbox"> Muista minut tällä laitteella</label>')
    html=html.replace('</style>', '#remember-label{display:flex;align-items:center;gap:10px}#remember-device{width:auto}header{flex-wrap:wrap}header button{color:#193138}</style>')
    html=html.replace('<button id="logout"', '<button id="forget-device" type="button" hidden>Unohda tämä laite</button><button id="logout"')
    html=html.replace('>Kirjaudu</button>','>Avaa tietokanta</button>').replace('>Kirjaudu ulos</button>','>Katkaise yhteys</button>')
    html=html.replace('<meta name="viewport"', '<meta name="referrer" content="no-referrer"><meta name="viewport"')
    scripts=[(ROOT/name).read_text().replace('</script','<\\/script') for name in ('turso-browser.js','github-browser.js','analysis-model.js','editor.js')]
    hashes=['\'sha256-'+base64.b64encode(hashlib.sha256(code.encode()).digest()).decode()+'\'' for code in scripts]
    policy="default-src 'none'; script-src "+' '.join(hashes)+"; style-src 'unsafe-inline'; connect-src https://*.turso.io https://api.github.com; img-src data:; base-uri 'none'; form-action 'none'"
    html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'">',1)
    return html.replace('</body>',''.join('<script>'+code+'</script>' for code in scripts)+'</body>')

if __name__=='__main__':
    output=ROOT.parents[1]/'public/article-editor/index.html'
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(build())
    print('Built credential-free standalone article editor:',output)
