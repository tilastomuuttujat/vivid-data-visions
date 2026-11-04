# Artikkelieditori HTML- ja JavaScript-tiedostona

Editorilla voi hakea ja avata Turson artikkelit, muokata otsikkoa, tiivistelmää,
tekstiä, tilaa, tunnisteita ja huomautuksia sekä tarkastella ja palauttaa aiempia
versioita. Palautus tuodaan ensin muokattavaksi ja tallennetaan uudeksi versioksi.
Versiohistoria säilyy. Editorin julkaisutila ei automaattisesti julkaise artikkelia
verkkosivulle.

## Suora HTML-versio — ensisijainen käyttötapa

[Avaa editori](https://tilastomuuttujat.github.io/vivid-data-visions/article-editor/)
tai [avaa ladattava HTML-tiedosto](https://tilastomuuttujat.github.io/vivid-data-visions/downloads/artikkelieditori.html).
Koko editori on yhdessä tiedostossa `public/article-editor/index.html`: erillistä
palvelinta, Pythonia tai Codespacesia ei tarvita. Internet-yhteys tarvitaan Tursoon.

1. Avaa HTML-editori selaimeen. Murrosmatriisi-kannan osoite on valmiina.
2. Syötä Turson kirjoitukseen oikeuttava tunniste ja valitse **Avaa tietokanta**.
3. Valitse artikkeli, muokkaa ja tallenna. Versiohistoria toimii kuten palvelinversiossa.
4. **Katkaise yhteys** tyhjentää tunnisteen muistista. Myös sivun sulkeminen tai
   päivittäminen vaatii tunnisteen syöttämisen uudelleen.

Samaa tunnisteen arvoa voi käyttää kuin GitHub Actionsissa, jos alkuperäinen arvo
on tallessa. **GitHubin Actions-salaisuutta ei voi hakea takaisin selaimeen.**
HTML-versio ei lue GitHub-avaimia tai salaisuuksia. Tunnistetta ei sisällytetä
koodiin eikä talleteta evästeisiin, localStorageen tai sessionStorageen. Se kulkee
suoraan selaimesta HTTPS-yhteydellä kyseiseen Turso-kantaan. Tämä on ylläpitäjän
editori: tunnisteen haltijalla ovat tunnisteen myöntämät tietokantaoikeudet.
Turso ei käytä tässä Supabasen julkista anon-avainta vastaavaa pääsyrajaa.

Ulkoisia JavaScript-kirjastoja tai analytiikkaa ei ladata. Kohdeosoite rajataan
HTTPS-yhteydellä Turson `*.turso.io`-osoitteisiin, uudelleenohjauksia ei seurata,
ja sivulla on sisältöturvapolitiikka. Jos laitteen tiedostokatselin ei suorita
paikallisen HTML:n JavaScriptiä, käytä yllä olevaa editorin verkkolinkkiä.

Suora versio käyttää samaa muokkauslomaketta kuin alla kuvattu valinnainen
palvelinversio. Tallennus käyttää Turson transaktiota, versionumeron tarkistusta,
tekstin lukuvertailua ja vasta tämän jälkeen COMMIT-vahvistusta. Muutoksia ei
lähetetä automaattisesti uudelleen verkkovirheen jälkeen.

Generointi lähteistä:

```sh
python scripts/editorial/build_browser.py
```

## Valinnainen palvelinversio GitHub Codespacesissa


1. Lisää GitHubin **Settings → Codespaces → Secrets** -kohtaan salaisuus
   `TURSO_AUTH_TOKEN` ja salli sen käyttö repositoriolle
   `tilastomuuttujat/vivid-data-visions`. Käytä murrosmatriisi-kannan kirjoitukseen
   oikeuttavaa Turso-tunnistetta. **Actionsiin aiemmin tallennettu samanniminen
   salaisuus ei siirry Codespacesiin automaattisesti.** Älä kirjoita arvoa
   lähdekoodiin tai jaa sitä keskustelussa.
2. Avaa repo → **Code → Codespaces → New with options**. Valitse
   **Atlas article editor** -kehitysympäristö ja luo Codespace.
3. Käynnistä editori sen terminaalissa:

   ```sh
   python scripts/editorial/editor_server.py --host 0.0.0.0
   ```

4. Kopioi terminaalin näyttämä **Pääsykoodi**. Avaa **Ports**-välilehdeltä portti
   **8765** selaimen omaan välilehteen (**Open in Browser**). Pidä portin
   näkyvyys **Private**. Kirjaudu editoriin pääsykoodilla.
5. Valitse artikkeli, muokkaa, kuvaa muutos ja valitse **Tallenna uusi versio**.
   Onnistunut tallennus näyttää vahvistetun versionumeron.

Ympäristö ei asenna sovelluksen JavaScript-riippuvuuksia: editorin palvelin käyttää
vain Pythonin standardikirjastoa ja repon nykyistä Turso-yhteyskoodia. Tekstit
luetaan suoraan yksityisestä `editorial__articles`-kokonaisuudesta.

Viralliset ohjeet:
[Codespaces-salaisuudet](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces) ja
[portin avaaminen](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).

## Paikallinen käyttö

Aseta Turso-tunniste luotetun palvelimen `TURSO_AUTH_TOKEN`-ympäristömuuttujaan.
Käynnistä:

```sh
python scripts/editorial/editor_server.py
```

Avaa `http://127.0.0.1:8765` ja syötä terminaalin pääsykoodi. Palvelin kuuntelee
paikallisesti oletuksena. Valinnainen `EDITOR_PASSWORD`-ympäristömuuttuja voi
sisältää oman vähintään 16 merkin pääsykoodin; muuten se arvotaan joka käynnistyksellä.

Sulje palvelin **Ctrl+C**:llä ja pysäytä Codespace, kun lopetat. Tämä on yksityinen
kehitysympäristössä ajettava editori, ei ympärivuorokautinen verkkopalvelu.
GitHub Pages ei suorita Python-palvelinta, joten tätä editoria ei linkitetä
staattiseen sivustoon toimimattomana tallennuslomakkeena.

## Tallennus ja virhetilanteet

- Jokainen tallennus käyttää avatun artikkelin versionumeroa. Jos toinen käyttäjä
  tai Turso-editori ehti muuttaa tekstiä, tallennus hylätään ylikirjoittamisen sijasta.
- Teksti jää lomakkeeseen virheen jälkeen. **Lataa oma teksti** tallentaa otsikon
  ja tekstin UTF-8-tiedostoksi ennen uusimman version avaamista.
- **Avaa uusin**, artikkelin vaihtaminen ja uloskirjautuminen kysyvät ennen
  tallentamattomien muutosten hylkäämistä. Myös sivulta poistumista varoitetaan
  selaimen sallimalla tavalla. Selaimen kaatumisen varalle ei ole automaattista
  paikallista luonnosvarmuuskopiota.
- Verkkovirhe tallennuksen jälkeen voi jättää lopputuloksen epäselväksi. Säilytä
  oma tekstisi, avaa uusin versio ja tarkista se ennen uutta tallennusyritystä.
- Kahdeksan tunnin istunnon päätyttyä säilytä oma teksti tiedostona ennen
  uudelleenkirjautumista tai sivun päivittämistä.

## Palvelinversion yksityisyys

Turso-avain on vain Python-palvelimen ympäristössä. Selaimeen tulee kirjautumisen
jälkeen artikkeliteksti sekä lyhytikäisen istunnon CSRF-tunniste; tietokanta-avain
ei tule HTML:ään, JavaScriptiin eikä API-vastauksiin. Istunto on HttpOnly- ja
SameSite=Strict-evästeessä, HTTPS-yhteydellä myös Secure. Muuttavat pyynnöt
vaativat saman alkuperän, kirjautumisen ja CSRF-tunnisteen. Kirjautumisyrityksiä
rajoitetaan. HTTP-vastauksia ei välimuistiteta, eikä palvelin tulosta tekstejä tai
HTTP-tunnisteita lokiin. Pääsykoodi näytetään käynnistyksen yhteydessä omassa
terminaalissa.

Editorin API hyväksyy vain nimetyt muokattavat kentät. Tunnisteet, alkuperäiset
lähdesivut ja versiohistoria eivät ole muokattavissa lomakkeella. Näyttö käyttää
tekstisisältöä, ei artikkelista suoritettavaa HTML:ää. Säilytä Codespaces-portin
Private-rajaus; älä muuta sitä julkiseksi.

## Tarkistukset

```sh
python -m unittest discover -s scripts/editorial -p 'test_*.py'
bun run test src/test/article-editor.test.ts
node --check scripts/editorial/editor.js
bun run test src/test/turso-browser.test.ts
```

Testit kattavat kirjautumisrajan, väärän alkuperän, CSRF-tarkistuksen, oikean
SQL-tallennuksen, versionvaihdon, historiahaun, vanhentuneen tallennuksen
hylkäyksen, luonnoksen säilymisen sekä palautuksen ilman automaattista tallennusta.
