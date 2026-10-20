# Lainsäädännön rajattu täydennys 20.10.2026

Supabase-projekti: `murrosmatriisi` (`zzbubbrsgiqsvsovkkmf`). Erätunnus: `legislation_bounded_20261020`.

## Toteutettu

- Viidelle ennestään vahvistetulle kytkennälle (link_id 19–23) lisättiin lähteistetty evidenssi: avioliittolaki, kansaneläkejärjestelmän nykyinen jatkumo, oppivelvollisuuden nykyinen vertailukohta ja kaksi uuden vammaispalvelulain kytkentää.
- Torpparivapautukseen lisättiin vuoden 1918 lain tekstijäljennös ja vuoden 1919 toimeenpanoasetus. Lain Finlex-erottelutunnus on `1918/135-001`; sitä ei yhdistetty asetukseen `1918/135-026`. Vuoden 1919 asetuksen tunnus on `1919/46-001`.
- Maanhankintalakiin lisättiin historiallinen alkupykälien ote ja toimeenpanoasetukseen Kansallisarkiston aineisto-opas. Oppaan mukaan laki annettiin 5.5.1945 ja asetus 2.6.1945; näitä ei tallennettu lain/asetuksen voimaantulopäiviksi.
- Kansaneläkejärjestelmän korvaavuusketju: `1937/248 → 1956/347 → 2007/568`. Alkuperäislain 347/1956 99 § ja voimaanpanolain 569/2007 1 § osoittavat korvaavuuden. Vuoden 1937 alkuperäisteksti on yhä hankkimatta.
- Työeläkeketju: `1961/395 (TEL)` ja `1962/134 (LEL)` → `2006/395 (TyEL)`, voimaanpanolain `2006/396` 1–2 §:n perusteella. TEL ja LEL ovat rinnakkaisia järjestelmiä, eivät peräkkäisiä muutoslakeja.
- Vammaispalvelulain alkuperäisen 675/2023 41 §:n voimaantulopäivää ei käytetty vuoden 2025 alkamisen todisteena: muutoslaki 953/2023 tallennettiin erikseen.

## Tallennetut määrät

| Sisältö | Erässä käsitelty |
|---|---:|
| Lähdeasiakirjat | 18, joista 12 alkuperäistä XML:ää |
| Pykälä- ja voimaantulotekstit | 736 |
| Tarkistetut kortti–säädöskytkennät evidensseineen | 23 (16 uutta, 7 aiemmin olemassa) |
| Säädösten väliset relaatiot | 6 |
| Päivämäärätapahtumat | 12 |
| Oikeudelliset rahoitussäännöt | 5 |
| Ennen päivitystä säilytetyt linkki- ja evidenssitietueet | 7 |

Vahvistetut kytkennät kasvoivat 71:stä 87:ään. Vahvistettuja kytkentöjä ilman evidenssiriviä on tarkistuksen jälkeen **0**. Tämä ei tarkoita, että kaikkien kytkentöjen alkuperäisteksti tai vaikutusnäyttö olisi valmis.

## Ajallinen ja taloudellinen tulkinta

- Avioliittolaki: säädetty 1929, voimaan 1.1.1930 (235/1929 1 §).
- Oppivelvollisuuslaki 1214/2020: yleinen voimaantulo 1.8.2021; 25 § sisältää eri päivinä alkavia osia ja kohorttirajauksen. Vuoden 1921 kortin yhteys on institutionaalinen vertailuyhteys, ei suora oikeudellinen seuraantoväite eikä vuoden 1921 alkuperäistekstin korvike.
- Kansaneläkeuudistus: voimaan 1.1.1957; aikaisempien sääntöjen siirtymäkäyttöä mahdollista vuoden 1957 loppuun. Vuoden 2007 uusi laki voimaan 1.1.2008.
- TEL: voimaan 1.7.1962; kahden vuoden järjestämisaika ei siirrä työntekijän turvan alkua. LEL ja työnantajan maksuvelvollisuus alkoivat samana päivänä. TyEL voimaan 1.1.2007.
- Torpparilain 19–20 §: valtio rahoittaa säännöksen mukaisen lunastushinnan, mutta uuden omistajan on maksettava se takaisin. Vuotuismaksu on 6 % lunastushinnasta; korko on 5 % maksamatta olevasta pääomasta. Kyse ei ole 6 prosentin korosta eikä koko valtion maksun suuruisesta lopullisesta avustuksesta.
- Kansaneläkelain 347/1956 62 §: kuntaryhmien 10–30 % osuudet koskevat laissa määriteltyä kustannusosuusperustetta, eivät kaikkia eläkemenoja. 63 §:n valtion takuu koskee siinä määriteltyä rahoitusvajetta.

## Lähderajat

Historialliset HTML-jäljennökset on erotettu Finlexin alkuperäis-XML:istä. Niitä ei ole verrattu alkuperäispainatteiden kuviin. Maanhankintalain Agricola-ote sisältää vain alkupykäliä; rahoituspykäliä, koko lain sisältöä ja tarkkaa voimaantuloa ei päätelty siitä. Kansallisarkiston opas on toimeenpanon lähde, ei asetuksen alkuperäisteksti.

Vammaispalvelulain 675/2023 ja muutoksen 953/2023 pari on rajattu muutosketju. Se ei kata kaikkia vuosien 2024–2026 muutoksia eikä ole ajantasainen palveluoikeuksien ohje.

Oikeudellisista rahoitussäännöistä ei tuotettu toteutuneita menohavaintoja eikä kausaalivaikutuksia. Kuntakohtaiset toimeenpanokalenterit ja pitkät tulossarjat eivät kuulu tähän erään.

## Säilytys ja toistettavuus

Supabasen `statute_documents` säilyttää ladatut asiakirjat gzip+base64-muodossa sekä alkuperäisten lähdebytesien SHA-256-tiivisteet. XML:n jäsennellyt pykälät ja voimaantulotekstit ovat `statute_provisions`-taulussa. Historialliset tekstijäljennökset on poimittu erikseen nimetyiksi pykäliksi.

GitHubin JSON-liite on tutkimuksen lähde- ja kytkentämanifesti. Se sisältää lähdeosoitteet, tiivisteet, ajalliset tapahtumat, rahoitussäännöt ja avoimet kysymykset. Se ei sisällä pakattuja lähdetekstejä. Sivuston Excelistä tuotettua `src/data/lainsaadanto.json`-tiedostoa ei muokattu: manifestia ei vielä ladata käyttöliittymään. Päätöstunnisteet ovat toimituksellisia kohdennusapuja; esimerkiksi Kelan perustamista koskeva d029 on kansaneläkejärjestelmän kontekstikytkentä, ei väite kahden tapahtuman identtisyydestä.

Tarkistukset: kaikkien 18 ladatun lähdebytesin SHA-256 täsmäsi tallennettavaan pakattuun sisältöön; pykälätunnisteet olivat yksikäsitteisiä; rahoitussääntöjen pykäläviitteet löytyivät; tietokannan pykälätekstien SHA-256-poikkeamia oli 0. Viiden alkuperäisen evidenssiaukon poistuminen ja erän tapahtuma-/sääntömäärät tarkistettiin erillisillä tietokantakyselyillä. Taulurakenteita, käyttöoikeuksia tai RLS-politiikkoja ei muutettu.
