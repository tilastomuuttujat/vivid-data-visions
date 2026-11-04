# Päivitettävä artikkelikirjasto Tursossa

Artikkelit ovat nykyisen murrosmatriisi-kannan erillinen `editorial__`-kokonaisuus.
Se ei korvaa vanhaa `public__articles`-siirtokopiota. Uudet tekstit eivät kuulu
sivuston julkiseen Turso-vientiin. Tila `published` on toimituksellinen merkintä;
se ei yksin julkaise tekstiä verkkosivulle.

## Taulut

| Kohde | Käyttö |
| --- | --- |
| `editorial__articles` | Muokattavat nykyiset artikkelit |
| `editorial__article_catalog` | Tiivis luettelo ja nykyisen version numero |
| `editorial__article_revisions` | Automaattisesti tallentuvat täydet tekstiversiot |
| `editorial__sources` | Alkuperäisen PDF:n tunniste, tiiviste ja lähdeviite |
| `editorial__source_pages` | Alkuperäisen PDF:n tekstipoiminta sivuittain |

PDF:n 210 sivua muodostavat 34 erillistä artikkeliosuutta. Lähteen numero 22
esiintyy kahdesti. Kahdella otsikolla on kaksi erillistä tekstiä. Otsikko tai
painettu numero ei ole tietokannan avain: jokaisella osuudella on pysyvä UUID.
Päällekkäisyydet on merkitty `review_flags_json`-kenttään tarkistamista varten;
mitään ei yhdistetä automaattisesti. Lähteen hakasulkeissa olevat keskeneräiset
viitteet ja muut toimitukselliset merkinnät säilyvät tekstissä.

## Selainpohjainen artikkelieditori

Katso [artikkelieditorin käyttöönotto](article-editor.md). Se tarjoaa hakemiston,
muokkauslomakkeen, versiohistorian ja palautuksen Turson taulueditorin rinnalle.

## Muokkaaminen iPadilla

1. Avaa Turson murrosmatriisi-tietokanta ja **Edit Data**.
2. Avaa `editorial__articles`, etsi rivi otsikon tai `source_position`-järjestyksen avulla.
3. Muuta `title`-otsikkoa tai `body_text`-tekstiä. `summary` on tiivistelmä,
   `tags_json` JSON-taulukko (esimerkiksi `["koulutus","työ"]`).
4. Valitse tarvittaessa `status`: `draft` (luonnos), `review` (tarkistettavana),
   `published` (julkaistu toimituksellisesti) tai `archived` (arkistoitu).
5. Kirjoita muutoksen syy `change_note`-kenttään samalla tallennuksella.

Tietokantatriggeri tallentaa sekä nykyisen että kaikki aiemmat versiot.
`editorial_note` on vapaamuotoinen toimituksellinen huomautus. Alkuperäisiä
UUID-tunnisteita, lähdesivuja ja lähdenumeroita ei muokata. Poistamisen sijasta
käytetään arkistointitilaa. Versiohistoriaa ja lähdesivujen tekstiä ei voi
vahingossa korvata tavallisella UPDATE/DELETE-kyselyllä.

PDF:stä tuotu `body_text` on tavallista tekstiä. Kappaleet ja rivinvaihdot säilyvät,
mutta PDF:n typografian, kuvien tai taulukoiden täydellistä toisintoa ei luvata.
Alkuperäinen PDF säilyy lähdeviitteen takana; sen tavutiiviste ja kaikkien 210
sivun alkuperäinen tekstipoiminta säilytetään erikseen.

## Päivittäminen ohjelmallisesti

Avainta käytetään vain luotetussa ympäristössä `TURSO_AUTH_TOKEN`-muuttujasta.
Älä lisää sitä lähdekoodiin, selaimeen tai komentohistoriaan. Päivitä tekstistä
UTF-8-tiedostosta käyttäen luettelosta haettua pysyvää tunnistetta ja versiota:

```sh
python scripts/editorial/articles.py update --id ARTIKKELIN_UUID --expected-revision 1 --body-file teksti.txt --note 'Täsmennetty johtopäätöstä'
```

Työkalu hylkää vanhentuneen version ja varmistaa tallennetun tekstin sekä uuden
version ennen transaktion vahvistamista. Suora Turso-editorin muokkaus tallentaa
historian, mutta ei tarjoa tätä käyttöliittymästä riippumatonta versiovarausta.

Aiemman version palautus tehdään kopioimalla valitun historiaversion teksti
nykyiseen artikkeliin. Palautus muodostaa uuden version; historiaa ei poisteta.

## Tuonnin ja tietojen tarkistus

GitHub Actionsin **Turso article library** → **Run workflow** → `verify` tarkistaa
artikkelien nykyiset tekstit, historian jatkuvuuden ja lähdesivujen määrän.
Lokeihin tulostetaan vain määriä, ei tekstejä tai avaimia.

Alkutuonti käyttää erillistä palvelinavaimella rajattua väliaikaista siirtokanavaa,
joka poistetaan vasta onnistuneen Turso-lukuvertailun jälkeen. Repo sisältää vain
koodin, keinotekoiset testitekstit ja tuonnin tiivisteet/määrät. Varsinainen PDF tai
artikkelitekstit eivät ole julkisessa Git-historiassa. Alkutuontia ei voi toistaa
väliaikaisen kanavan poistamisen jälkeen ilman aineiston uutta valmistelua.
Paikallinen `import-json` tukee saman varmennetun paketin uudelleenajoa: se
vertaa alkuperäistä versiota ja säilyttää myöhemmät toimitukselliset muutokset.

Uusiin artikkeleihin käytetään uusia UUID-tunnisteita ja uutta lähdeviitettä;
samanniminen tai uudelleen numeroitu teksti ei saa vahingossa korvata vanhaa.
