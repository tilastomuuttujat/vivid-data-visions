# Alkuperäisten kuvien Turso-arkisto

## Rajaus ja käyttötarkoitus
Supabasen atlas-images-bucketissa on 288 alkuperäistä WebP-kuvaa, yhteensä 70468014 tavua (70,47 Mt).
Bucket on lähteessä julkinen, mutta arkiston kirjoitus ja tarkistus tapahtuvat Actionsin palvelinavaimilla.
Kaikki 288 tallennuksessa olevaa tiedostoa otetaan talteen, myös metatietolinkkeihin kytkemättömät.
Turson storage__atlas_images_v1 sisältää bucketin, tarkan tiedostonimen, lähteen objektitunnisteen ja valikoidun version metatiedot, MIME-tyypin, tavumäärän, SHA256-tiivisteen ja alkuperäisen BLOB-sisällön.
HTTP-siirrossa BLOB koodataan base64:ksi; tietokantaan tallentuu binääritiedosto, ei base64-teksti. Ei pakkaamista, skaalausta, konversiota tai kuvan muokkausta.

Tämä on arkistokopio. Nykyisiä source_path/storage_path-arvoja, verkkosivun kuvayhteyksiä tai julkaisemista ei muuteta.
Kuvien näyttäminen Tursosta tarvitsee myöhemmin palvelinrajapinnan tai erillisen tiedostojakelun. Turso-tokenia ei viedä selaimeen.
Auth-, yhdistys- ja maksutiedot eivät kuulu tähän tehtävään.

## Käynnistys
Siirtokoodin tai workflow'n yhdistäminen päähaaraan käynnistää kirjoitusajon.
Manuaalisesti Actions → Turso image archive → Run workflow → main → Archive and verify original images in Turso.
Samat SUPABASE_READ_KEY ja TURSO_AUTH_TOKEN. Ei uusia Supabase-RPC:itä, skeema- tai käyttöoikeusmuutoksia.
Ilman kirjoitusvalintaa tarkistetaan tiedostolista ja metatietoviitteet, ei itse binääritiedostoja.
Yhteinen concurrency-ryhmä estää päällekkäiset siirrot.

## Varmennus ja uudelleenkäynnistys
Storage API -listaus sivutetaan nimijärjestyksessä. Lukumäärän, nimien yksikäsitteisyyden ja yhteiskoon pitää vastata hyväksyttyä lähdettä.
Nykyinen bucket on tasainen; odottamaton alikansio tai uusi tiedostotyyppi pysäyttää ajon uutta inventaariota varten.
Yksittäisen tiedoston siirtoraja on 1 MiB; lähteen suurin tiedosto on 366560 tavua.
Lataus tarkistaa koon, MIME-tyypin ja WebP-tunnisteen. Lähdepyyntöjen uudelleenohjauksia ei seurata, jotta palvelinavain ei siirry toiselle palvelimelle.

Jokainen tiedosto hashataan SHA256:lla, lisätään puuttuessa atomisesti, luetaan BLOBina takaisin ja verrataan kaikkiin tavuihin sekä tiivisteeseen.
Poikkeavaa arkistokopiota ei korvata tai poisteta.
Keskeytyksen jälkeen uusi ajo aloittaa tarkistuksen alusta ja käyttää vastaavat jo tallennetut tiedostot uudelleen; se ei lataa päälle eri sisältöä.
50 minuutin aikabudjetti tuottaa PARTIAL ja exit 2 ennen workflow'n 60 minuutin rajaa. Käynnistä sama kirjoitusajo uudelleen.
Lopussa kohteen kaikki nimet, tavumäärät, BLOB-pituudet ja tiivisteet verrataan siirtomanifestiin.
Lähdelista versiotietoineen ja infografiikkojen viitteet luetaan uudelleen muutosten havaitsemiseksi. Pidä kuvat ja metatiedot muuttumattomina siirron ajan; tämä ei ole atominen lähdetilannekuva.
Valmis manifesti kirjataan storage__image_archive_runs_v1-tauluun.

Odotettu loppu:
PASS: Image archive complete; 288 original files, 70468014 bytes, SHA256 readback verified.
REFERENCE GAPS: 5 missing source paths recorded; no inferred remapping. Image serving remains unchanged.

## Lähteessä jo olevat viitepuutteet
Infographics-taulussa on 288 riviä ja 286 erillistä tiedostopolkua. Viisi polkua ei löydy lähteen Storage-bucketista:
- M18_kriisien_piirteet.webp
- M17_onnistumisten_piirteet.webp
- G08_oikeudenmukaisuus.webp
- G09_sukupolvi_kantaa.webp
- G07_tulevien_oikeudet.webp

Tallennuksessa on seitsemän objektia, joita ei käytetä täsmälleen samannimisinä infografiikkaviitteinä. Niitä ei yhdistetä näihin puuttuviin polkuihin nimien samankaltaisuuden perusteella.
storage__atlas_image_links_v1 kirjaa kaikki 288 metatietoviitettä: archived tai missing_in_source.
Ennen auditointia aiemmin Tursoon kopioidun public__infographics-taulun id/polku-parit verrataan uudelleen lähteeseen. Itse viitteitä ei muokata.
Arkiston PASS vahvistaa kaikkien olemassa olevien objektien säilymisen; se ei väitä kaikkien verkkosivun kuvalinkkien toimivan. Viisi puuttuvaa viitettä pitää selvittää sisällön perusteella ennen lopullista käyttöönottoa.

## Testaus
python -m unittest discover -s scripts/migration -p 'test_turso*.py'
Kaikki 63 testiä läpäisivät paikallisesti: kahdeksan kuva-arkiston testiä sisältävät tarkan BLOB-takaisinluvun, base64-esityksen, uudelleenajon, korruptoituneen kohteen hylkäämisen, tiedostonimen URL-koodauksen, virheellisen latauksen/listauksen, viitepuutteiden kirjaamisen, redirect-kiellon ja aikabudjetin.
Kuvien sisältöä tai tunnuksia ei tallenneta julkisiksi Actions-artifakteiksi tai lokiin.
