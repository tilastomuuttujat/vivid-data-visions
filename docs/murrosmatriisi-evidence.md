# Murrosmatriisin näyttöaineiston tuonti

Murrokset → **Näyttö ja toteutuminen** näyttää tietokannan julkaistun aineiston
ensimmäisen rajatun vientierän: 8 tapauskorttia, 9 murrosjaksoa, 73 mittari–ryhmä-
vertailua, 15 toimeenpanokokonaisuutta ja niiden 33 lähdeväitettä. Mukana ovat
vertailujen 23 sarjan täsmälliset lähdehavainnot: 583 vuosihavaintoa ja 12
historiallista jaksohavaintoa. Tämä ei ole koko murrosmatriisin tietokantavienti.

`src/data/murrosmatriisi-evidence.json` on erillinen versioitu julkaisuaineisto.
Sen muokkauslähde on murrosmatriisi; tiedostoa ei ylläpidetä käsin käyttöliittymässä.
Tietokannan UUID:t, sarja-, ryhmä-, jakso-, säädös- ja toteutustunnisteet säilyvät.
Vanhaa TTT-verkostoa tai Excel-päätösten tunnuksia ei korvata eikä niihin tehdä
vuosiluvun tai otsikon perusteella oletettuja täsmävastaavuuksia.

## Päivittäminen

1. Aja `scripts/data/export-murrosmatriisi-evidence.sql` murrosmatriisin
   autentikoidulla SQL-yhteydellä. Kysely on vain luku: se valitsee julkaistut
   tapauskortit ja niiden käyttämät täsmälliset havaintoavaimet yhdessä MVCC-
   tilannekuvassa. Se ei vaadi selaimeen tietokantatunnuksia eikä avaa uusia API-
   oikeuksia. Tallenna tuloksen `snapshot`-kentän JSON esimerkiksi `/tmp/capture.json`.
2. Muodosta ja validoi julkaisuaineisto:

   ```sh
   python3 scripts/data/import-murrosmatriisi-evidence.py --input /tmp/capture.json
   bun run typecheck
   bun run test
   bun run test:data
   bun run build:site
   ```

3. Tarkista aineistomuutokset ja niiden rajaukset ennen PR:n yhdistämistä.
   Säilytä lähteiden alkuperäiset varmennustasot. Testien nykyiset kattavuusluvut
   ovat version ankkureita: muuta ne perustellusti aineistoerän muuttuessa.

Tuonti pysähtyy julkaisemattomaan tai puuttuvaan lähteeseen, kaksoisavaimeen,
lähdearvon tai tarkistusasteen eroon, virheelliseen jaksokeskiarvoon tai
päätepistevertailuun sekä toteumatiedoksi muutettuun ennakkoarvioon. Vuosittaiseen
kuvaajaan sallitaan `mixed`-taulukosta vain havainto, jonka periodi on täsmälleen
kyseinen vuosi. Monivuotisjaksoja ei vuosittaisteta. Tallenteen ja julkaisuaineiston
SHA-256-tunnisteet säilyvät; Python-testit tarkistavat julkaisuaineiston tunnisteen.
Raakatallennetta, tunnuksia tai muuta tietokantasisältöä ei tarvitse julkaista.

## Lukeminen

- Jokaisella mittarilla on oma yksikkönsä ja mukautuva pystyakselinsa. Kuvaaja
  ei rinnasta eri yksiköiden vaikutuskokoja. Estimaatit erotetaan havainnoista.
- Puuttuva vuosi ja kirjattu määritelmäkatkos katkaisevat viivan. Katkos voi
  estää jaksokeskiarvon ja päätepistevertailun laskemisen.
- Keskeneräinen seurantaikkuna näytetään keskeneräisenä. Tulevia vuosia ei
  täytetä eikä vertailun päätepistettä siirretä viimeisimpään havaintoon.
- Päätöksen antaminen, voimaantulo ja toimeenpanon aloitus ovat eri tapahtumia.
  Päivämäärien aiempi varmennustila näytetään, eikä vienti paranna sitä.
- Toteutusrekisterissä ennakkoarvio, lähteen saatavuustieto, kertymä tiettyyn
  päivään ja myöhempi palvelukattavuus säilyvät erillisinä. Avointa aikajaksoa
  ei muuteta yhdeksi toteumavuodeksi. Toteutustieto voi ulottua valitun
  murrosjakson seurantaa myöhemmäksi.
- Tapauskortit ovat edelleen hypoteeseja. Laskentatarkistus, ajallinen yhteys
  ja myöhempi palvelukattavuus eivät osoita päätöksen syyvaikutusta.

Näkymä ladataan vasta välilehden avautuessa verkkosovelluksessa. Sama komponentti
ja aineisto sisältyvät myös nykyiseen standalone-koosteeseen ja ZIP-paketteihin.
Kolmen ulkoisen perus-JSON-tiedoston latausmenettely säilyy; uusi näyttöaineisto
on buildissä mukana, joten selaimessa ei tarvita Supabase-yhteyttä.
