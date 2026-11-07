# Toimeentulotuen julkaistut kuntakohtaiset väestöosuudet

Täydennys `population-receipt-rates-2026-11-07-v1` liittää Kelan vuoden 2025 julkaisun **kaikki 292 kuntariviä** kahteen sosiaaliturvaa ja tuen tarvetta käsittelevään artikkeliin. Se ei korvaa aiempaa ikä- ja kotitalousjakaumaa eikä muuta artikkelien tekstiä.

Lähde: [Kelan perustoimeentulotukitilasto 2025](https://tilastojulkaisut.tietotarjotin.fi/perustoimeentulotuki/2025/), katsaus 3.4, kuvio 3 ja sen saavutettava taulukko `Kunta / Saajat / Osuus, %`. Tarkistettu 7.11.2026. Raakaa HTML:ää ei tarvita julkaistussa repossa: numeerinen poiminta, tarkka paikannin, poimintakoodi ja alkuperäisen vastauksen SHA-256 säilytetään.

| Julkaistu saajaosuus | Kuntia |
|---|---:|
| Alle 3 % | 73 |
| 3–alle 6 % | 176 |
| 6–alle 9 % | 34 |
| Vähintään 9 % | 9 |
| Yhteensä | 292 |

Luokkarajat ovat toimitukselliset, ja ne käyttävät lähteen yhden desimaalin prosentteja. Rajatapaus voi riippua pyöristyksestä. Kuntien painottamaton mediaani on 3,9 %. Se kuvaa kuntien jakaumaa; sitä ei esitetä väestön kansallisena osuutena eikä tyypillisen asukkaan todennäköisyytenä.

## Mitä tämä vahvistaa

Kansallinen etuuden saajamäärä ei kuvaa paikallisten osuuksien vaihtelua. Valmis lähteen väestöosuus tuo vertailuun nimittäjän, mutta alueiden väestörakennetta ei ole vakioitu. Paikallinen tuen käyttö ja todellinen tarve pysyvät eri käsitteinä. Näistä osuuksista ei voi päätellä alikäyttöä, kunnan vaikutusta tai tietyn uudistuksen tulosta.

## Säilytetyt rajoitukset

- Kattavuus on nimenomaan julkaisun 292 kuntariviä, ei kaikkien 308 Suomen kunnan taulukko.
- Lähteen kuntakuvion päiväys on 31.12.2025; saajien vuotuista kertymää ei tulkita tietyn päivän etuudensaajien määräksi tai etuudelle tulon riskiksi.
- Kuntarivien saajalukujen summa on 385 901, kansallisen ikätaulukon henkilömäärä 365 029. Rivit eivät ole additiivinen kansallinen henkilöjako; eron syytä ei tunnisteta tässä. Tarkistus estää näiden yhdistämisen samaksi laskentayksiköksi.
- Kuntaprosenteista ei lasketa kansallista keskiarvoa eikä pyöristetyistä prosenteista rekonstruoida väestölukuja.
- Ikäryhmäosuudet jäävät avoimiksi, kunnes saajaiän ja väestöiän viiteajankohta sekä maantiede on täsmäytetty.
- Kyse on yhdestä vuodesta, ei ajallisesta kehityksestä tai tulevaisuusennusteesta.

## Tallennus ja varmennus

Lähdeanalyysi tallennetaan versioituna `editorial__population_receipt_rates`-tauluun. Kaksi tarkkaan artikkelikatkelmaan sidottua täydennystä näkyy editorin nykyisessä analyysikerroksessa. Artikkelitekstit kulkevat salattuna; julkinen repository sisältää lähdenumerot ja menetelmän.

Tuonti tarkistaa artikkelirevision ja tekstin tiivisteen ennen kirjoitusta, lukee lähdeanalyysin ja molemmat täydennykset takaisin uudella tietokantayhteydellä sekä varmistaa alkuperäisten tekstien säilymisen. Seitsemän erillistä testiä tarkistaa kuntakattavuuden, kaksoisrivit, virheelliset prosentit, laskentayksiköiden eron ja kielletyt päätelmät.
