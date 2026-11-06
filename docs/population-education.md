# Koulutuksen väestöpohja ja toteutuneet oppilasmäärät

Tämä vaihe kytkee kouluikäisten määrän, kunnittaisen jakauman ja vuosiluokkien oppilasmäärät artikkeleihin **Kun koulutus ei enää takaa nousua** ja **Mitä varten me koulutamme?** Alkuperäistekstit säilyvät; tulkinnat ovat erillisiä versionoituja täydennyksiä. Rajattu kuvaileva näyttö ei tunnista koulutuspolitiikan kausaalivaikutusta.

## Havainnot

| Mittari | Aiempi havainto | Vuosi 2025 |
|---|---:|---:|
| 7–15-vuotiaat koko maassa | 588 468 (1990) | 542 378 |
| Vuosiluokkien 1–9 oppilaat | 555 283 (2020) | 536 104 |
| Ensimmäisen vuosiluokan oppilaat | 60 297 (2020) | 50 131 |
| Yhdeksännen vuosiluokan oppilaat | 60 494 (2020) | 66 383 |

Vuoden 2026 kuntajaolla 7–15-vuotiaiden määrä väheni vuosien 1990 ja 2025 välillä 250 kunnassa, kasvoi 57 kunnassa ja pysyi samana yhdessä. Mukana ovat kaikki 308 kuntaa, eivät vuoden 1990 hallinnolliset yksiköt. Kuntien ikäluokkien summat täsmäävät kansalliseen lukuun kummassakin päätevuodessa. Osakuntaliitoksia ei ole huomioitu liitosta edeltävien vuosien tiedoissa.

Valtakunnallinen määrä ei ole pienentynyt yhtäjaksoisesti: 7–15-vuotiaita oli 532 729 vuonna 2010 ja 542 378 vuonna 2025. Päätevuosien valinta muuttaa vertailua. Kuntien kahden päätevuoden ero ei osoita jatkuvaa supistumista tai kasvua eikä erittele syntyvyyden ja muuttoliikkeen osuuksia.

## Mitä tämä merkitsee artikkeleille?

Koulutuksen mahdollisuuksia ja tehtäviä koskevaa institutionaalista tulkintaa on täydennettävä väestön mittakaavalla ja sijainnilla. Koulutusjärjestelmä voi samanaikaisesti kohdata kasvavaa lapsimäärää joillakin alueilla ja pienenevien ikäluokkien saavutettavuuskysymyksiä toisilla. Valtakunnallinen oppilasmäärän lasku ei yksin osoita väljempää opetusta, parempia oppimistuloksia tai vastaavaa säästöä.

Vuoden 2025 ensimmäisen ja yhdeksännen luokan erikokoiset joukot ovat eri ikäluokkia. Niiden ero kuvaa eri koulutusvaiheiden samanaikaista mittakaavaa, ei samojen lasten etenemistä tai koulupudokkuutta. Tulos ei mittaa koulutuspaikkojen kapasiteettia, tutkinnon tuottoa tai sosiaalista liikkuvuutta.

## Käsitteet ja rajaukset

- **Asukasikäryhmä:** 7–15-vuotiaat vuoden viimeisenä päivänä, vuosittainen kansallinen sarja 1972–2025.
- **Kuntavertailu:** sama täsmällinen ikäraja ja vuoden 2026 kuntajako; päätevuodet 1990 ja 2025.
- **Oppilasjoukko:** vuosiluokat 1–9, koko maa, sukupuolet, opetuskielet ja oppilaitostyypit yhteensä; vuodet 2020–2025; pääsääntöisesti 20.9. poikkileikkaus.
- **Pois oppilasrajauksesta:** esiopetuksen, valmistavan opetuksen, kotiopetuksen sekä muiden erillisten vuosiluokkien luokat. Yleistä vuosiluokat yhteensä -lukua ei verrata ikäryhmään: sen kattavuus muuttui valmistavan opetuksen osalta 2022 ja kotiopetuksen osalta 2023.

Oppilaiden ikä voi poiketa tavallisesta vuosiluokan iästä ja viiteajankohdat eroavat. Oppilasjoukkoa ei siksi jaeta vuoden lopun 7–15-vuotiaiden määrällä osallistumisasteeksi. Näiden lukujen erotuksesta ei päätellä koulutuksen ulkopuolella olevien määrää. Väestön ja oppilastilaston eri aluejakoja ei yhdistetä kunnittaiseksi osallistumisasteeksi; oppilasvertailu on vain kansallinen.

Tämä vaihe ei tuota koulutuksen vuoden 2050 ennustetta. Ikäryhmää 7–15 ei arvioida ennen vuotta 1972 karkeista viisivuotisikäryhmistä. Aiempi yhteinen väestöpohja ja historialliset koululähteet säilyvät erillisinä.

## Lähteet ja toistaminen

- [StatFin 11re: väestö iän ja sukupuolen mukaan alueittain](https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__vaerak/11re.px/)
- [StatFin 133w: peruskoulun oppilaat](https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__opiskt/133w.px/)
- [Opiskelijat ja tutkinnot: menetelmä ja viiteajankohdat](https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/opiskt)

Lähteet tarkistettu 6.11.2026. Alkuperäiset API-vastaukset, metatiedot, kyselyt ja SHA-256-tiivisteet: `scripts/editorial/sources/population-education/`. Kansallisessa ikäaineistossa on 486 lähdesolua, kuntien päätevertailussa kansallinen summa mukaan lukien 5 562 ja oppilasaineistossa 54; summia ja osia ei tulkita toisistaan riippumattomiksi havainnoiksi.

Keruu: `python scripts/editorial/collect_population_education.py`. Tarkistukset: `python -m unittest discover -s scripts/editorial -p 'test_population_education.py'`. Keruu ei kirjoita tietokantaan. Tuonti säilyttää kolme yhteistä lähdekuvaa Turson `editorial__population_education`-taulussa ja kaksi artikkelikytkentää nykyisessä täydennystaulussa. Tuonti tarkistaa nykyisen artikkelirevision ja tekstitiivisteen sekä tallennuksen uudella yhteydellä.

Seuraava sisältöaukko koulutuksen osalta on oppilaitosverkon, koulumatkojen, ryhmäkokojen, opetushenkilöstön ja tuen tarpeen yhdistäminen samoihin alueisiin ja vuosiin. Oppimistulokset sekä myöhemmät koulutus- ja työurat tarvitsevat omat lähteensä.
